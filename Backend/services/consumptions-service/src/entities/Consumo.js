// Consumo de servicios (mapea a `consumo_servicios`)
import { EntitySchema } from 'typeorm';

export const Consumo = new EntitySchema({
  name: 'Consumo',
  tableName: 'consumo_servicios',
  columns: {
    id_consumo_servicio: { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_reserva:          { type: 'bigint', unsigned: true },
    id_habitacion:       { type: 'bigint', unsigned: true },
    id_servicio:         { type: 'bigint', unsigned: true },
    cantidad:            { type: 'decimal', precision: 6,  scale: 2, default: 1 },
    precio_aplicado:     { type: 'decimal', precision: 12, scale: 2 },
    subtotal:            { type: 'decimal', precision: 12, scale: 2 },
    fecha:               { type: 'datetime', createDate: true },
    estado: {
      type: 'enum',
      enum: ['solicitado', 'en_proceso', 'completado', 'cancelado'],
      default: 'solicitado',
    },
    id_factura:          { type: 'bigint', unsigned: true, nullable: true },
    notas:               { type: 'text', nullable: true },
  },
});
