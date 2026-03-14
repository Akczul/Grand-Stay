import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import consumptionsRoutes from './routes/consumptionsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/', consumptionsRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'consumptions-service', status: 'activo', puerto: PORT });
});

const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🍽️ Consumptions Service corriendo en puerto ${PORT}`);
  });
};

start();

export default app;
