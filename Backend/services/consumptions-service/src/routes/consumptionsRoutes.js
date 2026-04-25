import { Router } from 'express';
import {
  createConsumption,
  getConsumptionsByReservation,
  getAllConsumptions,
  filterConsumptions,
  validateLimit,
  getConsumptionById,
  deleteConsumption,
  getServicios,
  createServicio,
  updateConsumptionStatus,
} from '../controllers/consumptionsController.js';

const router = Router();

// Catálogo de servicios
router.get('/servicios', getServicios);
router.post('/servicios', createServicio);

// Consumos
router.post('/', createConsumption);
router.get('/', getAllConsumptions);
router.get('/filtro', filterConsumptions);
router.post('/validar-limite', validateLimit);
router.get('/reserva/:reservaId', getConsumptionsByReservation);
router.patch('/:id/estado', updateConsumptionStatus);
router.get('/:id', getConsumptionById);
router.delete('/:id', deleteConsumption);

export default router;
