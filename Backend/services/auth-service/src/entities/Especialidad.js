// Catálogo de Especialidades técnicas
import { EntitySchema } from 'typeorm';

export const Especialidad = new EntitySchema({
  name: 'Especialidad',
  tableName: 'especialidades',
  columns: {
    id_especialidad: { type: 'tinyint', primary: true, generated: 'increment', unsigned: true },
    nombre:          { type: 'varchar', length: 80, unique: true },
    descripcion:     { type: 'text', nullable: true },
    activo:          { type: 'boolean', default: true },
  },
});
