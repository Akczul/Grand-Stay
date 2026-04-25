// Reserva (mapea a `reservas`)
import { EntitySchema } from 'typeorm';

export const Reserva = new EntitySchema({
  name: 'Reserva',
  tableName: 'reservas',
  columns: {
    id_reserva:           { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    codigo_confirmacion:  { type: 'varchar', length: 16, unique: true },
    id_huesped:           { type: 'bigint', unsigned: true },
    id_recepcionista:     { type: 'bigint', unsigned: true, nullable: true },
    id_tipo_habitacion:   { type: 'tinyint', unsigned: true },
    id_habitacion:        { type: 'bigint', unsigned: true, nullable: true },
    fecha_entrada:        { type: 'date' },
    fecha_salida:         { type: 'date' },
    num_adultos:          { type: 'tinyint', unsigned: true, default: 1 },
    num_ninos:            { type: 'tinyint', unsigned: true, default: 0 },
    estado: {
      type: 'enum',
      enum: ['pendiente', 'confirmada', 'cancelada', 'no_show', 'completada'],
      default: 'pendiente',
    },
    canal_reserva: {
      type: 'enum',
      enum: ['web', 'telefono', 'presencial', 'agencia', 'OTA'],
      default: 'presencial',
    },
    monto_pagado:         { type: 'decimal', precision: 12, scale: 2, default: 0 },
    observaciones:        { type: 'text', nullable: true },
    politica_cancelacion: { type: 'enum', enum: ['flexible', 'moderada', 'estricta'], default: 'moderada' },
    created_at:           { type: 'datetime', createDate: true },
    updated_at:           { type: 'datetime', updateDate: true },
  },
});
