import { Router } from 'express';
import {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  getInvoicesByCheckin,
  payInvoice,
  updateInvoiceStatus,
  cancelInvoice,
} from '../controllers/billingController.js';

const router = Router();

router.post('/generar/:reservaId', generateInvoice);
router.get('/', getInvoices);
router.get('/checkin/:checkinId', getInvoicesByCheckin);
router.get('/:id', getInvoiceById);
router.patch('/:id/pagar', payInvoice);
router.patch('/:id/estado', updateInvoiceStatus);
router.patch('/:id/anular', cancelInvoice);

export default router;
