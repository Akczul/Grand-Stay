// Reservations Service — DB unificada grandstay_db
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Reserva } from './entities/Reserva.js';
import { Huesped } from './entities/Huesped.js';
import { TokenPago } from './entities/TokenPago.js';
import { CheckIn } from './entities/CheckIn.js';
import { CheckOut } from './entities/CheckOut.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'grandstay_db',
  entities: [Reserva, Huesped, TokenPago, CheckIn, CheckOut],
  synchronize: false,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Reservations Service - Conectado a grandstay_db');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
