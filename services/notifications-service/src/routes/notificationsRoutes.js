import { Router } from 'express';
import { sendNotification, getStatus } from '../controllers/notificationsController.js';

const router = Router();

router.post('/notify', sendNotification);
router.get('/status', getStatus);

export default router;
