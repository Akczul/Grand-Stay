// Registro de Check-In del huésped
import { EntitySchema } from 'typeorm';

export const CheckIn = new EntitySchema({
  name: 'CheckIn',
  tableName: 'checkin',
  columns: {
    id_checkin:           { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_reserva:           { type: 'bigint', unsigned: true, unique: true },
    id_recepcionista:     { type: 'bigint', unsigned: true },
    id_habitacion:        { type: 'bigint', unsigned: true },
    fecha_hora:           { type: 'datetime', createDate: true },
    codigo_acceso:        { type: 'varchar', length: 20, nullable: true },
    documento_verificado: { type: 'boolean', default: false },
    deposito_garantia:    { type: 'decimal', precision: 10, scale: 2, default: 0 },
    metodo_deposito:      { type: 'enum', enum: ['efectivo', 'tarjeta', 'transferencia'], nullable: true },
    observaciones:        { type: 'text', nullable: true },
  },
});
