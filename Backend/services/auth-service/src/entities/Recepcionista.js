// Especialización de Usuario: Recepcionista
import { EntitySchema } from 'typeorm';

export const Recepcionista = new EntitySchema({
  name: 'Recepcionista',
  tableName: 'recepcionistas',
  columns: {
    id_recepcionista: { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_usuario:       { type: 'bigint', unsigned: true, unique: true },
    codigo_empleado:  { type: 'varchar', length: 20, unique: true },
    turno:            { type: 'enum', enum: ['manana', 'tarde', 'noche', 'rotativo'], default: 'rotativo' },
    telefono_ext:     { type: 'varchar', length: 10, nullable: true },
    fecha_ingreso:    { type: 'date' },
  },
});
