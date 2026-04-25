// Rooms Service — DB unificada grandstay_db (esquema gobernado por Grand-Stay.sql)
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Habitacion } from './entities/Habitacion.js';
import { TipoHabitacion } from './entities/TipoHabitacion.js';
import { Tarifa } from './entities/Tarifa.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'grandstay_db',
  entities: [Habitacion, TipoHabitacion, Tarifa],
  synchronize: false,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Rooms Service - Conectado a grandstay_db');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
