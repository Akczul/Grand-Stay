// ============================================================
// Controlador de Reservaciones
// Ciclo completo: consulta, reserva, check-in, check-out
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Reserva } from '../entities/Reserva.js';

const reservaRepo = () => AppDataSource.getRepository(Reserva);

const ROOMS_URL = process.env.ROOMS_SERVICE_URL || 'http://localhost:3002';
const BILLING_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3005';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3007';

// Generar código de acceso aleatorio de 6 caracteres
const generarCodigoAcceso = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// --- Crear reserva ---
export const createReservation = async (req, res) => {
  try {
    const { habitacionId, fecha_inicio, fecha_fin, huespedNombre, huespedEmail, notas } = req.body;
    const huespedId = parseInt(req.headers['x-user-id']);

    if (!habitacionId || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'habitacionId, fecha_inicio y fecha_fin son requeridos' });
    }

    // Validar que fecha_fin > fecha_inicio
    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    // Consultar estado de la habitación en rooms-service
    let habitacion;
    try {
      const response = await axios.get(`${ROOMS_URL}/${habitacionId}`);
      habitacion = response.data;
    } catch {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }

    // REGLA: Habitación en "Sucia" o "Mantenimiento" NO puede ser reservada
    if (habitacion.estado === 'Sucia' || habitacion.estado === 'Mantenimiento') {
      return res.status(400).json({
        error: `La habitación ${habitacion.numero} está en estado "${habitacion.estado}" y no puede ser reservada`,
      });
    }

    if (habitacion.estado === 'Ocupada') {
      return res.status(400).json({
        error: `La habitación ${habitacion.numero} está ocupada`,
      });
    }

    // Verificar que no exista otra reserva activa para la misma habitación en esas fechas
    const conflicto = await reservaRepo()
      .createQueryBuilder('r')
      .where('r.habitacionId = :habitacionId', { habitacionId })
      .andWhere('r.estado IN (:...estados)', { estados: ['Pendiente', 'Confirmada', 'CheckIn'] })
      .andWhere('r.fecha_inicio < :fecha_fin', { fecha_fin })
      .andWhere('r.fecha_fin > :fecha_inicio', { fecha_inicio })
      .getOne();

    if (conflicto) {
      return res.status(409).json({ error: 'Ya existe una reserva para esas fechas en esta habitación' });
    }

    // Calcular total: tarifa_base * número de noches
    const noches = Math.ceil((new Date(fecha_fin) - new Date(fecha_inicio)) / (1000 * 60 * 60 * 24));
    const total = parseFloat(habitacion.tarifa_base) * noches;

    const codigoAcceso = generarCodigoAcceso();

    const reserva = reservaRepo().create({
      huespedId,
      huespedNombre: huespedNombre || decodeURIComponent(req.headers['x-user-nombre'] || ''),
      huespedEmail: huespedEmail || '',
      habitacionId,
      habitacionNumero: habitacion.numero,
      fecha_inicio,
      fecha_fin,
      estado: 'Confirmada',
      total,
      codigoAcceso,
      notas,
    });

    const guardada = await reservaRepo().save(reserva);

    // Notificar por email (confirmación de reserva + código de acceso)
    try {
      await axios.post(`${NOTIFICATIONS_URL}/notify`, {
        tipo: 'confirmacion_reserva',
        destinatario: huespedEmail,
        datos: {
          nombre: reserva.huespedNombre,
          habitacion: habitacion.numero,
          tipo: habitacion.tipo,
          fecha_inicio,
          fecha_fin,
          total,
          codigoAcceso,
          noches,
        },
      });
    } catch (notifError) {
      console.warn('⚠️ No se pudo enviar notificación:', notifError.message);
    }

    res.status(201).json({ mensaje: 'Reserva creada exitosamente', reserva: guardada });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar reservas ---
