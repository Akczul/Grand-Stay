// Insumos de limpieza (mapea a `insumos_limpieza`)
import { EntitySchema } from 'typeorm';

export const Insumo = new EntitySchema({
  name: 'Insumo',
  tableName: 'insumos_limpieza',
  columns: {
    id_insumo:           { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    nombre:              { type: 'varchar', length: 100 },
    descripcion:         { type: 'text', nullable: true },
    categoria:           { type: 'enum', enum: ['quimico', 'herramienta', 'textil', 'papel', 'otro'], default: 'quimico' },
    unidad_medida:       { type: 'varchar', length: 20, default: 'unidad' },
    stock_actual:        { type: 'decimal', precision: 10, scale: 2, default: 0 },
    stock_minimo:        { type: 'decimal', precision: 10, scale: 2, default: 5 },
    proveedor:           { type: 'varchar', length: 100, nullable: true },
    ficha_seguridad_url: { type: 'varchar', length: 255, nullable: true },
    activo:              { type: 'boolean', default: true },
    updated_at:          { type: 'datetime', updateDate: true },
  },
});

