// Log de auditoría — append-only (no UPDATE/DELETE a nivel app)
import { EntitySchema } from 'typeorm';

export const LogAuditoria = new EntitySchema({
  name: 'LogAuditoria',
  tableName: 'log_auditoria',
  columns: {
    id_log:           { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_usuario:       { type: 'bigint', unsigned: true, nullable: true },
    tabla_afectada:   { type: 'varchar', length: 60 },
    accion:           { type: 'enum', enum: ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'] },
    id_registro:      { type: 'bigint', unsigned: true, nullable: true },
    datos_anteriores: { type: 'json', nullable: true },
    datos_nuevos:     { type: 'json', nullable: true },
    ip_origen:        { type: 'varchar', length: 45, nullable: true },
    user_agent:       { type: 'varchar', length: 255, nullable: true },
    fecha_hora:       { type: 'datetime', createDate: true },
  },
});
