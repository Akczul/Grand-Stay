# Grand-Stay · Backend

Backend del sistema de gestión hotelera **Grand-Stay**, construido sobre una arquitectura de **microservicios** en Node.js detrás de un API Gateway con validación JWT.

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| API Gateway | Express.js (puerto 4000) |
| Microservicios | Node.js + Express.js |
| ORM | TypeORM |
| Base de datos | MySQL (una DB por microservicio) |
| Autenticación | JWT (JSON Web Tokens) + bcrypt |
| Emails | Nodemailer |
| Lenguaje | JavaScript (ES Modules) |

---

## 2. Arquitectura

```
                ┌──────────────────┐
                │   API Gateway    │
                │  Express :4000   │
                │  (JWT Validator) │
                └────────┬─────────┘
                         │
   ┌──────┬──────┬───────┼───────┬──────┬──────┬──────┐
   │      │      │       │       │      │      │      │
┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐
│Auth ││Rooms││Resrv││Consu││Billi││Clean││Notif││Repor│
│:3001││:3002││:3003││:3004││:3005││:3006││:3007││:3008│
└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└─────┘└─────┘
   ▼      ▼      ▼      ▼      ▼      ▼
 MySQL  MySQL  MySQL  MySQL  MySQL  MySQL
```

---

## 3. Microservicios

| Servicio | Puerto | Base de Datos | Descripción |
|----------|--------|---------------|-------------|
| auth-service | 3001 | grand_stay_auth | Login, registro, roles (JWT + bcrypt) |
| rooms-service | 3002 | grand_stay_rooms | CRUD habitaciones, tipos, estados, tarifas |
| reservations-service | 3003 | grand_stay_reservations | Reservas, check-in, check-out |
| consumptions-service | 3004 | grand_stay_consumptions | Cargos adicionales (restaurante, spa, etc.) |
| billing-service | 3005 | grand_stay_billing | Facturación consolidada |
| cleaning-service | 3006 | grand_stay_cleaning | Tareas de limpieza e insumos |
| notifications-service | 3007 | — | Emails con Nodemailer |
| reports-service | 3008 | — | Reportes de ocupación, ingresos, servicios |

---

## 4. Estructura

```
Backend/
├── api-gateway/              # API Gateway (puerto 4000)
│   ├── src/
│   │   ├── middlewares/authMiddleware.js
│   │   └── index.js
│   └── package.json
├── services/
│   ├── auth-service/         # Autenticación (3001)
│   ├── rooms-service/        # Habitaciones (3002)
│   ├── reservations-service/ # Reservaciones (3003)
│   ├── consumptions-service/ # Consumos (3004)
│   ├── billing-service/      # Facturación (3005)
│   ├── cleaning-service/     # Limpieza (3006)
│   ├── notifications-service/# Notificaciones (3007)
│   └── reports-service/      # Reportes (3008)
├── database/
│   ├── create_databases.sql
│   ├── Grand-Stay.sql
│   └── seed_data.sql
└── README.md
```

---

## 5. Requisitos Previos

- **Node.js** ≥ 18.x
- **MySQL** ≥ 8.0
- **npm** ≥ 9.x

---

## 6. Instalación

### 6.1 Crear las bases de datos

```bash
mysql -u root -p < database/create_databases.sql
```

### 6.2 Configurar variables de entorno

Cada servicio dispone de un `.env` con valores por defecto. Ajusta credenciales de MySQL si es necesario:

- `DB_USER` — Usuario de MySQL (default: `root`)
- `DB_PASSWORD` — Contraseña de MySQL (default: `root`)

### 6.3 Instalar dependencias

Desde la carpeta `Backend/`:

```bash
cd api-gateway && npm install && cd ..
cd services/auth-service && npm install && cd ../..
cd services/rooms-service && npm install && cd ../..
cd services/reservations-service && npm install && cd ../..
cd services/consumptions-service && npm install && cd ../..
cd services/billing-service && npm install && cd ../..
cd services/cleaning-service && npm install && cd ../..
cd services/notifications-service && npm install && cd ../..
cd services/reports-service && npm install && cd ../..
```

Comando único para entornos Unix/macOS/Git Bash:

```bash
for dir in api-gateway services/auth-service services/rooms-service services/reservations-service services/consumptions-service services/billing-service services/cleaning-service services/notifications-service services/reports-service; do
  echo "Instalando dependencias en $dir..."
  (cd "$dir" && npm install)
done
```

---

## 7. Ejecución

Una terminal por servicio (o usa un process manager como `concurrently` / `pm2`):

```bash
# Terminal 1 — API Gateway
cd api-gateway && npm run dev

# Terminales 2–9 — Microservicios
cd services/auth-service && npm run dev
cd services/rooms-service && npm run dev
cd services/reservations-service && npm run dev
cd services/consumptions-service && npm run dev
cd services/billing-service && npm run dev
cd services/cleaning-service && npm run dev
cd services/notifications-service && npm run dev
cd services/reports-service && npm run dev
```

