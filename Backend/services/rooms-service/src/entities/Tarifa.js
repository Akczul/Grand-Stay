// Tarifas vigentes por tipo de habitación y temporada
import { EntitySchema } from 'typeorm';

export const Tarifa = new EntitySchema({
  name: 'Tarifa',
  tableName: 'tarifas',
  columns: {
    id_tarifa:    { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_tipo:      { type: 'tinyint', unsigned: true },
    nombre:       { type: 'varchar', length: 80 },
    precio_noche: { type: 'decimal', precision: 12, scale: 2 },
    temporada:    { type: 'enum', enum: ['baja', 'media', 'alta', 'especial'], default: 'media' },
    fecha_inicio: { type: 'date' },
    fecha_fin:    { type: 'date' },
    activa:       { type: 'boolean', default: true },
    created_by:   { type: 'bigint', unsigned: true, nullable: true },
    created_at:   { type: 'datetime', createDate: true },
  },
});
