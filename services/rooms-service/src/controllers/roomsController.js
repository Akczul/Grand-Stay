// ============================================================
// Controlador de Habitaciones
// CRUD completo + cambio de estado + actualización de tarifas
// ============================================================

import { AppDataSource } from '../database.js';
import { Habitacion } from '../entities/Habitacion.js';
import axios from 'axios';

const roomRepo = () => AppDataSource.getRepository(Habitacion);
const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';

const parseServicios = (room) => ({
  ...room,
  servicios_incluidos: room.servicios_incluidos ? JSON.parse(room.servicios_incluidos) : [],
});

const blockedStates = ['Ocupada', 'Sucia', 'En Mantenimiento', 'Mantenimiento', 'Reservada'];

// --- Crear habitación ---
export const createRoom = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede crear habitaciones' });
    }

    const { numero, tipo, tarifa_base, capacidad, servicios_incluidos, piso, descripcion } = req.body;

    if (!numero || !tipo || !tarifa_base || !capacidad) {
      return res.status(400).json({ error: 'Número, tipo, tarifa base y capacidad son requeridos' });
    }

    // Verificar que no exista una habitación con el mismo número
    const existente = await roomRepo().findOneBy({ numero });
    if (existente) {
      return res.status(409).json({ error: `Ya existe la habitación ${numero}` });
    }

    const habitacion = roomRepo().create({
      numero,
      tipo,
      tarifa_base,
      capacidad,
      servicios_incluidos: servicios_incluidos ? JSON.stringify(servicios_incluidos) : null,
      piso: piso || 1,
      descripcion,
    });

    const guardada = await roomRepo().save(habitacion);
    res.status(201).json({ mensaje: 'Habitación creada', habitacion: guardada });
  } catch (error) {
    console.error('Error creando habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar todas las habitaciones ---
export const getRooms = async (req, res) => {
  try {
    const { tipo, estado, piso } = req.query;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (piso) where.piso = parseInt(piso);

    const habitaciones = await roomRepo().find({ where, order: { numero: 'ASC' } });

    // Parsear servicios_incluidos de JSON string a array
    const parsed = habitaciones.map(parseServicios);

    res.json(parsed);
  } catch (error) {
    console.error('Error listando habitaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener habitación por ID ---
export const getRoomById = async (req, res) => {
  try {
    const habitacion = await roomRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!habitacion) {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }
    res.json(parseServicios(habitacion));
  } catch (error) {
    console.error('Error obteniendo habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Disponibilidad por rango de fechas (RF-01) ---
export const getRoomAvailability = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
    }

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    const habitaciones = await roomRepo().find({ order: { tipo: 'ASC', numero: 'ASC' } });
    const candidatas = habitaciones.filter(h => !blockedStates.includes(h.estado));

    let ocupadasPorReserva = new Set();
    try {
      const reservasRes = await axios.get(`${RESERVATIONS_URL}/`, {
        params: {
          fecha_inicio,
          fecha_fin,
          estadosActivos: 'Pendiente,Activa',
        },
      });

      ocupadasPorReserva = new Set(
        reservasRes.data.map(r => parseInt(r.habitacionId)).filter(Number.isFinite)
      );
    } catch (error) {
      return res.status(502).json({
        error: 'No se pudo validar disponibilidad con reservations-service',
        detalle: error.message,
      });
    }

    const disponibles = candidatas
      .filter(h => !ocupadasPorReserva.has(h.id))
      .map(h => ({
        id: h.id,
        numero: h.numero,
        tipo: h.tipo,
        tarifa_base: h.tarifa_base,
        capacidad: h.capacidad,
      }));

    res.json(disponibles);
  } catch (error) {
    console.error('Error consultando disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener habitaciones disponibles ---
export const getAvailableRooms = async (req, res) => {
  try {
    const habitaciones = await roomRepo().find({
      where: { estado: 'Disponible' },
      order: { tipo: 'ASC', numero: 'ASC' },
    });
    const parsed = habitaciones.map(parseServicios);
    res.json(parsed);
  } catch (error) {
    console.error('Error obteniendo disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Actualizar habitación ---
export const updateRoom = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede modificar habitaciones' });
    }

    const habitacion = await roomRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!habitacion) {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }

    const { numero, tipo, capacidad, servicios_incluidos, piso, descripcion } = req.body;
    if (numero) habitacion.numero = numero;
    if (tipo) habitacion.tipo = tipo;
    if (capacidad) habitacion.capacidad = capacidad;
    if (servicios_incluidos) habitacion.servicios_incluidos = JSON.stringify(servicios_incluidos);
    if (piso) habitacion.piso = piso;
    if (descripcion !== undefined) habitacion.descripcion = descripcion;

    const actualizada = await roomRepo().save(habitacion);
    res.json({ mensaje: 'Habitación actualizada', habitacion: actualizada });
  } catch (error) {
    console.error('Error actualizando habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cambiar tarifa (solo Administrador) ---
export const updateRate = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede cambiar tarifas' });
    }

    const habitacion = await roomRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!habitacion) {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }

    const { tarifa_base } = req.body;
    if (!tarifa_base || tarifa_base <= 0) {
      return res.status(400).json({ error: 'Tarifa base debe ser mayor a 0' });
    }

    habitacion.tarifa_base = tarifa_base;
    const actualizada = await roomRepo().save(habitacion);
    res.json({ mensaje: 'Tarifa actualizada', habitacion: actualizada });
  } catch (error) {
    console.error('Error actualizando tarifa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cambiar estado de habitación (solo Recepcionista) ---
export const updateRoomStatus = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (!['Recepcionista', 'Administrador', 'Limpieza', 'Sistema'].includes(rol)) {
      return res.status(403).json({ error: 'No tiene permisos para cambiar estados de habitación' });
    }

    const habitacion = await roomRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!habitacion) {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }

    const { estado } = req.body;
    const estadoNormalizado = estado === 'Mantenimiento' ? 'En Mantenimiento' : estado;
    const estadosValidos = ['Disponible', 'Reservada', 'Ocupada', 'Sucia', 'En Mantenimiento'];
    if (!estadosValidos.includes(estadoNormalizado)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
    }

    if (estadoNormalizado === 'Disponible' && !['Limpieza', 'Sistema'].includes(rol)) {
      return res.status(403).json({
        error: 'Solo el personal de limpieza puede cambiar una habitación a Disponible',
      });
    }

    habitacion.estado = estadoNormalizado;
    const actualizada = await roomRepo().save(habitacion);
    res.json({ mensaje: `Estado cambiado a ${estadoNormalizado}`, habitacion: actualizada });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Eliminar habitación ---
export const deleteRoom = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede eliminar habitaciones' });
    }

    const result = await roomRepo().delete(parseInt(req.params.id));
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }
    res.json({ mensaje: 'Habitación eliminada' });
  } catch (error) {
    console.error('Error eliminando habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
