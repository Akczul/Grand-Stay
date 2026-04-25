import { Router } from 'express';
import {
  getInsumos,
  getInsumoById,
  createInsumo,
  updateInsumo,
  reabastecerInsumo,
  getAlertasStock,
  createTarea,
  getTareas,
  getTareaById,
  getHabitacionesPendientes,
} from '../controllers/cleaningController.js';

const router = Router();

// Insumos
router.get('/insumos',                  getInsumos);
router.get('/insumos/alertas',          getAlertasStock);
router.get('/insumos/:id',              getInsumoById);
router.post('/insumos',                 createInsumo);
router.patch('/insumos/:id',            updateInsumo);
router.patch('/insumos/:id/reabastecer', reabastecerInsumo);

// Tareas
router.post('/tareas',                  createTarea);
router.get('/tareas',                   getTareas);
router.get('/tareas/:id',               getTareaById);

// Habitaciones que requieren atención
router.get('/habitaciones/pendientes',  getHabitacionesPendientes);

export default router;
