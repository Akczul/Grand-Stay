// Catálogo de tipos de habitación (Estándar, Deluxe, Suite, Presidencial...)
import { EntitySchema } from 'typeorm';

export const TipoHabitacion = new EntitySchema({
  name: 'TipoHabitacion',
  tableName: 'tipos_habitacion',
  columns: {
    id_tipo:         { type: 'tinyint', primary: true, generated: 'increment', unsigned: true },
    nombre:          { type: 'varchar', length: 60, unique: true },
    descripcion:     { type: 'text', nullable: true },
    capacidad_max:   { type: 'tinyint', unsigned: true, default: 2 },
    area_m2:         { type: 'decimal', precision: 6, scale: 2, nullable: true },
    vista:           { type: 'enum', enum: ['ciudad', 'mar', 'jardin', 'patio_interno', 'montaña', 'sin_vista'], nullable: true },
    camas_sencillas: { type: 'tinyint', unsigned: true, default: 0 },
    camas_dobles:    { type: 'tinyint', unsigned: true, default: 1 },
    amenidades:      { type: 'json', nullable: true },
    imagen_url:      { type: 'varchar', length: 255, nullable: true },
    activo:          { type: 'boolean', default: true },
  },
});
