// Entidad Usuario (tabla base — generalización del modelo)
// Se relaciona con `roles` y con sus especializaciones:
//   Administrador, Recepcionista, PersonalLimpieza, ServicioTecnico
import { EntitySchema } from 'typeorm';

export const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id_usuario:    { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_rol:        { type: 'tinyint', unsigned: true },
    nombre:        { type: 'varchar', length: 80 },
    apellido:      { type: 'varchar', length: 80 },
    email:         { type: 'varchar', length: 120, unique: true },
    password_hash: { type: 'varchar', length: 255 },
    activo:        { type: 'boolean', default: true },
    ultimo_acceso: { type: 'datetime', nullable: true },
    created_at:    { type: 'datetime', createDate: true },
    updated_at:    { type: 'datetime', updateDate: true },
  },
  relations: {
    rol: {
      type: 'many-to-one',
      target: 'Rol',
      joinColumn: { name: 'id_rol', referencedColumnName: 'id_rol' },
      eager: true,
    },
  },
});
