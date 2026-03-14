import { Router } from 'express';
import {
  getOccupancyReport,
  getRevenueReport,
  getServicesReport,
  getDashboardReport,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/ocupacion', getOccupancyReport);
router.get('/ingresos', getRevenueReport);
router.get('/servicios', getServicesReport);
router.get('/dashboard', getDashboardReport);

export default router;
