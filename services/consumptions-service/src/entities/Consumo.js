// ============================================================
// Entidad Consumo - TypeORM
// Tipos: restaurante, spa, lavandería, minibar, otros
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
    tipo: {
      type: 'enum',
      enum: ['restaurante', 'spa', 'lavanderia', 'minibar', 'otros'],
      nullable: false,
    },
    descripcion: {
      type: 'varchar',
      length: 255,
      nullable: false,
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
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});
