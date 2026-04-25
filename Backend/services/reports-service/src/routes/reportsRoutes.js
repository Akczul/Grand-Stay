import { Router } from 'express';
import {
  getOccupancyReport,
  getRevenueReport,
  getServicesReport,
  getDashboard,
  getDisponibilidad,
  getReservasActivas,
  getAuditoria,
  saveReport,
  getHistorial,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/dashboard',         getDashboard);
router.get('/ocupacion',         getOccupancyReport);
router.get('/ingresos',          getRevenueReport);
router.get('/servicios',         getServicesReport);
router.get('/disponibilidad',    getDisponibilidad);
router.get('/reservas-activas',  getReservasActivas);
router.get('/auditoria',         getAuditoria);
router.get('/historial',         getHistorial);
router.post('/guardar',          saveReport);

export default router;
