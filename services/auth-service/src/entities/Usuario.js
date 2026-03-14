// ============================================================
// Entidad Usuario - TypeORM
// Roles: Recepcionista, Administrador, Limpieza, Huésped
// ============================================================

import { EntitySchema } from 'typeorm';

// Definición de la entidad Usuario usando EntitySchema (compatible con ES Modules)
export const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    nombre: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    email: {
      type: 'varchar',
      length: 150,
      unique: true,
      nullable: false,
    },
    password: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    rol: {
      type: 'enum',
      enum: ['Administrador', 'Recepcionista', 'Limpieza', 'Huesped'],
      default: "'Huesped'",
    },
    activo: {
      type: 'boolean',
      default: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
});
