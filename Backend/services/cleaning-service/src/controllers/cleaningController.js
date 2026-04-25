// ============================================================
// Controlador de Limpieza (esquema unificado grandstay_db)
// - Insumos:        insumos_limpieza (CRUD + alertas de stock)
// - Tareas:         consumo_insumos  (registro de uso por habitación)
// - El trigger `tr_after_insert_consumo_insumos` decrementa el stock
//   automáticamente al insertar.
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Insumo } from '../entities/Insumo.js';
import { TareaLimpieza } from '../entities/TareaLimpieza.js';

const insumoRepo = () => AppDataSource.getRepository(Insumo);
const tareaRepo  = () => AppDataSource.getRepository(TareaLimpieza);

const ROOMS_URL = process.env.ROOMS_SERVICE_URL || 'http://localhost:3002';

const TIPOS_TAREA = ['limpieza_rutina', 'limpieza_profunda', 'cambio_ropa', 'mantenimiento', 'checkin_prep'];
const CATEGORIAS  = ['quimico', 'herramienta', 'textil', 'papel', 'otro'];

// Resuelve id_personal a partir del id_usuario del header x-user-id
const resolverIdPersonal = async (idUsuario) => {
  if (!idUsuario) return null;
  const rows = await AppDataSource.query(
    'SELECT id_personal FROM personal_limpieza WHERE id_usuario = ? LIMIT 1',
    [idUsuario],
  );
  return rows?.[0]?.id_personal ?? null;
};

// ============================================================
// INSUMOS
// ============================================================

