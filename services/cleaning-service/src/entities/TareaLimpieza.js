// ============================================================
// Entidad TareaLimpieza - TypeORM
// Registro de tareas de limpieza asignadas a habitaciones
// ============================================================

import { EntitySchema } from 'typeorm';

export const TareaLimpieza = new EntitySchema({
  name: 'TareaLimpieza',
  tableName: 'tareas_limpieza',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    habitacionId: {
      type: 'int',
      nullable: false,
    },
    habitacionNumero: {
      type: 'varchar',
      length: 10,
      nullable: true,
    },
    asignadoA: {
      type: 'varchar',
      length: 100,
      nullable: true, // Nombre del personal de limpieza
    },
    estado: {
      type: 'enum',
      enum: ['Pendiente', 'EnProceso', 'Completada'],
      default: "'Pendiente'",
    },
    prioridad: {
      type: 'enum',
      enum: ['Baja', 'Normal', 'Alta', 'Urgente'],
      default: "'Normal'",
    },
    notas: {
      type: 'text',
      nullable: true,
    },
    fechaAsignacion: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    fechaCompletado: {
      type: 'timestamp',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});
