// ============================================================
// Auth Service - Punto de entrada
// Puerto: 3001
// Maneja autenticación, registro y gestión de usuarios
// ============================================================

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use('/', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'activo', puerto: PORT });
});

// Iniciar servicio
const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🔐 Auth Service corriendo en puerto ${PORT}`);
  });
};

start();

export default app;
