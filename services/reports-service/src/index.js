import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import reportsRoutes from './routes/reportsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/', reportsRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'reports-service', status: 'activo', puerto: PORT });
});

app.listen(PORT, () => {
  console.log(`📊 Reports Service corriendo en puerto ${PORT}`);
});

export default app;
