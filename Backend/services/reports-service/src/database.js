// Reports Service — DB unificada grandstay_db
// Tablas: reportes, log_auditoria (lectura cruzada de todas las demás)
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Reporte } from './entities/Reporte.js';
import { LogAuditoria } from './entities/LogAuditoria.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'grandstay_db',
  entities: [Reporte, LogAuditoria],
  synchronize: false,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Reports Service - Conectado a grandstay_db');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
