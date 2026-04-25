// Entidad Habitacion (mapea a tabla `habitaciones`)
// Relacionada con `tipos_habitacion` (tipo) y `tarifas` (vía id_tipo).
import { EntitySchema } from 'typeorm';

export const Habitacion = new EntitySchema({
  name: 'Habitacion',
  tableName: 'habitaciones',
  columns: {
    id_habitacion:         { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_tipo:               { type: 'tinyint', unsigned: true },
    numero_habitacion:     { type: 'varchar', length: 6, unique: true },
    piso:                  { type: 'tinyint', unsigned: true },
    estado: {
      type: 'enum',
      enum: ['disponible', 'ocupada', 'mantenimiento', 'limpieza', 'bloqueada'],
      default: 'disponible',
    },
    descripcion_adicional: { type: 'text', nullable: true },
    ultima_limpieza:       { type: 'datetime', nullable: true },
    ultima_revision_tec:   { type: 'datetime', nullable: true },
    observaciones:         { type: 'text', nullable: true },
    activo:                { type: 'boolean', default: true },
  },
  relations: {
    tipo: {
      type: 'many-to-one',
      target: 'TipoHabitacion',
      joinColumn: { name: 'id_tipo', referencedColumnName: 'id_tipo' },
      eager: true,
    },
  },
});
