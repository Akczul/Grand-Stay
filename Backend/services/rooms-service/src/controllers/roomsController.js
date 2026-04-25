// ============================================================
// Controlador de Habitaciones (esquema unificado grandstay_db)
// Habitacion <-> TipoHabitacion (FK id_tipo) <-> Tarifa
// ============================================================

import { AppDataSource } from '../database.js';
import { Habitacion } from '../entities/Habitacion.js';
import { TipoHabitacion } from '../entities/TipoHabitacion.js';
import { Tarifa } from '../entities/Tarifa.js';
import axios from 'axios';

const roomRepo  = () => AppDataSource.getRepository(Habitacion);
const tipoRepo  = () => AppDataSource.getRepository(TipoHabitacion);
const tarifaRepo = () => AppDataSource.getRepository(Tarifa);

const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';

// Estados según schema
const ESTADOS_VALIDOS = ['disponible', 'ocupada', 'mantenimiento', 'limpieza', 'bloqueada'];
const ESTADOS_BLOQUEADOS = ['ocupada', 'mantenimiento', 'limpieza', 'bloqueada'];

// Resolver id_tipo desde nombre (case-insensitive)
const resolverIdTipo = async (nombre) => {
  if (!nombre) return null;
  const t = await tipoRepo()
    .createQueryBuilder('t')
    .where('LOWER(t.nombre) = LOWER(:n)', { n: nombre })
    .getOne();
  return t ? t.id_tipo : null;
};

// Tarifa vigente para un id_tipo (la activa que cubra hoy)
const obtenerTarifaVigente = async (id_tipo) => {
  return tarifaRepo()
    .createQueryBuilder('t')
    .where('t.id_tipo = :id_tipo', { id_tipo })
    .andWhere('t.activa = TRUE')
    .andWhere('CURDATE() BETWEEN t.fecha_inicio AND t.fecha_fin')
    .orderBy('t.precio_noche', 'DESC')
    .getOne();
};

// Serializa una habitación con datos del tipo + tarifa vigente
const serializar = async (h) => {
  const tarifa = await obtenerTarifaVigente(h.id_tipo);
  return {
    ...h,
    tipo_nombre:  h.tipo ? h.tipo.nombre : null,
    capacidad:    h.tipo ? h.tipo.capacidad_max : null,
    tarifa_base:  tarifa ? Number(tarifa.precio_noche) : null,
    temporada:    tarifa ? tarifa.temporada : null,
  };
};

