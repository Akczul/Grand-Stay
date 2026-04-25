// Notificación enviada (email, sms, push, whatsapp, interna)
import { EntitySchema } from 'typeorm';

export const Notificacion = new EntitySchema({
  name: 'Notificacion',
  tableName: 'notificaciones',
  columns: {
    id_notificacion: { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_reserva:      { type: 'bigint', unsigned: true, nullable: true },
    id_huesped:      { type: 'bigint', unsigned: true, nullable: true },
    id_usuario_dest: { type: 'bigint', unsigned: true, nullable: true },
    tipo:            { type: 'enum', enum: ['email', 'sms', 'push', 'whatsapp', 'interna'], default: 'email' },
    evento: {
      type: 'enum',
      enum: ['confirmacion_reserva', 'recordatorio_checkin', 'checkout_completado', 'factura', 'alerta_stock', 'mantenimiento', 'bienvenida', 'otro'],
    },
    destinatario: { type: 'varchar', length: 120 },
    asunto:       { type: 'varchar', length: 200, nullable: true },
    cuerpo:       { type: 'text' },
    estado:       { type: 'enum', enum: ['pendiente', 'enviada', 'fallida', 'leida'], default: 'pendiente' },
    intentos:     { type: 'tinyint', unsigned: true, default: 0 },
    fecha_envio:  { type: 'datetime', nullable: true },
    created_at:   { type: 'datetime', createDate: true },
  },
});
