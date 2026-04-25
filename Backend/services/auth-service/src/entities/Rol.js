// Entidad Rol (catálogo de roles del sistema)
import { EntitySchema } from 'typeorm';

export const Rol = new EntitySchema({
  name: 'Rol',
  tableName: 'roles',
  columns: {
    id_rol:      { type: 'tinyint', primary: true, generated: 'increment', unsigned: true },
    nombre:      { type: 'varchar', length: 40, unique: true },
    descripcion: { type: 'text', nullable: true },
    activo:      { type: 'boolean', default: true },
  },
});
