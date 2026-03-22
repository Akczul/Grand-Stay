import { Router } from 'express';
import {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceByReservation,
  payInvoice,
} from '../controllers/billingController.js';

const router = Router();

// RF-08: Generar factura para una reserva
router.post('/generar/:reservaId', generateInvoice);
router.post('/generar', generateInvoice);  // Alternativa con body

// Listar facturas
router.get('/', getInvoices);

// Obtener factura por ID
router.get('/:id', getInvoiceById);

// Obtener factura por reservaId
router.get('/reserva/:reservaId', getInvoiceByReservation);

// Marcar factura como pagada
router.patch('/:id/pagar', payInvoice);

export default router;
