import { Router } from 'express';
import {
  createConsumption,
  getConsumptionsByReservation,
  getAllConsumptions,
  filterConsumptions,
  validateLimit,
  getAuditLog,
  getConsumptionById,
  deleteConsumption,
} from '../controllers/consumptionsController.js';

const router = Router();

router.post('/', createConsumption);
router.get('/', getAllConsumptions);
router.get('/reserva/:reservaId', getConsumptionsByReservation);
router.get('/filtro', filterConsumptions);
router.post('/validar-limite', validateLimit);
router.get('/auditoria', getAuditLog);
router.get('/:id', getConsumptionById);
router.delete('/:id', deleteConsumption);

export default router;
