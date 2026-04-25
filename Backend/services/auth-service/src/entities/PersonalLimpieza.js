// Especialización de Usuario: PersonalLimpieza
import { EntitySchema } from 'typeorm';

export const PersonalLimpieza = new EntitySchema({
  name: 'PersonalLimpieza',
  tableName: 'personal_limpieza',
  columns: {
    id_personal:    { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_usuario:     { type: 'bigint', unsigned: true, unique: true },
    turno_asignado: { type: 'enum', enum: ['manana', 'tarde', 'noche'], default: 'manana' },
    zona_asignada:  { type: 'varchar', length: 80, nullable: true },
    piso_asignado:  { type: 'tinyint', unsigned: true, nullable: true },
    fecha_ingreso:  { type: 'date' },
  },
});
