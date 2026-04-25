// Huésped (puede tener cuenta de usuario o ser registrado manualmente)
import { EntitySchema } from 'typeorm';

export const Huesped = new EntitySchema({
  name: 'Huesped',
  tableName: 'huespedes',
  columns: {
    id_huesped:           { type: 'bigint', primary: true, generated: 'increment', unsigned: true },
    id_usuario:           { type: 'bigint', unsigned: true, nullable: true },
    nombres:              { type: 'varchar', length: 80 },
    apellidos:            { type: 'varchar', length: 80 },
    tipo_documento:       { type: 'enum', enum: ['CC', 'CE', 'Pasaporte', 'TI', 'Otro'], default: 'CC' },
    num_documento:        { type: 'varchar', length: 30 },
    nacionalidad:         { type: 'varchar', length: 60, default: 'Colombia' },
    fecha_nacimiento:     { type: 'date', nullable: true },
    genero:               { type: 'enum', enum: ['M', 'F', 'Otro', 'Prefiero_no_decir'], nullable: true },
    telefono:             { type: 'varchar', length: 20, nullable: true },
    email:                { type: 'varchar', length: 120 },
    ciudad:               { type: 'varchar', length: 80, nullable: true },
    pais:                 { type: 'varchar', length: 60, default: 'Colombia' },
    vip:                  { type: 'boolean', default: false },
    nivel_fidelidad:      { type: 'enum', enum: ['Bronce', 'Plata', 'Oro', 'Platino'], default: 'Bronce' },
    puntos_fidelidad:     { type: 'int', unsigned: true, default: 0 },
    preferencias:         { type: 'text', nullable: true },
    consentimiento_datos: { type: 'boolean', default: false },
    fecha_registro:       { type: 'date' },
    created_at:           { type: 'datetime', createDate: true },
  },
});
