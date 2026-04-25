import { Router } from 'express';
import { sendNotification, getStatus, getHistorial } from '../controllers/notificationsController.js';

const router = Router();

router.post('/notify', sendNotification);
router.get('/status', getStatus);
router.get('/historial', getHistorial);

export default router;
