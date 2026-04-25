import { Router } from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  getRoomAvailability,
  getAvailableRooms,
  updateRoom,
  updateRate,
  updateRoomStatus,
  deleteRoom,
} from '../controllers/roomsController.js';

const router = Router();

router.get('/available', getAvailableRooms);   // GET /available
router.get('/availability', getRoomAvailability); // GET /availability?fecha_inicio=&fecha_fin=
router.get('/', getRooms);                      // GET /
router.get('/:id', getRoomById);                // GET /:id
router.post('/', createRoom);                   // POST /
router.put('/:id', updateRoom);                 // PUT /:id
router.patch('/:id/tarifa', updateRate);        // PATCH /:id/tarifa
router.patch('/:id/estado', updateRoomStatus);  // PATCH /:id/estado
router.delete('/:id', deleteRoom);              // DELETE /:id

export default router;