### Datos de prueba (opcional)

Una vez que los servicios crearon las tablas (TypeORM `synchronize: true`):

```bash
mysql -u root -p < database/seed_data.sql
```

---

## 8. Endpoints (API Gateway)

### Auth — `/api/auth`
- `POST /register` — Registro de usuario
- `POST /login` — Login (retorna JWT)
- `GET  /profile` — Perfil del usuario autenticado
- `GET  /users` — Listar usuarios (Admin)

### Rooms — `/api/rooms`
- `GET   /` — Listar (filtros: tipo, estado)
- `GET   /available` — Disponibles
- `POST  /` — Crear (Admin)
- `PATCH /:id/estado` — Cambiar estado (Recepcionista)
- `PATCH /:id/tarifa` — Cambiar tarifa (Admin)

### Reservations — `/api/reservations`
- `GET   /` — Listar
- `POST  /` — Crear
- `PATCH /:id/checkin` — Check-in
- `PATCH /:id/checkout` — Check-out (genera factura)

### Consumptions — `/api/consumptions`
- `GET  /` — Listar
- `POST /` — Registrar
- `GET  /reserva/:reservaId` — Por reserva
- `GET  /filtro` — Filtrar por fechas, reserva, tipo o concepto
- `POST /validar-limite` — Validar límite máximo por reserva
- `GET  /auditoria` — Auditoría (creación/modificación/estado)

### Billing — `/api/billing`
- `GET   /` — Listar facturas
- `POST  /generar` — Generar factura
- `PATCH /:id/pagar` — Marcar como pagada

### Cleaning — `/api/cleaning`
- `GET   /tareas` — Listar tareas
- `POST  /tareas` — Crear tarea
- `PATCH /tareas/:id/completar` — Completar tarea
- `GET   /insumos` — Listar insumos
- `POST  /insumos` — Crear insumo

### Notifications — `/api/notifications`
- `POST /notify` — Enviar email (`confirmacion_reserva`, `codigo_acceso`, `factura_electronica`)

### Reports — `/api/reports`
- `GET /ocupacion` — Ocupación mensual
- `GET /ingresos` — Ingresos por tipo de habitación
- `GET /servicios` — Servicios más rentables
- `GET /dashboard` — Dashboard general

---

## 9. Reglas de Negocio

1. Una habitación en estado **"Sucia"** o **"En Mantenimiento"** NO puede ser reservada.
2. El **check-out** genera automáticamente la factura sumando reserva + consumos.
3. Al confirmar una reserva, **notifications-service** envía email automáticamente.
4. Solo se permiten consumos en reservas con estado **"Activa"**.
5. Cada reserva puede tener solo una factura asociada.
6. Solo el **Administrador** puede cambiar tarifas de temporada.
7. Solo el **Recepcionista** puede asignar y cambiar el estado de habitaciones.
8. Los **reportes** solo son accesibles para el rol Administrador.

---

## 10. Características Destacadas

### Consumptions Service (3004)
Registra cargos adicionales (restaurante, spa, lavandería, minibar) vinculados a una reserva activa. Valida contra reservations-service que la reserva esté en estado "Activa". Cada consumo incluye tipo, descripción, monto y cantidad.

**Mejoras (Issue 2):**
- Prevención de duplicados por `reservaId + concepto + monto + fecha` (HTTP `409`).
- Filtrado avanzado: `GET /api/consumptions/filtro?fecha_inicio=&fecha_fin=&reservaId=&concepto=&tipo=`.
- Validación de límite por reserva: `POST /api/consumptions/validar-limite`.
- Endpoint de auditoría: `GET /api/consumptions/auditoria`.
- Entidad `Consumo` con `estado`, `createdAt`, `updatedAt`.

### Billing Service (3005)
Genera facturas consolidadas en el check-out, sumando tarifa de habitación + consumos, calcula IVA (16%) y guarda el estado de pago (Emitida, Pagada, Anulada).

### Notifications Service (3007)
Envía notificaciones por email con plantillas HTML profesionales en tres momentos clave:
- Confirmación de reserva (RF-09).
- Código de acceso.
- Factura electrónica (RF-10).

En desarrollo usa **Ethereal** (SMTP de prueba); en producción soporta cualquier SMTP real.

---

## 11. Notas de Desarrollo

- **TypeORM** con `synchronize: true` crea las tablas automáticamente al iniciar cada servicio.
- **Nodemailer** usa cuentas de prueba de Ethereal por defecto en desarrollo; los emails se visualizan en la URL que muestra la consola.
- Si un microservicio no está disponible, los demás siguen funcionando (arquitectura resiliente).
