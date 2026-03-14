// ============================================================
// Controlador de Habitaciones
// CRUD completo + cambio de estado + actualización de tarifas
// ============================================================

import { AppDataSource } from '../database.js';
import { Habitacion } from '../entities/Habitacion.js';

const roomRepo = () => AppDataSource.getRepository(Habitacion);

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
    const parsed = habitaciones.map(h => ({
      ...h,
      servicios_incluidos: h.servicios_incluidos ? JSON.parse(h.servicios_incluidos) : [],
    }));

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
    habitacion.servicios_incluidos = habitacion.servicios_incluidos
      ? JSON.parse(habitacion.servicios_incluidos) : [];
    res.json(habitacion);
  } catch (error) {
    console.error('Error obteniendo habitación:', error);
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
    const parsed = habitaciones.map(h => ({
      ...h,
      servicios_incluidos: h.servicios_incluidos ? JSON.parse(h.servicios_incluidos) : [],
    }));
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
    if (rol !== 'Recepcionista' && rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo Recepcionista o Administrador pueden cambiar estados' });
    }

    const habitacion = await roomRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!habitacion) {
      return res.status(404).json({ error: 'Habitación no encontrada' });
    }

    const { estado } = req.body;
    const estadosValidos = ['Disponible', 'Ocupada', 'Sucia', 'Mantenimiento'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
    }

    habitacion.estado = estado;
    const actualizada = await roomRepo().save(habitacion);
    res.json({ mensaje: `Estado cambiado a ${estado}`, habitacion: actualizada });
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
