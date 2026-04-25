// Notifications Service — DB unificada grandstay_db
// Persiste el log de notificaciones (tabla `notificaciones`)
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Notificacion } from './entities/Notificacion.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'grandstay_db',
  entities: [Notificacion],
  synchronize: false,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Notifications Service - Conectado a grandstay_db');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    // No salir: el servicio puede operar enviando emails sin persistir si la DB no está
  }
};
