// Detalle/items de la factura — mapea a `items_factura`
import { EntitySchema } from 'typeorm';

export const ItemFactura = new EntitySchema({
  name: 'ItemFactura',
  tableName: 'items_factura',
  columns: {
    id_item:         { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_factura:      { type: 'bigint', unsigned: true },
    concepto:        { type: 'varchar', length: 200 },
    categoria: {
      type: 'enum',
      enum: ['alojamiento', 'servicio_adicional', 'consumo_minibar', 'cargo_danio', 'descuento', 'otro'],
      default: 'alojamiento',
    },
    cantidad:        { type: 'decimal', precision: 8,  scale: 2, default: 1 },
    precio_unitario: { type: 'decimal', precision: 12, scale: 2 },
    subtotal:        { type: 'decimal', precision: 12, scale: 2 },
    fecha:           { type: 'date' },
  },
});
