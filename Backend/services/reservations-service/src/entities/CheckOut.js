// Registro de Check-Out del huésped
import { EntitySchema } from 'typeorm';

export const CheckOut = new EntitySchema({
  name: 'CheckOut',
  tableName: 'checkout',
  columns: {
    id_checkout:        { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_checkin:         { type: 'bigint', unsigned: true, unique: true },
    id_recepcionista:   { type: 'bigint', unsigned: true },
    fecha_hora:         { type: 'datetime', createDate: true },
    total_cobrado:      { type: 'decimal', precision: 12, scale: 2, default: 0 },
    estado_habitacion: {
      type: 'enum',
      enum: ['bueno', 'danos_menores', 'danos_graves', 'pendiente_revision'],
      default: 'bueno',
    },
    deposito_devuelto:  { type: 'decimal', precision: 10, scale: 2, default: 0 },
    cargos_adicionales: { type: 'decimal', precision: 10, scale: 2, default: 0 },
    observaciones:      { type: 'text', nullable: true },
  },
});
