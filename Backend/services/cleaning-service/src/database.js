// Cleaning Service — DB unificada grandstay_db
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Insumo } from './entities/Insumo.js';
import { TareaLimpieza } from './entities/TareaLimpieza.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'grandstay_db',
  entities: [Insumo, TareaLimpieza],
  synchronize: false,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Cleaning Service - Conectado a grandstay_db');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
