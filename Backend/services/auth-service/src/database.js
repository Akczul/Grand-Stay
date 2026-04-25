// ============================================================
// Conexión TypeORM + MySQL - Auth Service
// Base de datos UNIFICADA: grandstay_db
// El esquema lo gobierna Backend/database/Grand-Stay.sql
//   => synchronize: false (NO modificar tablas desde TypeORM)
// ============================================================

import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Usuario } from './entities/Usuario.js';
import { Rol } from './entities/Rol.js';
import { Recepcionista } from './entities/Recepcionista.js';
import { Administrador } from './entities/Administrador.js';
import { PersonalLimpieza } from './entities/PersonalLimpieza.js';
import { ServicioTecnico } from './entities/ServicioTecnico.js';
import { Especialidad } from './entities/Especialidad.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'grandstay_db',
  entities: [Usuario, Rol, Recepcionista, Administrador, PersonalLimpieza, ServicioTecnico, Especialidad],
  synchronize: false,
  logging: false,
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Auth Service - Conectado a grandstay_db');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};
