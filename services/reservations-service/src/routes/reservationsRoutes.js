import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservationById,
  checkIn,
  cancelReservation,
} from '../controllers/reservationsController.js';

const router = Router();

router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.patch('/:id/checkin', checkIn);
router.delete('/:id', cancelReservation);

export default router;