// --- Crear habitación ---
export const createRoom = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede crear habitaciones' });
    }

    const { numero_habitacion, numero, tipo, id_tipo, piso, descripcion_adicional, descripcion } = req.body;
    const numeroFinal = numero_habitacion || numero;

    if (!numeroFinal || (!tipo && !id_tipo) || !piso) {
      return res.status(400).json({ error: 'numero_habitacion, tipo y piso son requeridos' });
    }

    const idTipoFinal = id_tipo || (await resolverIdTipo(tipo));
    if (!idTipoFinal) return res.status(400).json({ error: `Tipo "${tipo}" no existe` });

    const existente = await roomRepo().findOne({ where: { numero_habitacion: numeroFinal } });
    if (existente) {
      return res.status(409).json({ error: `Ya existe la habitación ${numeroFinal}` });
    }

    const habitacion = roomRepo().create({
      numero_habitacion: numeroFinal,
      id_tipo: idTipoFinal,
      piso,
      descripcion_adicional: descripcion_adicional || descripcion || null,
      estado: 'disponible',
      activo: true,
    });

    const guardada = await roomRepo().save(habitacion);
    const conRel = await roomRepo().findOne({ where: { id_habitacion: guardada.id_habitacion } });
    res.status(201).json({ mensaje: 'Habitación creada', habitacion: await serializar(conRel) });
  } catch (error) {
    console.error('Error creando habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar habitaciones ---
export const getRooms = async (req, res) => {
  try {
    const { tipo, estado, piso } = req.query;

    const qb = roomRepo()
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.tipo', 't')
      .where('h.activo = TRUE')
      .orderBy('h.numero_habitacion', 'ASC');

    if (tipo)   qb.andWhere('LOWER(t.nombre) = LOWER(:tipo)', { tipo });
    if (estado) qb.andWhere('h.estado = :estado', { estado: String(estado).toLowerCase() });
    if (piso)   qb.andWhere('h.piso = :piso', { piso: parseInt(piso, 10) });

    const habitaciones = await qb.getMany();
    const out = await Promise.all(habitaciones.map(serializar));
    res.json(out);
  } catch (error) {
    console.error('Error listando habitaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener habitación por ID ---
export const getRoomById = async (req, res) => {
  try {
    const habitacion = await roomRepo().findOne({ where: { id_habitacion: parseInt(req.params.id, 10) } });
    if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada' });
    res.json(await serializar(habitacion));
  } catch (error) {
    console.error('Error obteniendo habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Disponibilidad por rango de fechas ---
export const getRoomAvailability = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
    }
    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    const habitaciones = await roomRepo().find({ where: { activo: true }, order: { numero_habitacion: 'ASC' } });
    const candidatas = habitaciones.filter(h => !ESTADOS_BLOQUEADOS.includes(h.estado));

    let ocupadas = new Set();
    try {
      const r = await axios.get(`${RESERVATIONS_URL}/`, {
        params: { fecha_entrada: fecha_inicio, fecha_salida: fecha_fin, estados: 'pendiente,confirmada' },
      });
      ocupadas = new Set((r.data || []).map(x => parseInt(x.id_habitacion)).filter(Number.isFinite));
    } catch (error) {
      return res.status(502).json({
        error: 'No se pudo validar disponibilidad con reservations-service',
        detalle: error.message,
      });
    }

    const disponibles = await Promise.all(
      candidatas.filter(h => !ocupadas.has(h.id_habitacion)).map(serializar)
    );
    res.json(disponibles);
  } catch (error) {
    console.error('Error consultando disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Habitaciones disponibles (estado actual) ---
export const getAvailableRooms = async (_req, res) => {
  try {
    const habitaciones = await roomRepo().find({
      where: { estado: 'disponible', activo: true },
      order: { numero_habitacion: 'ASC' },
    });
    const out = await Promise.all(habitaciones.map(serializar));
    res.json(out);
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

    const habitacion = await roomRepo().findOne({ where: { id_habitacion: parseInt(req.params.id, 10) } });
    if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada' });

    const { numero_habitacion, numero, tipo, id_tipo, piso, descripcion_adicional, descripcion, observaciones, activo } = req.body;
    if (numero_habitacion || numero) habitacion.numero_habitacion = numero_habitacion || numero;
    if (id_tipo) habitacion.id_tipo = id_tipo;
    else if (tipo) {
      const t = await resolverIdTipo(tipo);
      if (!t) return res.status(400).json({ error: `Tipo "${tipo}" no existe` });
      habitacion.id_tipo = t;
    }
    if (piso) habitacion.piso = piso;
    if (descripcion_adicional !== undefined || descripcion !== undefined)
      habitacion.descripcion_adicional = descripcion_adicional ?? descripcion;
    if (observaciones !== undefined) habitacion.observaciones = observaciones;
    if (activo !== undefined) habitacion.activo = activo;

    await roomRepo().save(habitacion);
    const conRel = await roomRepo().findOne({ where: { id_habitacion: habitacion.id_habitacion } });
    res.json({ mensaje: 'Habitación actualizada', habitacion: await serializar(conRel) });
  } catch (error) {
    console.error('Error actualizando habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cambiar tarifa: ahora se hace sobre la tabla `tarifas` (por tipo) ---
export const updateRate = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede cambiar tarifas' });
    }

    // Aceptamos id_habitacion (compat) o id_tipo directamente
    const idHabitacion = parseInt(req.params.id, 10);
    const habitacion = await roomRepo().findOne({ where: { id_habitacion: idHabitacion } });
    if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada' });

    const { tarifa_base, precio_noche, temporada } = req.body;
    const precio = precio_noche ?? tarifa_base;
    if (!precio || precio <= 0) {
      return res.status(400).json({ error: 'precio_noche debe ser mayor a 0' });
    }

    let tarifa = await obtenerTarifaVigente(habitacion.id_tipo);
    if (tarifa) {
      tarifa.precio_noche = precio;
      if (temporada) tarifa.temporada = temporada;
      await tarifaRepo().save(tarifa);
    } else {
      // Crear tarifa válida por 1 año
      const hoy = new Date();
      const finAno = new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate());
      tarifa = tarifaRepo().create({
        id_tipo: habitacion.id_tipo,
        nombre: `Tarifa ${temporada || 'estandar'}`,
        precio_noche: precio,
        temporada: temporada || 'media',
        fecha_inicio: hoy,
        fecha_fin: finAno,
        activa: true,
      });
      await tarifaRepo().save(tarifa);
    }

    res.json({ mensaje: 'Tarifa actualizada', tarifa });
  } catch (error) {
    console.error('Error actualizando tarifa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cambiar estado de habitación ---
export const updateRoomStatus = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    const rolesPermitidos = ['Recepcionista', 'Administrador', 'PersonalLimpieza', 'ServicioTecnico', 'Sistema'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: 'No tiene permisos para cambiar estados de habitación' });
    }

    const habitacion = await roomRepo().findOne({ where: { id_habitacion: parseInt(req.params.id, 10) } });
    if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada' });

    const estadoIn = String(req.body.estado || '').toLowerCase();
    if (!ESTADOS_VALIDOS.includes(estadoIn)) {
      return res.status(400).json({ error: `Estado inválido. Permitidos: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    // Solo limpieza/sistema pueden marcar como "disponible" tras limpieza
    if (estadoIn === 'disponible' && !['PersonalLimpieza', 'Sistema', 'Administrador'].includes(rol)) {
      return res.status(403).json({
        error: 'Solo el personal de limpieza puede marcar la habitación como disponible',
      });
    }

    habitacion.estado = estadoIn;
    if (estadoIn === 'limpieza' || estadoIn === 'disponible') {
      habitacion.ultima_limpieza = new Date();
    }
    await roomRepo().save(habitacion);
    const conRel = await roomRepo().findOne({ where: { id_habitacion: habitacion.id_habitacion } });
    res.json({ mensaje: `Estado cambiado a ${estadoIn}`, habitacion: await serializar(conRel) });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Eliminar habitación (soft delete vía activo=false) ---
export const deleteRoom = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede eliminar habitaciones' });
    }

    const habitacion = await roomRepo().findOne({ where: { id_habitacion: parseInt(req.params.id, 10) } });
    if (!habitacion) return res.status(404).json({ error: 'Habitación no encontrada' });

    habitacion.activo = false;
    await roomRepo().save(habitacion);
    res.json({ mensaje: 'Habitación desactivada' });
  } catch (error) {
    console.error('Error eliminando habitación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