export const getReservations = async (req, res) => {
  try {
    const { estado, huespedId } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (huespedId) where.huespedId = parseInt(huespedId);

    const reservas = await reservaRepo().find({ where, order: { createdAt: 'DESC' } });
    res.json(reservas);
  } catch (error) {
    console.error('Error listando reservas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener reserva por ID ---
export const getReservationById = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(reserva);
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Check-in ---
export const checkIn = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Recepcionista' && rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo Recepcionista o Administrador pueden hacer check-in' });
    }

    const reserva = await reservaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado !== 'Confirmada') {
      return res.status(400).json({ error: `No se puede hacer check-in. Estado actual: ${reserva.estado}` });
    }

    reserva.estado = 'CheckIn';
    const actualizada = await reservaRepo().save(reserva);

    // Marcar habitación como Ocupada
    try {
      await axios.patch(`${ROOMS_URL}/${reserva.habitacionId}/estado`, { estado: 'Ocupada' }, {
        headers: { 'x-user-rol': rol },
      });
    } catch (err) {
      console.warn('⚠️ No se pudo actualizar estado de habitación:', err.message);
    }

    res.json({ mensaje: 'Check-in realizado', reserva: actualizada });
  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Check-out: genera factura automáticamente ---
export const checkOut = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Recepcionista' && rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo Recepcionista o Administrador pueden hacer check-out' });
    }

    const reserva = await reservaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado !== 'CheckIn') {
      return res.status(400).json({ error: `No se puede hacer check-out. Estado actual: ${reserva.estado}` });
    }

    reserva.estado = 'CheckOut';
    const actualizada = await reservaRepo().save(reserva);

    // Marcar habitación como Sucia tras check-out
    try {
      await axios.patch(`${ROOMS_URL}/${reserva.habitacionId}/estado`, { estado: 'Sucia' }, {
        headers: { 'x-user-rol': rol },
      });
    } catch (err) {
      console.warn('⚠️ No se pudo actualizar estado de habitación:', err.message);
    }

    // REGLA: Check-out genera automáticamente la factura
    let factura = null;
    try {
      const facturaRes = await axios.post(`${BILLING_URL}/generar`, {
        reservaId: reserva.id,
      });
      factura = facturaRes.data.factura;
    } catch (err) {
      console.warn('⚠️ No se pudo generar factura automática:', err.message);
    }

    // Notificar factura electrónica por email
    if (factura && reserva.huespedEmail) {
      try {
        await axios.post(`${NOTIFICATIONS_URL}/notify`, {
          tipo: 'factura_electronica',
          destinatario: reserva.huespedEmail,
          datos: {
            nombre: reserva.huespedNombre,
            habitacion: reserva.habitacionNumero,
            fecha_inicio: reserva.fecha_inicio,
            fecha_fin: reserva.fecha_fin,
            subtotal: factura.subtotal,
            consumos_total: factura.consumos_total,
            total_final: factura.total_final,
            fecha_emision: factura.fecha_emision,
          },
        });
      } catch (notifError) {
        console.warn('⚠️ No se pudo enviar factura electrónica:', notifError.message);
      }
    }

    res.json({
      mensaje: 'Check-out realizado exitosamente',
      reserva: actualizada,
      factura,
    });
  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cancelar reserva ---
export const cancelReservation = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado === 'CheckOut' || reserva.estado === 'Cancelada') {
      return res.status(400).json({ error: 'No se puede cancelar esta reserva' });
    }

    // Si estaba en CheckIn, liberar habitación
    if (reserva.estado === 'CheckIn') {
      try {
        await axios.patch(`${ROOMS_URL}/${reserva.habitacionId}/estado`, { estado: 'Disponible' }, {
          headers: { 'x-user-rol': req.headers['x-user-rol'] || 'Administrador' },
        });
      } catch (err) {
        console.warn('⚠️ No se pudo liberar habitación:', err.message);
      }
    }

    reserva.estado = 'Cancelada';
    const actualizada = await reservaRepo().save(reserva);
    res.json({ mensaje: 'Reserva cancelada', reserva: actualizada });
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
