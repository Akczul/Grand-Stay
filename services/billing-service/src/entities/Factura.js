// ============================================================
// Entidad Factura - TypeORM
// Consolida reserva + consumos en factura final
// ============================================================

import { EntitySchema } from 'typeorm';

export const Factura = new EntitySchema({
  name: 'Factura',
  tableName: 'facturas',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    reservaId: {
      type: 'int',
      nullable: false,
      unique: true,
    },
    huespedNombre: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    habitacionNumero: {
      type: 'varchar',
      length: 10,
      nullable: true,
    },
    fecha_inicio: {
      type: 'date',
      nullable: true,
    },
    fecha_fin: {
      type: 'date',
      nullable: true,
    },
    subtotal: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    consumos_total: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    impuestos: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    total_final: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    detalle_consumos: {
      type: 'text',
      nullable: true, // JSON string con detalle de consumos
    },
    estado: {
      type: 'enum',
      enum: ['Pendiente', 'Pagada', 'Anulada'],
      default: "'Pendiente'",
    },
    metodo_pago: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    fecha_emision: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});
