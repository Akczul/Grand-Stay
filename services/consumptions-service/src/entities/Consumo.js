// ============================================================
// Entidad Consumo - TypeORM
// Tipos/Conceptos de consumo con trazabilidad de auditoria
// ============================================================

import { EntitySchema } from 'typeorm';

export const Consumo = new EntitySchema({
  name: 'Consumo',
  tableName: 'consumos',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    reservaId: {
      type: 'int',
      nullable: false,
    },
    concepto: {
      type: 'varchar',
      length: 120,
      nullable: true,
    },
    tipo: {
      type: 'enum',
      enum: ['restaurante', 'spa', 'lavanderia', 'minibar', 'otros'],
      nullable: true,
    },
    descripcion: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    monto: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    cantidad: {
      type: 'int',
      default: 1,
    },
    fecha: {
      type: 'date',
      default: () => 'CURRENT_DATE',
    },
    estado: {
      type: 'enum',
      enum: ['Pendiente', 'Confirmado', 'Cancelado'],
      default: 'Pendiente',
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
