import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservationById,
  checkIn,
  checkOut,
  cancelReservation,
} from '../controllers/reservationsController.js';

const router = Router();

router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.patch('/:id/checkin', checkIn);
router.patch('/:id/checkout', checkOut);
router.patch('/:id/cancelar', cancelReservation);

export default router;
