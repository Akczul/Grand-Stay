// Especialización de Usuario: Administrador
import { EntitySchema } from 'typeorm';

export const Administrador = new EntitySchema({
  name: 'Administrador',
  tableName: 'administradores',
  columns: {
    id_admin:      { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_usuario:    { type: 'bigint', unsigned: true, unique: true },
    nivel_acceso:  { type: 'tinyint', unsigned: true, default: 1 },
    departamento:  { type: 'varchar', length: 60, nullable: true },
    fecha_ingreso: { type: 'date' },
  },
});
