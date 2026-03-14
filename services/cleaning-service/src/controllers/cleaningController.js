// ============================================================
// Controlador de Limpieza
// Gestión de tareas de limpieza e insumos
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Insumo } from '../entities/Insumo.js';
import { TareaLimpieza } from '../entities/TareaLimpieza.js';

const insumoRepo = () => AppDataSource.getRepository(Insumo);
const tareaRepo = () => AppDataSource.getRepository(TareaLimpieza);

const ROOMS_URL = process.env.ROOMS_SERVICE_URL || 'http://localhost:3002';

// ====================== TAREAS DE LIMPIEZA ======================

// --- Crear tarea de limpieza ---
export const createTask = async (req, res) => {
  try {
    const { habitacionId, habitacionNumero, asignadoA, prioridad, notas } = req.body;

    if (!habitacionId) {
      return res.status(400).json({ error: 'habitacionId es requerido' });
    }

    const tarea = tareaRepo().create({
      habitacionId,
      habitacionNumero,
      asignadoA,
      prioridad: prioridad || 'Normal',
      notas,
    });

    const guardada = await tareaRepo().save(tarea);
    res.status(201).json({ mensaje: 'Tarea de limpieza creada', tarea: guardada });
  } catch (error) {
    console.error('Error creando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar tareas ---
export const getTasks = async (req, res) => {
  try {
    const { estado, asignadoA } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (asignadoA) where.asignadoA = asignadoA;

    const tareas = await tareaRepo().find({ where, order: { fechaAsignacion: 'DESC' } });
    res.json(tareas);
  } catch (error) {
    console.error('Error listando tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Completar tarea y marcar habitación como Disponible ---
export const completeTask = async (req, res) => {
  try {
    const tarea = await tareaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    tarea.estado = 'Completada';
    tarea.fechaCompletado = new Date();
    const actualizada = await tareaRepo().save(tarea);

    // Una vez completada la limpieza, marcar habitación como Disponible
    try {
      await axios.patch(`${ROOMS_URL}/${tarea.habitacionId}/estado`, { estado: 'Disponible' }, {
        headers: { 'x-user-rol': 'Recepcionista' },
      });
    } catch (err) {
      console.warn('⚠️ No se pudo actualizar estado de habitación:', err.message);
    }

    res.json({ mensaje: 'Tarea completada, habitación disponible', tarea: actualizada });
  } catch (error) {
    console.error('Error completando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Actualizar estado de tarea ---
export const updateTaskStatus = async (req, res) => {
  try {
    const tarea = await tareaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const { estado } = req.body;
    tarea.estado = estado;
    if (estado === 'Completada') tarea.fechaCompletado = new Date();

    const actualizada = await tareaRepo().save(tarea);
    res.json({ mensaje: 'Estado de tarea actualizado', tarea: actualizada });
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ====================== INSUMOS ======================

// --- Crear insumo ---
export const createSupply = async (req, res) => {
  try {
    const { nombre, cantidad, unidad, stockMinimo, categoria } = req.body;

    if (!nombre || !unidad) {
      return res.status(400).json({ error: 'nombre y unidad son requeridos' });
    }

    const insumo = insumoRepo().create({
      nombre,
      cantidad: cantidad || 0,
      unidad,
      stockMinimo: stockMinimo || 5,
      categoria,
    });

    const guardado = await insumoRepo().save(insumo);
    res.status(201).json({ mensaje: 'Insumo creado', insumo: guardado });
  } catch (error) {
    console.error('Error creando insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar insumos ---
export const getSupplies = async (req, res) => {
  try {
    const insumos = await insumoRepo().find({ order: { nombre: 'ASC' } });
    res.json(insumos);
  } catch (error) {
    console.error('Error listando insumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Insumos con stock bajo ---
export const getLowStockSupplies = async (req, res) => {
  try {
    const insumos = await insumoRepo()
      .createQueryBuilder('i')
      .where('i.cantidad <= i.stockMinimo')
      .getMany();

    res.json(insumos);
  } catch (error) {
    console.error('Error obteniendo stock bajo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Actualizar stock de insumo ---
export const updateSupplyStock = async (req, res) => {
  try {
    const insumo = await insumoRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const { cantidad, nombre, stockMinimo } = req.body;
    if (cantidad !== undefined) insumo.cantidad = cantidad;
    if (nombre) insumo.nombre = nombre;
    if (stockMinimo !== undefined) insumo.stockMinimo = stockMinimo;

    const actualizado = await insumoRepo().save(insumo);
    res.json({ mensaje: 'Insumo actualizado', insumo: actualizado });
  } catch (error) {
    console.error('Error actualizando insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Eliminar insumo ---
export const deleteSupply = async (req, res) => {
  try {
    const result = await insumoRepo().delete(parseInt(req.params.id));
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }
    res.json({ mensaje: 'Insumo eliminado' });
  } catch (error) {
    console.error('Error eliminando insumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
