// Catálogo de servicios adicionales (mapea a `servicios_adicionales`)
import { EntitySchema } from 'typeorm';

export const ServicioAdicional = new EntitySchema({
  name: 'ServicioAdicional',
  tableName: 'servicios_adicionales',
  columns: {
    id_servicio:      { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    nombre:           { type: 'varchar', length: 100 },
    descripcion:      { type: 'text', nullable: true },
    categoria: {
      type: 'enum',
      enum: ['spa', 'restaurante', 'transporte', 'lavanderia', 'room_service', 'entretenimiento', 'tour', 'otro'],
    },
    precio:           { type: 'decimal', precision: 10, scale: 2 },
    duracion_minutos: { type: 'smallint', unsigned: true, nullable: true },
    requiere_reserva: { type: 'boolean', default: false },
    disponible:       { type: 'boolean', default: true },
    activo:           { type: 'boolean', default: true },
  },
});
