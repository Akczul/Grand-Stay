// ============================================================
// Controlador de Reservaciones (esquema unificado grandstay_db)
// Maneja: huéspedes, reservas, check-in y check-out.
// Triggers DB cambian estado de habitación al insertar checkin/checkout.
// ============================================================

import crypto from 'crypto';
import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Reserva } from '../entities/Reserva.js';
import { Huesped } from '../entities/Huesped.js';
import { CheckIn } from '../entities/CheckIn.js';
import { CheckOut } from '../entities/CheckOut.js';

const reservaRepo  = () => AppDataSource.getRepository(Reserva);
const huespedRepo  = () => AppDataSource.getRepository(Huesped);
const checkinRepo  = () => AppDataSource.getRepository(CheckIn);
const checkoutRepo = () => AppDataSource.getRepository(CheckOut);

const ROOMS_URL         = process.env.ROOMS_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3007';

const ESTADOS_ACTIVOS = ['pendiente', 'confirmada'];

// --- helpers --------------------------------------------------
const generarCodigoConfirmacion = () =>
  'GS' + crypto.randomBytes(5).toString('hex').toUpperCase(); // p. ej. GSAB12CD34

const calcularNoches = (entrada, salida) =>
  Math.max(1, Math.ceil((new Date(salida) - new Date(entrada)) / 86400000));

// Busca o crea un huésped a partir de los datos provistos
const obtenerOCrearHuesped = async (data) => {
  if (!data) return null;

  if (data.id_huesped) {
    return huespedRepo().findOne({ where: { id_huesped: parseInt(data.id_huesped, 10) } });
  }

  const num_documento = data.num_documento;
  const tipo_documento = data.tipo_documento || 'CC';
  if (!num_documento) return null;

  const existente = await huespedRepo().findOne({ where: { num_documento, tipo_documento } });
  if (existente) return existente;

  const nuevo = huespedRepo().create({
    id_usuario:           data.id_usuario || null,
    nombres:              data.nombres || data.nombre || 'Sin nombre',
    apellidos:            data.apellidos || data.apellido || '-',
    tipo_documento,
    num_documento,
    nacionalidad:         data.nacionalidad || 'Colombia',
    fecha_nacimiento:     data.fecha_nacimiento || null,
    genero:               data.genero || null,
    telefono:             data.telefono || null,
    email:                data.email || `${num_documento}@sin-correo.local`,
    ciudad:               data.ciudad || null,
    pais:                 data.pais || 'Colombia',
    consentimiento_datos: !!data.consentimiento_datos,
    fecha_registro:       new Date(),
  });
  return huespedRepo().save(nuevo);
};

