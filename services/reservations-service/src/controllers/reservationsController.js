// ============================================================
// Controlador de Reservaciones
// RF: consulta, creación, check-in y cancelación
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Reserva } from '../entities/Reserva.js';

const reservaRepo = () => AppDataSource.getRepository(Reserva);
const ROOMS_URL = process.env.ROOMS_SERVICE_URL || 'http://localhost:3002';

const activeReservationStates = ['Pendiente', 'Activa', 'Confirmada', 'CheckIn'];
const blockedRoomStates = ['Sucia', 'En Mantenimiento', 'Mantenimiento', 'Ocupada', 'Reservada'];

// --- Crear reserva (RF-02) ---
export const createReservation = async (req, res) => {
  try {
    const { huespedId, habitacionId, fecha_inicio, fecha_fin, notas } = req.body;

    if (!huespedId || !habitacionId || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        error: 'huespedId, habitacionId, fecha_inicio y fecha_fin son requeridos',
      });
    }

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    let habitacion;
    try {
      const roomRes = await axios.get(`${ROOMS_URL}/${habitacionId}`);
      habitacion = roomRes.data;
    } catch {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }

    if (blockedRoomStates.includes(habitacion.estado)) {
      return res.status(409).json({
        error: `No se puede reservar la habitación ${habitacion.numero}: estado actual "${habitacion.estado}"`,
      });
    }

    const conflicto = await reservaRepo()
      .createQueryBuilder('r')
      .where('r.habitacionId = :habitacionId', { habitacionId: parseInt(habitacionId) })
      .andWhere('r.estado IN (:...estados)', { estados: activeReservationStates })
      .andWhere('r.fecha_inicio < :fecha_fin', { fecha_fin })
      .andWhere('r.fecha_fin > :fecha_inicio', { fecha_inicio })
      .getOne();

    if (conflicto) {
      return res.status(409).json({ error: 'Ya existe una reserva activa para esa habitación en ese rango de fechas' });
    }

    const noches = Math.ceil((new Date(fecha_fin) - new Date(fecha_inicio)) / (1000 * 60 * 60 * 24));
    const total = parseFloat(habitacion.tarifa_base || 0) * noches;

    const reserva = reservaRepo().create({
      huespedId: parseInt(huespedId),
      habitacionId: parseInt(habitacionId),
      habitacionNumero: habitacion.numero,
      fecha_inicio,
      fecha_fin,
      estado: 'Pendiente',
      total,
      notas,
    });

    const guardada = await reservaRepo().save(reserva);

    try {
      await axios.patch(
        `${ROOMS_URL}/${habitacionId}/estado`,
        { estado: 'Reservada' },
        { headers: { 'x-user-rol': req.headers['x-user-rol'] || 'Sistema' } }
      );
    } catch (error) {
      await reservaRepo().delete(guardada.id);
      return res.status(502).json({
        error: 'No se pudo reservar la habitación en rooms-service',
        detalle: error.message,
      });
    }

    res.status(201).json({ mensaje: 'Reserva creada exitosamente', reserva: guardada });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar reservas (incluye filtros de rango para disponibilidad) ---
export const getReservations = async (req, res) => {
  try {
    const {
      estado,
      huespedId,
      habitacionId,
      fecha_inicio,
      fecha_fin,
      estadosActivos,
    } = req.query;

    const qb = reservaRepo().createQueryBuilder('r');

    if (estado) {
      qb.andWhere('r.estado = :estado', { estado });
    }

    if (estadosActivos) {
      const estados = estadosActivos.split(',').map(s => s.trim()).filter(Boolean);
      if (estados.length > 0) {
        qb.andWhere('r.estado IN (:...estados)', { estados });
      }
    }

    if (huespedId) {
      qb.andWhere('r.huespedId = :huespedId', { huespedId: parseInt(huespedId) });
    }

    if (habitacionId) {
      qb.andWhere('r.habitacionId = :habitacionId', { habitacionId: parseInt(habitacionId) });
    }

    if (fecha_inicio && fecha_fin) {
      qb.andWhere('r.fecha_inicio < :fecha_fin', { fecha_fin })
        .andWhere('r.fecha_fin > :fecha_inicio', { fecha_inicio });
    }

    qb.orderBy('r.createdAt', 'DESC');

    const reservas = await qb.getMany();
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

// --- Check-in (RF-03) ---
export const checkIn = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado !== 'Pendiente') {
      return res.status(409).json({ error: `No se puede hacer check-in desde estado ${reserva.estado}` });
    }

    try {
      await axios.patch(
        `${ROOMS_URL}/${reserva.habitacionId}/estado`,
        { estado: 'Ocupada' },
        { headers: { 'x-user-rol': req.headers['x-user-rol'] || 'Sistema' } }
      );
    } catch (error) {
      return res.status(502).json({
        error: 'No se pudo actualizar la habitación a Ocupada',
        detalle: error.message,
      });
    }

    reserva.estado = 'Activa';
    reserva.fecha_checkin = new Date();
    const actualizada = await reservaRepo().save(reserva);

    res.json({ mensaje: 'Check-in realizado', reserva: actualizada });
  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cancelar reserva (RF-05) ---
export const cancelReservation = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado === 'Activa' || reserva.estado === 'CheckIn') {
      return res.status(409).json({ error: 'No se puede cancelar una reserva con check-in realizado' });
    }

    if (reserva.estado === 'Cancelada') {
      return res.status(409).json({ error: 'La reserva ya está cancelada' });
    }

    try {
      await axios.patch(
        `${ROOMS_URL}/${reserva.habitacionId}/estado`,
        { estado: 'Disponible' },
        { headers: { 'x-user-rol': 'Sistema' } }
      );
    } catch (error) {
      return res.status(502).json({
        error: 'No se pudo liberar la habitación en rooms-service',
        detalle: error.message,
      });
    }

    reserva.estado = 'Cancelada';
    const actualizada = await reservaRepo().save(reserva);
    res.json({ mensaje: 'Reserva cancelada', reserva: actualizada });
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
