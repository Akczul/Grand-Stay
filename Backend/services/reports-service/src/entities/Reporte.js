// Reportes generados por administradores
import { EntitySchema } from 'typeorm';

export const Reporte = new EntitySchema({
  name: 'Reporte',
  tableName: 'reportes',
  columns: {
    id_reporte:     { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    generado_por:   { type: 'bigint', unsigned: true },
    tipo_reporte: {
      type: 'enum',
      enum: ['ocupacion', 'financiero', 'mantenimiento', 'limpieza', 'inventario', 'auditoria', 'personalizado'],
    },
    titulo:         { type: 'varchar', length: 200 },
    periodo_inicio: { type: 'date' },
    periodo_fin:    { type: 'date' },
    parametros:     { type: 'json', nullable: true },
    ruta_archivo:   { type: 'varchar', length: 255, nullable: true },
    formato:        { type: 'enum', enum: ['PDF', 'XLSX', 'CSV', 'HTML'], default: 'PDF' },
    created_at:     { type: 'datetime', createDate: true },
  },
});
