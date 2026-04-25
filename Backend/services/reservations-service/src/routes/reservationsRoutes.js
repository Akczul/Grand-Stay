import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservationById,
  checkIn,
  checkOut,
  cancelReservation,
  getHuespedes,
  getCheckInByReserva,
} from '../controllers/reservationsController.js';

const router = Router();

router.get('/huespedes', getHuespedes);
router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.get('/:id/checkin', getCheckInByReserva);
router.patch('/:id/checkin', checkIn);
router.patch('/:id/checkout', checkOut);
router.delete('/:id', cancelReservation);

export default router;
