// ============================================================
// Entidad Habitacion - TypeORM
// Tipos: Sencilla, Doble, Suite, Presidencial
// Estados: Disponible, Ocupada, Sucia, Mantenimiento
// ============================================================

import { EntitySchema } from 'typeorm';

export const Habitacion = new EntitySchema({
  name: 'Habitacion',
  tableName: 'habitaciones',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    numero: {
      type: 'varchar',
      length: 10,
      unique: true,
      nullable: false,
    },
    tipo: {
      type: 'enum',
      enum: ['Sencilla', 'Doble', 'Suite', 'Presidencial'],
      nullable: false,
    },
    tarifa_base: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    capacidad: {
      type: 'int',
      nullable: false,
    },
    estado: {
      type: 'enum',
      enum: ['Disponible', 'Ocupada', 'Sucia', 'Mantenimiento'],
      default: "'Disponible'",
    },
    servicios_incluidos: {
      type: 'text',
      nullable: true, // Almacenado como JSON string
    },
    piso: {
      type: 'int',
      default: 1,
    },
    descripcion: {
      type: 'text',
      nullable: true,
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
