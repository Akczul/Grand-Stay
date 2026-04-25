# Base de Datos — Grand-Stay

Esquema institucional **único** (`grandstay_db`) compartido por todos los microservicios.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| [Grand-Stay.sql](Grand-Stay.sql) | Esquema completo: 23 tablas, 4 vistas, 5 triggers, índices y catálogos base. |
| [seed_data.sql](seed_data.sql) | Datos de prueba: usuarios, huéspedes, habitaciones, tarifas, servicios, insumos. |

## Carga inicial

```bash
# 1) Crear esquema (DROP + CREATE de la BD, tablas, vistas, triggers)
mysql -u root -p < Grand-Stay.sql

# 2) Cargar datos de prueba
mysql -u root -p < seed_data.sql
```

> El script `Grand-Stay.sql` ejecuta `DROP DATABASE IF EXISTS grandstay_db` al inicio, así que **destruye datos existentes**. Úsalo solo en desarrollo.

## Modelo

Una sola base de datos `grandstay_db` con 10 módulos:

1. **Acceso y Usuarios** — `roles`, `usuarios`, `recepcionistas`, `administradores`, `personal_limpieza`, `servicio_tecnico`, `especialidades`.
2. **Huéspedes** — `huespedes` (con fidelización y consentimiento de datos).
3. **Habitaciones y Tarifas** — `tipos_habitacion`, `habitaciones`, `tarifas`.
4. **Reservas y Pagos** — `reservas`, `tokens_pago`.
5. **Ciclo de Estadía** — `checkin`, `checkout`.
6. **Facturación** — `facturas`, `items_factura`.
7. **Servicios Adicionales** — `servicios_adicionales`, `consumo_servicios`.
8. **Inventario** — `insumos_limpieza`, `consumo_insumos`.
9. **Comunicaciones** — `notificaciones`.
10. **Reportes y Auditoría** — `reportes`, `log_auditoria` (append-only).

## Usuarios de prueba (tras `seed_data.sql`)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@grandstay.com | password123 |
| Recepcionista | recepcion@grandstay.com | password123 |
| Personal de limpieza | limpieza@grandstay.com | password123 |
| Servicio técnico | tecnico@grandstay.com | password123 |
| Huésped | huesped@grandstay.com | password123 |

## Notas para microservicios

- **TypeORM debe ir con `synchronize: false`**. El esquema lo gobierna `Grand-Stay.sql` (incluye triggers que TypeORM no conoce).
- Cada microservicio configura `DB_NAME=grandstay_db` y solo opera sobre las tablas que le corresponden por dominio (ver tabla en [../README.md](../README.md)).
