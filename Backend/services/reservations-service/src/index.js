import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import reservationsRoutes from './routes/reservationsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/', reservationsRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'reservations-service', status: 'activo', puerto: PORT });
});

const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`📅 Reservations Service corriendo en puerto ${PORT}`);
  });
};

start();

export default app;
