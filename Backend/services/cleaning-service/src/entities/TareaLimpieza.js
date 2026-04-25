// Consumo de insumos por tarea de limpieza/mantenimiento
// (mapea a `consumo_insumos` — sustituye al concepto antiguo de TareaLimpieza)
// El "tipo_tarea" expresa la naturaleza de la actividad realizada.
import { EntitySchema } from 'typeorm';

export const TareaLimpieza = new EntitySchema({
  name: 'TareaLimpieza',
  tableName: 'consumo_insumos',
  columns: {
    id_consumo_insumo: { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_personal:       { type: 'bigint', unsigned: true },
    id_insumo:         { type: 'bigint', unsigned: true },
    id_habitacion:     { type: 'bigint', unsigned: true },
    tipo_tarea: {
      type: 'enum',
      enum: ['limpieza_rutina', 'limpieza_profunda', 'cambio_ropa', 'mantenimiento', 'checkin_prep'],
      default: 'limpieza_rutina',
    },
    cantidad:      { type: 'decimal', precision: 8, scale: 2 },
    fecha:         { type: 'datetime', createDate: true },
    observaciones: { type: 'text', nullable: true },
  },
});
