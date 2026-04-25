// Token de pago (pasarela externa)
import { EntitySchema } from 'typeorm';

export const TokenPago = new EntitySchema({
  name: 'TokenPago',
  tableName: 'tokens_pago',
  columns: {
    id_token:         { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_reserva:       { type: 'bigint', unsigned: true },
    token:            { type: 'varchar', length: 255 },
    proveedor:        { type: 'varchar', length: 60 },
    monto_autorizado: { type: 'decimal', precision: 12, scale: 2 },
    moneda:           { type: 'char', length: 3, default: 'COP' },
    fecha_creacion:   { type: 'datetime', createDate: true },
    fecha_expiracion: { type: 'datetime', nullable: true },
    vigente:          { type: 'boolean', default: true },
    referencia_ext:   { type: 'varchar', length: 120, nullable: true },
  },
});