export const getInsumos = async (req, res) => {
  try {
    const { categoria, bajo_stock } = req.query;
    const qb = insumoRepo().createQueryBuilder('i').where('i.activo = TRUE').orderBy('i.nombre', 'ASC');
    if (categoria)  qb.andWhere('i.categoria = :c', { c: categoria });
    if (bajo_stock) qb.andWhere('i.stock_actual <= i.stock_minimo');
    res.json(await qb.getMany());
  } catch (error) {
    console.error('Error listando insumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getInsumoById = async (req, res) => {
  try {
    const insumo = await insumoRepo().findOne({ where: { id_insumo: parseInt(req.params.id, 10) } });
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    res.json(insumo);
  } catch (error) {
    console.error('Error obteniendo insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createInsumo = async (req, res) => {
  try {
    if (!['Administrador', 'PersonalLimpieza'].includes(req.headers['x-user-rol'])) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { nombre, descripcion, categoria, unidad_medida, stock_actual, stock_minimo, proveedor } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
    if (categoria && !CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ error: `categoria inválida. Permitidas: ${CATEGORIAS.join(', ')}` });
    }
    const nuevo = insumoRepo().create({
      nombre,
      descripcion: descripcion || null,
      categoria: categoria || 'quimico',
      unidad_medida: unidad_medida || 'unidad',
      stock_actual: stock_actual ?? 0,
      stock_minimo: stock_minimo ?? 5,
      proveedor: proveedor || null,
      activo: true,
    });
    res.status(201).json(await insumoRepo().save(nuevo));
  } catch (error) {
    console.error('Error creando insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateInsumo = async (req, res) => {
  try {
    const insumo = await insumoRepo().findOne({ where: { id_insumo: parseInt(req.params.id, 10) } });
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    const campos = ['nombre', 'descripcion', 'categoria', 'unidad_medida', 'stock_minimo', 'proveedor', 'ficha_seguridad_url', 'activo'];
    for (const c of campos) if (req.body[c] !== undefined) insumo[c] = req.body[c];
    if (req.body.categoria && !CATEGORIAS.includes(req.body.categoria)) {
      return res.status(400).json({ error: `categoria inválida. Permitidas: ${CATEGORIAS.join(', ')}` });
    }
    await insumoRepo().save(insumo);
    res.json({ mensaje: 'Insumo actualizado', insumo });
  } catch (error) {
    console.error('Error actualizando insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const reabastecerInsumo = async (req, res) => {
  try {
    if (!['Administrador', 'PersonalLimpieza'].includes(req.headers['x-user-rol'])) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const insumo = await insumoRepo().findOne({ where: { id_insumo: parseInt(req.params.id, 10) } });
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    const cantidad = Number(req.body?.cantidad);
    if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
    insumo.stock_actual = Number(insumo.stock_actual) + cantidad;
    await insumoRepo().save(insumo);
    res.json({ mensaje: 'Stock actualizado', insumo });
  } catch (error) {
    console.error('Error reabasteciendo insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAlertasStock = async (_req, res) => {
  try {
    const bajos = await insumoRepo()
      .createQueryBuilder('i')
      .where('i.activo = TRUE')
      .andWhere('i.stock_actual <= i.stock_minimo')
      .orderBy('i.stock_actual', 'ASC')
      .getMany();
    res.json({ cantidad: bajos.length, insumos: bajos });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================================
// TAREAS DE LIMPIEZA (consumo_insumos)
// ============================================================

export const createTarea = async (req, res) => {
  try {
    const { id_insumo, id_habitacion, tipo_tarea = 'limpieza_rutina', cantidad, observaciones, finaliza_estado } = req.body;
    if (!id_insumo || !id_habitacion || !cantidad) {
      return res.status(400).json({ error: 'id_insumo, id_habitacion y cantidad son requeridos' });
    }
    if (!TIPOS_TAREA.includes(tipo_tarea)) {
      return res.status(400).json({ error: `tipo_tarea inválido. Permitidos: ${TIPOS_TAREA.join(', ')}` });
    }
    if (Number(cantidad) <= 0) return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });

    const id_personal = await resolverIdPersonal(req.headers['x-user-id']);
    if (!id_personal) {
      return res.status(403).json({ error: 'El usuario no está registrado como personal de limpieza' });
    }

    // Verificar stock suficiente antes (el trigger fallará si no, pero damos mejor error)
    const insumo = await insumoRepo().findOne({ where: { id_insumo: parseInt(id_insumo, 10) } });
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    if (Number(insumo.stock_actual) < Number(cantidad)) {
      return res.status(409).json({
        error: 'Stock insuficiente',
        stock_actual: insumo.stock_actual,
        solicitado: cantidad,
      });
    }

    const tarea = tareaRepo().create({
      id_personal,
      id_insumo: parseInt(id_insumo, 10),
      id_habitacion: parseInt(id_habitacion, 10),
      tipo_tarea,
      cantidad,
      observaciones: observaciones || null,
    });
    const guardada = await tareaRepo().save(tarea);  // trigger decrementa stock

    // Si la tarea finaliza la habitación (ej. limpieza completada), liberar la habitación
    if (finaliza_estado) {
      try {
        await axios.patch(
          `${ROOMS_URL}/${id_habitacion}/estado`,
          { estado: finaliza_estado },
          { headers: { 'x-user-rol': req.headers['x-user-rol'], 'x-user-id': req.headers['x-user-id'] } },
        );
      } catch (err) {
        console.warn(`⚠️ No se pudo actualizar estado de habitación: ${err.message}`);
      }
    }

    res.status(201).json({ mensaje: 'Tarea registrada', tarea: guardada });
  } catch (error) {
    console.error('Error creando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTareas = async (req, res) => {
  try {
    const { id_habitacion, id_personal, tipo_tarea, desde, hasta } = req.query;
    const qb = tareaRepo().createQueryBuilder('t').orderBy('t.fecha', 'DESC');
    if (id_habitacion) qb.andWhere('t.id_habitacion = :h', { h: parseInt(id_habitacion, 10) });
    if (id_personal)   qb.andWhere('t.id_personal = :p',   { p: parseInt(id_personal, 10) });
    if (tipo_tarea)    qb.andWhere('t.tipo_tarea = :tt',   { tt: tipo_tarea });
    if (desde)         qb.andWhere('DATE(t.fecha) >= :d',  { d: desde });
    if (hasta)         qb.andWhere('DATE(t.fecha) <= :f',  { f: hasta });
    res.json(await qb.getMany());
  } catch (error) {
    console.error('Error listando tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTareaById = async (req, res) => {
  try {
    const tarea = await tareaRepo().findOne({ where: { id_consumo_insumo: parseInt(req.params.id, 10) } });
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(tarea);
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Pendientes: habitaciones con estado 'limpieza' o 'mantenimiento'
export const getHabitacionesPendientes = async (_req, res) => {
  try {
    const rows = await AppDataSource.query(
      `SELECT id_habitacion, numero_habitacion, piso, estado, ultima_limpieza
         FROM habitaciones
        WHERE activo = TRUE AND estado IN ('limpieza','mantenimiento')
        ORDER BY estado ASC, numero_habitacion ASC`,
    );
    res.json({ cantidad: rows.length, habitaciones: rows });
  } catch (error) {
    console.error('Error obteniendo pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
