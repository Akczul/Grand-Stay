// ============================================================
// Entidad Reserva - TypeORM
// Estados: Pendiente, Confirmada, CheckIn, CheckOut, Cancelada
// ============================================================

import { EntitySchema } from 'typeorm';

export const Reserva = new EntitySchema({
  name: 'Reserva',
  tableName: 'reservas',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    huespedId: {
      type: 'int',
      nullable: false,
    },
    huespedNombre: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    huespedEmail: {
      type: 'varchar',
      length: 150,
      nullable: true,
    },
    habitacionId: {
      type: 'int',
      nullable: false,
    },
    habitacionNumero: {
      type: 'varchar',
      length: 10,
      nullable: true,
    },
    fecha_inicio: {
      type: 'date',
      nullable: false,
    },
    fecha_fin: {
      type: 'date',
      nullable: false,
    },
    estado: {
      type: 'enum',
      enum: ['Pendiente', 'Confirmada', 'CheckIn', 'CheckOut', 'Cancelada'],
      default: "'Pendiente'",
    },
    total: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    codigoAcceso: {
      type: 'varchar',
      length: 8,
      nullable: true,
    },
    notas: {
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
