import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import notificationsRoutes from './routes/notificationsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/', notificationsRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'notifications-service', status: 'activo', puerto: PORT });
});

app.listen(PORT, () => {
  console.log(`📧 Notifications Service corriendo en puerto ${PORT}`);
});

export default app;
