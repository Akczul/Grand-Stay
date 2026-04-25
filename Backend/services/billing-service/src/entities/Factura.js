// Factura (cabecera) — mapea a `facturas`
import { EntitySchema } from 'typeorm';

export const Factura = new EntitySchema({
  name: 'Factura',
  tableName: 'facturas',
  columns: {
    id_factura:     { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_checkin:     { type: 'bigint', unsigned: true },
    id_checkout:    { type: 'bigint', unsigned: true, nullable: true },
    numero_factura: { type: 'varchar', length: 20, unique: true },
    fecha_emision:  { type: 'datetime', createDate: true },
    subtotal:       { type: 'decimal', precision: 12, scale: 2, default: 0 },
    impuesto_pct:   { type: 'decimal', precision: 5,  scale: 2, default: 19.00 },
    impuestos:      { type: 'decimal', precision: 12, scale: 2, default: 0 },
    descuentos:     { type: 'decimal', precision: 12, scale: 2, default: 0 },
    total:          { type: 'decimal', precision: 12, scale: 2, default: 0 },
    metodo_pago: {
      type: 'enum',
      enum: ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'credito_hotel', 'mixto'],
    },
    moneda:         { type: 'char', length: 3, default: 'COP' },
    estado_pago: {
      type: 'enum',
      enum: ['pendiente', 'pagada', 'parcial', 'anulada'],
      default: 'pendiente',
    },
    email_enviado:  { type: 'boolean', default: false },
    notas:          { type: 'text', nullable: true },
    created_at:     { type: 'datetime', createDate: true },
  },
});