// --- Crear reserva --------------------------------------------
export const createReservation = async (req, res) => {
  try {
    const {
      huesped,
      id_huesped,
      id_habitacion,
      id_tipo_habitacion,
      fecha_entrada,
      fecha_salida,
      num_adultos = 1,
      num_ninos   = 0,
      canal_reserva = 'presencial',
      politica_cancelacion = 'moderada',
      observaciones,
    } = req.body;

    if (!fecha_entrada || !fecha_salida) {
      return res.status(400).json({ error: 'fecha_entrada y fecha_salida son requeridos' });
    }
    if (new Date(fecha_salida) <= new Date(fecha_entrada)) {
      return res.status(400).json({ error: 'La fecha de salida debe ser posterior a la de entrada' });
    }

    // 1. Resolver huésped
    const huespedRecord = await obtenerOCrearHuesped(huesped || (id_huesped ? { id_huesped } : null));
    if (!huespedRecord) {
      return res.status(400).json({ error: 'Datos de huésped insuficientes (num_documento o id_huesped requeridos)' });
    }

    // 2. Resolver habitación / tipo
    let habitacion = null;
    let tipoFinal = id_tipo_habitacion || null;
    if (id_habitacion) {
      try {
        const r = await axios.get(`${ROOMS_URL}/${id_habitacion}`);
        habitacion = r.data;
        tipoFinal = habitacion.id_tipo;
      } catch {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }
      if (['mantenimiento', 'bloqueada'].includes(habitacion.estado)) {
        return res.status(409).json({
          error: `No se puede reservar la habitación ${habitacion.numero_habitacion}: estado "${habitacion.estado}"`,
        });
      }

      // Conflicto de fechas
      const conflicto = await reservaRepo()
        .createQueryBuilder('r')
        .where('r.id_habitacion = :id', { id: parseInt(id_habitacion, 10) })
        .andWhere('r.estado IN (:...estados)', { estados: ESTADOS_ACTIVOS })
        .andWhere('r.fecha_entrada < :fs', { fs: fecha_salida })
        .andWhere('r.fecha_salida > :fe', { fe: fecha_entrada })
        .getOne();

      if (conflicto) {
        return res.status(409).json({ error: 'Ya existe una reserva activa para esa habitación en ese rango' });
      }
    }

    if (!tipoFinal) {
      return res.status(400).json({ error: 'id_tipo_habitacion o id_habitacion son requeridos' });
    }

    // 3. Calcular monto estimado (informativo)
    const noches = calcularNoches(fecha_entrada, fecha_salida);
    const totalEstimado = habitacion?.tarifa_base ? Number(habitacion.tarifa_base) * noches : 0;

    // 4. Crear reserva
    const codigo = generarCodigoConfirmacion();
    const reserva = reservaRepo().create({
      codigo_confirmacion: codigo,
      id_huesped:          huespedRecord.id_huesped,
      id_recepcionista:    req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null,
      id_tipo_habitacion:  tipoFinal,
      id_habitacion:       id_habitacion || null,
      fecha_entrada,
      fecha_salida,
      num_adultos,
      num_ninos,
      estado:              'pendiente',
      canal_reserva,
      politica_cancelacion,
      observaciones:       observaciones || null,
    });
    const guardada = await reservaRepo().save(reserva);

    // 5. Notificación (best-effort)
    try {
      if (huespedRecord.email) {
        await axios.post(`${NOTIFICATIONS_URL}/notify`, {
          tipo: 'confirmacion_reserva',
          destinatario: huespedRecord.email,
          datos: {
            nombre: `${huespedRecord.nombres} ${huespedRecord.apellidos}`,
            numero_reserva: codigo,
            habitacion: habitacion?.numero_habitacion || 'Por asignar',
            fecha_entrada,
            fecha_salida,
            noches,
            total: totalEstimado,
          },
        });
      }
    } catch (err) {
      console.warn(`⚠️ Notificación falló: ${err.message}`);
    }

    res.status(201).json({
      mensaje: 'Reserva creada',
      reserva: { ...guardada, total_estimado: totalEstimado, noches },
      huesped: huespedRecord,
    });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar reservas ------------------------------------------
export const getReservations = async (req, res) => {
  try {
    const {
      estado,
      estados,
      id_huesped,
      id_habitacion,
      fecha_entrada,
      fecha_salida,
    } = req.query;

    const qb = reservaRepo().createQueryBuilder('r').orderBy('r.created_at', 'DESC');

    if (estado)  qb.andWhere('r.estado = :estado', { estado });
    if (estados) {
      const lista = String(estados).split(',').map(s => s.trim()).filter(Boolean);
      if (lista.length) qb.andWhere('r.estado IN (:...lista)', { lista });
    }
    if (id_huesped)    qb.andWhere('r.id_huesped = :h', { h: parseInt(id_huesped, 10) });
    if (id_habitacion) qb.andWhere('r.id_habitacion = :hb', { hb: parseInt(id_habitacion, 10) });
    if (fecha_entrada && fecha_salida) {
      qb.andWhere('r.fecha_entrada < :fs', { fs: fecha_salida })
        .andWhere('r.fecha_salida > :fe', { fe: fecha_entrada });
    }

    res.json(await qb.getMany());
  } catch (error) {
    console.error('Error listando reservas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener reserva ------------------------------------------
export const getReservationById = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOne({ where: { id_reserva: parseInt(req.params.id, 10) } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    const huespedRec = await huespedRepo().findOne({ where: { id_huesped: reserva.id_huesped } });
    res.json({ ...reserva, huesped: huespedRec });
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Check-in -------------------------------------------------
export const checkIn = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOne({ where: { id_reserva: parseInt(req.params.id, 10) } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.estado !== 'pendiente' && reserva.estado !== 'confirmada') {
      return res.status(409).json({ error: `No se puede hacer check-in desde estado ${reserva.estado}` });
    }

    const { id_habitacion, deposito_garantia = 0, metodo_deposito, documento_verificado = true, observaciones } = req.body;
    const habitacionFinal = id_habitacion || reserva.id_habitacion;
    if (!habitacionFinal) {
      return res.status(400).json({ error: 'Se requiere id_habitacion para hacer check-in' });
    }

    const idRecepcionista = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null;
    if (!idRecepcionista) {
      return res.status(401).json({ error: 'No se identificó al recepcionista (x-user-id ausente)' });
    }

    const codigo_acceso = 'AC-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const checkin = checkinRepo().create({
      id_reserva: reserva.id_reserva,
      id_recepcionista: idRecepcionista,
      id_habitacion: habitacionFinal,
      codigo_acceso,
      documento_verificado,
      deposito_garantia,
      metodo_deposito: metodo_deposito || null,
      observaciones: observaciones || null,
    });
    const checkinSaved = await checkinRepo().save(checkin);

    // Trigger DB pone habitacion='ocupada'. Confirmamos la reserva y guardamos id_habitacion.
    reserva.estado = 'confirmada';
    reserva.id_habitacion = habitacionFinal;
    await reservaRepo().save(reserva);

    res.json({ mensaje: 'Check-in registrado', checkin: checkinSaved, reserva });
  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Check-out ------------------------------------------------
export const checkOut = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOne({ where: { id_reserva: parseInt(req.params.id, 10) } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.estado !== 'confirmada') {
      return res.status(409).json({ error: `No se puede hacer check-out desde estado ${reserva.estado}` });
    }

    const checkin = await checkinRepo().findOne({ where: { id_reserva: reserva.id_reserva } });
    if (!checkin) return res.status(409).json({ error: 'No hay check-in registrado para esta reserva' });

    const {
      total_cobrado = 0,
      estado_habitacion = 'bueno',
      deposito_devuelto = 0,
      cargos_adicionales = 0,
      observaciones,
    } = req.body;

    const idRecepcionista = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null;
    if (!idRecepcionista) {
      return res.status(401).json({ error: 'No se identificó al recepcionista (x-user-id ausente)' });
    }

    const checkout = checkoutRepo().create({
      id_checkin: checkin.id_checkin,
      id_recepcionista: idRecepcionista,
      total_cobrado,
      estado_habitacion,
      deposito_devuelto,
      cargos_adicionales,
      observaciones: observaciones || null,
    });
    const checkoutSaved = await checkoutRepo().save(checkout);

    // Trigger DB cambia habitación a 'limpieza' o 'mantenimiento'
    reserva.estado = 'completada';
    await reservaRepo().save(reserva);

    res.json({ mensaje: 'Check-out registrado', checkout: checkoutSaved, reserva });
  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cancelar reserva -----------------------------------------
export const cancelReservation = async (req, res) => {
  try {
    const reserva = await reservaRepo().findOne({ where: { id_reserva: parseInt(req.params.id, 10) } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    if (['confirmada', 'completada'].includes(reserva.estado)) {
      return res.status(409).json({ error: 'No se puede cancelar una reserva con check-in o completada' });
    }
    if (reserva.estado === 'cancelada') {
      return res.status(409).json({ error: 'La reserva ya está cancelada' });
    }

    reserva.estado = 'cancelada';
    await reservaRepo().save(reserva);
    res.json({ mensaje: 'Reserva cancelada', reserva });
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar huéspedes (utilitario) ----------------------------
export const getHuespedes = async (_req, res) => {
  try {
    const lista = await huespedRepo().find({ order: { fecha_registro: 'DESC' } });
    res.json(lista);
  } catch (error) {
    console.error('Error listando huéspedes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener checkin asociado a una reserva (para billing) ---
export const getCheckInByReserva = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const checkin = await checkinRepo().findOne({ where: { id_reserva: id } });
    if (!checkin) return res.status(404).json({ error: 'Check-in no encontrado para esta reserva' });
    res.json(checkin);
  } catch (error) {
    console.error('Error obteniendo check-in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
