import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Consumo } from './entities/Consumo.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'grand_stay_consumptions',
  entities: [Consumo],
  synchronize: true,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Consumptions Service - Base de datos conectada');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
