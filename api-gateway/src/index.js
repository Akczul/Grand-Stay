// ============================================================
// API Gateway - Grand-Stay Sistema de Gestión Hotelera
// Puerto: 4000
// Enruta todas las peticiones a los microservicios correspondientes
// ============================================================

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { authMiddleware } from './middlewares/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middlewares globales ---
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// --- Mapa de microservicios y sus puertos ---
const services = {
  '/api/auth':          { target: 'http://localhost:3001', public: true },
  '/api/rooms':         { target: 'http://localhost:3002', public: false },
  '/api/reservations':  { target: 'http://localhost:3003', public: false },
  '/api/consumptions':  { target: 'http://localhost:3004', public: false },
  '/api/billing':       { target: 'http://localhost:3005', public: false },
  '/api/cleaning':      { target: 'http://localhost:3006', public: false },
  '/api/notifications': { target: 'http://localhost:3007', public: false },
  '/api/reports':       { target: 'http://localhost:3008', public: false },
};

// --- Configurar proxy para cada microservicio ---
Object.entries(services).forEach(([path, config]) => {
  const middlewares = [];

  // Las rutas públicas (login, register) no requieren autenticación
  if (!config.public) {
    middlewares.push(authMiddleware);
  }

  // Proxy que redirige al microservicio correspondiente
  middlewares.push(
    createProxyMiddleware({
      target: config.target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: '' },
      // Propagar headers de autenticación al microservicio
      onProxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.id);
          proxyReq.setHeader('x-user-rol', req.user.rol);
          proxyReq.setHeader('x-user-nombre', encodeURIComponent(req.user.nombre));
        }
        // Si el body ya fue parseado, reenviarlo
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
    })
  );

  app.use(path, ...middlewares);
});

// --- Ruta de salud del gateway ---
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway activo', puerto: PORT });
});

// --- Manejo de rutas no encontradas ---
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en el API Gateway' });
});

app.listen(PORT, () => {
  console.log(`🏨 API Gateway Grand-Stay corriendo en puerto ${PORT}`);
});

export default app;
