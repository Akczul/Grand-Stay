import { Router } from 'express';
import {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceByReservation,
  payInvoice,
} from '../controllers/billingController.js';

const router = Router();

router.post('/generar', generateInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/reserva/:reservaId', getInvoiceByReservation);
router.patch('/:id/pagar', payInvoice);

export default router;
