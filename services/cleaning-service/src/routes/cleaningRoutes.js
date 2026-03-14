import { Router } from 'express';
import {
  createTask,
  getTasks,
  completeTask,
  updateTaskStatus,
  createSupply,
  getSupplies,
  getLowStockSupplies,
  updateSupplyStock,
  deleteSupply,
} from '../controllers/cleaningController.js';

const router = Router();

// Tareas de limpieza
router.post('/tareas', createTask);
router.get('/tareas', getTasks);
router.patch('/tareas/:id/completar', completeTask);
router.patch('/tareas/:id/estado', updateTaskStatus);

// Insumos
router.post('/insumos', createSupply);
router.get('/insumos', getSupplies);
router.get('/insumos/stock-bajo', getLowStockSupplies);
router.put('/insumos/:id', updateSupplyStock);
router.delete('/insumos/:id', deleteSupply);

export default router;
