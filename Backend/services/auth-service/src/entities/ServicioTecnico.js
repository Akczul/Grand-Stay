// Especialización de Usuario: ServicioTecnico
import { EntitySchema } from 'typeorm';

export const ServicioTecnico = new EntitySchema({
  name: 'ServicioTecnico',
  tableName: 'servicio_tecnico',
  columns: {
    id_tecnico:          { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_usuario:          { type: 'bigint', unsigned: true, unique: true },
    id_especialidad:     { type: 'tinyint', unsigned: true },
    nivel_certificacion: { type: 'varchar', length: 40, nullable: true },
    turno:               { type: 'enum', enum: ['manana', 'tarde', 'noche', 'rotativo'], default: 'rotativo' },
    fecha_ingreso:       { type: 'date' },
  },
});
