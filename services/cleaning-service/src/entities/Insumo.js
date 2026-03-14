// ============================================================
// Entidad Insumo - TypeORM
// Control de insumos de limpieza con stock mínimo
// ============================================================

import { EntitySchema } from 'typeorm';

export const Insumo = new EntitySchema({
  name: 'Insumo',
  tableName: 'insumos',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    nombre: {
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    cantidad: {
      type: 'int',
      default: 0,
    },
    unidad: {
      type: 'varchar',
      length: 30,
      nullable: false, // ej: 'litros', 'unidades', 'paquetes'
    },
    stockMinimo: {
      type: 'int',
      default: 5,
    },
    categoria: {
      type: 'varchar',
      length: 50,
      nullable: true, // ej: 'limpieza', 'baño', 'amenidades'
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
});
