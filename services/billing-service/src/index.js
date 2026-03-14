import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import billingRoutes from './routes/billingRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/', billingRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'billing-service', status: 'activo', puerto: PORT });
});

const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`💰 Billing Service corriendo en puerto ${PORT}`);
  });
};

start();

export default app;
