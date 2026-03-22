# Grand-Stay - Sistema de Gestión Hotelera

Sistema completo de gestión hotelera basado en arquitectura de microservicios.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| API Gateway | Express.js (puerto 4000) |
| Microservicios | Node.js + Express.js |
| ORM | TypeORM |
| Base de datos | MySQL (una DB por microservicio) |
| Autenticación | JWT (JSON Web Tokens) |
| Emails | Nodemailer |
| Lenguaje | JavaScript (ES Modules) |

## Arquitectura

```
                    ┌─────────────────┐
                    │   Frontend       │
                    │  React + Vite    │
                    │   :5173          │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway     │
                    │  Express :4000   │
                    │  (JWT Validator) │
                    └────────┬────────┘
                             │
        ┌──────┬──────┬──────┼──────┬──────┬──────┬──────┐
        │      │      │      │      │      │      │      │
   ┌────▼─┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐
   │ Auth ││Rooms││Resrv││Consu││Billi││Clean││Notif││Repor│
   │:3001 ││:3002││:3003││:3004││:3005││:3006││:3007││:3008│
   └──┬───┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└─────┘└─────┘
      │       │      │      │      │      │
      ▼       ▼      ▼      ▼      ▼      ▼
    MySQL   MySQL  MySQL  MySQL  MySQL  MySQL
```

## Microservicios

| Servicio | Puerto | Base de Datos | Descripción |
|----------|--------|---------------|-------------|
| auth-service | 3001 | grand_stay_auth | Login, registro, roles (JWT + bcrypt) |
| rooms-service | 3002 | grand_stay_rooms | CRUD habitaciones, tipos, estados, tarifas |
| reservations-service | 3003 | grand_stay_reservations | Reservas, check-in, check-out |
| consumptions-service | 3004 | grand_stay_consumptions | Cargos adicionales (restaurante, spa, etc.) |
| billing-service | 3005 | grand_stay_billing | Facturación consolidada |
| cleaning-service | 3006 | grand_stay_cleaning | Tareas de limpieza e insumos |
| notifications-service | 3007 | - | Emails con Nodemailer |
| reports-service | 3008 | - | Reportes de ocupación, ingresos, servicios |

## Requisitos Previos

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **npm** >= 9.x

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Grand-Stay
```

### 2. Crear las bases de datos MySQL

```bash
mysql -u root -p < database/create_databases.sql
```

### 3. Configurar variables de entorno

Cada servicio tiene un archivo `.env` con valores por defecto. Revisa y ajusta las credenciales de MySQL si es necesario:

- `DB_USER` - Usuario de MySQL (default: `root`)
- `DB_PASSWORD` - Contraseña de MySQL (default: `root`)

### 4. Instalar dependencias

Ejecutar desde la raíz del proyecto:

```bash
# API Gateway
cd api-gateway && npm install && cd ..

# Microservicios
cd services/auth-service && npm install && cd ../..
cd services/rooms-service && npm install && cd ../..
cd services/reservations-service && npm install && cd ../..
cd services/consumptions-service && npm install && cd ../..
cd services/billing-service && npm install && cd ../..
cd services/cleaning-service && npm install && cd ../..
cd services/notifications-service && npm install && cd ../..
cd services/reports-service && npm install && cd ../..

# Frontend
cd frontend && npm install && cd ..
```

O usar este comando para instalar todo de una vez (Unix/macOS/Git Bash):

```bash
for dir in api-gateway services/auth-service services/rooms-service services/reservations-service services/consumptions-service services/billing-service services/cleaning-service services/notifications-service services/reports-service frontend; do
  echo "Instalando dependencias en $dir..."
  (cd "$dir" && npm install)
done
```

### 5. Iniciar los servicios

Abre una terminal para cada servicio (o usa un process manager como `concurrently` o `pm2`):

```bash
# Terminal 1 - API Gateway
cd api-gateway && npm run dev

# Terminal 2 - Auth Service
cd services/auth-service && npm run dev

# Terminal 3 - Rooms Service
cd services/rooms-service && npm run dev

# Terminal 4 - Reservations Service
cd services/reservations-service && npm run dev

# Terminal 5 - Consumptions Service
cd services/consumptions-service && npm run dev

# Terminal 6 - Billing Service
cd services/billing-service && npm run dev

# Terminal 7 - Cleaning Service
cd services/cleaning-service && npm run dev

# Terminal 8 - Notifications Service
cd services/notifications-service && npm run dev

# Terminal 9 - Reports Service
cd services/reports-service && npm run dev

# Terminal 10 - Frontend
cd frontend && npm run dev
```

### 6. Cargar datos de prueba (opcional)

Una vez que todos los servicios estén corriendo (las tablas se crean automáticamente):

```bash
mysql -u root -p < database/seed_data.sql
```

### 7. Acceder a la aplicación

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:4000

## Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@grandstay.com | password123 |
| Recepcionista | recepcion@grandstay.com | password123 |
| Limpieza | limpieza@grandstay.com | password123 |
| Huésped | huesped@grandstay.com | password123 |

> **Nota:** Los usuarios de prueba se crean con el script `seed_data.sql`. Alternativamente, puedes registrar usuarios desde la interfaz de login.

## Roles y Permisos

| Funcionalidad | Administrador | Recepcionista | Limpieza | Huésped |
|--------------|:---:|:---:|:---:|:---:|
| Dashboard | X | X | X | X |
| Gestión de habitaciones | X | - | - | - |
| Cambiar estado habitación | X | X | - | - |
| Cambiar tarifas | X | - | - | - |
| Crear reservas | X | X | - | X |
| Check-in / Check-out | X | X | - | - |
| Registrar consumos | X | X | - | - |
| Facturación | X | X | - | - |
| Tareas de limpieza | X | - | X | - |
| Insumos | X | - | X | - |
| Reportes | X | - | - | - |

## Características Implementadas

### Consumptions Service (Puerto 3004)

Permite registrar cargos adicionales (restaurante, spa, lavandería, minibar) vinculados a una reserva activa. Los consumos se validan contra el servicio de reservaciones para asegurar que solo se registren en reservas con estado "Activa". Cada consumo incluye: tipo, descripción, monto y cantidad.

### Billing Service (Puerto 3005)

Genera facturas consolidadas al momento del check-out, sumando automáticamente la tarifa de habitación con todos los consumos registrados. La factura incluye el cálculo de IVA (16%), desglose detallado de consumos y almacenamiento del estado de pago (Emitida, Pagada, Anulada).

### Notifications Service (Puerto 3007)

Envía notificaciones por email con plantillas HTML profesionales en tres momentos clave: confirmación de reserva, código de acceso y factura electrónica. En desarrollo utiliza Ethereal (servidor SMTP de prueba) y en producción soporta cualquier servidor SMTP real. Los emails se envían automáticamente tras eventos del ciclo de reserva.

Consulta [IMPLEMENTACION_MICROSERVICIOS.md](./IMPLEMENTACION_MICROSERVICIOS.md) para documentación detallada de endpoints y [ESQUEMA_BD.md](./ESQUEMA_BD.md) para el esquema de bases de datos.

## Reglas de Negocio

1. Una habitación en estado **"Sucia"** o **"En Mantenimiento"** NO puede ser reservada
2. El **check-out** genera automáticamente la factura sumando reserva + todos los consumos
3. Al confirmar una reserva, **notifications-service** envía email automáticamente
4. Solo se permiten consumos en reservas con estado **"Activa"**
5. Cada reserva puede tener solo una factura asociada
6. Solo el **Administrador** puede cambiar tarifas de temporada
7. Solo el **Recepcionista** puede asignar y cambiar el estado de habitaciones
8. Los **reportes** solo son accesibles para el rol Administrador

## Requisitos Funcionales de Notificaciones

- **RF-09:** Email de confirmación de reserva  
  Al crear una reserva exitosamente, se envía automáticamente un email al huésped con número de reserva, fechas, tipo de habitación, código de acceso y total estimado.

- **RF-10:** Email de factura electrónica  
  Al realizar check-out y generar la factura, se envía automáticamente un email con el detalle completo en HTML (hospedaje, consumos, impuestos y total final).

## Endpoints Principales (API Gateway)

### Auth (`/api/auth`)
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/profile` - Perfil del usuario autenticado
- `GET /api/auth/users` - Listar usuarios (Admin)

### Rooms (`/api/rooms`)
- `GET /api/rooms` - Listar habitaciones (filtros: tipo, estado)
- `GET /api/rooms/available` - Habitaciones disponibles
- `POST /api/rooms` - Crear habitación (Admin)
- `PATCH /api/rooms/:id/estado` - Cambiar estado (Recepcionista)
- `PATCH /api/rooms/:id/tarifa` - Cambiar tarifa (Admin)

### Reservations (`/api/reservations`)
- `GET /api/reservations` - Listar reservas
- `POST /api/reservations` - Crear reserva
- `PATCH /api/reservations/:id/checkin` - Check-in
- `PATCH /api/reservations/:id/checkout` - Check-out (genera factura)

### Consumptions (`/api/consumptions`)
- `GET /api/consumptions` - Listar consumos
- `POST /api/consumptions` - Registrar consumo
- `GET /api/consumptions/reserva/:reservaId` - Consumos por reserva

### Billing (`/api/billing`)
- `GET /api/billing` - Listar facturas
- `POST /api/billing/generar` - Generar factura
- `PATCH /api/billing/:id/pagar` - Marcar como pagada

### Cleaning (`/api/cleaning`)
- `GET /api/cleaning/tareas` - Listar tareas
- `POST /api/cleaning/tareas` - Crear tarea
- `PATCH /api/cleaning/tareas/:id/completar` - Completar tarea
- `GET /api/cleaning/insumos` - Listar insumos
- `POST /api/cleaning/insumos` - Crear insumo

### Notifications (`/api/notifications`)
- `POST /api/notifications/notify` - Enviar email (tipo: confirmacion_reserva, codigo_acceso, factura_electronica)

### Reports (`/api/reports`)
- `GET /api/reports/ocupacion` - Reporte de ocupación mensual
- `GET /api/reports/ingresos` - Ingresos por tipo de habitación
- `GET /api/reports/servicios` - Servicios más rentables
- `GET /api/reports/dashboard` - Dashboard general

## Estructura del Proyecto

```
Grand-Stay/
├── api-gateway/              # API Gateway (puerto 4000)
│   ├── src/
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   └── index.js
│   └── package.json
├── services/
│   ├── auth-service/         # Autenticación (puerto 3001)
│   ├── rooms-service/        # Habitaciones (puerto 3002)
│   ├── reservations-service/ # Reservaciones (puerto 3003)
│   ├── consumptions-service/ # Consumos (puerto 3004)
│   ├── billing-service/      # Facturación (puerto 3005)
│   ├── cleaning-service/     # Limpieza (puerto 3006)
│   ├── notifications-service/# Notificaciones (puerto 3007)
│   └── reports-service/      # Reportes (puerto 3008)
├── frontend/                 # React + Vite (puerto 5173)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│   └── package.json
├── database/
│   ├── create_databases.sql
│   └── seed_data.sql
└── README.md
```

## Notas de Desarrollo

- **TypeORM** con `synchronize: true` crea las tablas automáticamente al iniciar cada servicio
- **Nodemailer** usa cuentas de prueba de Ethereal por defecto en desarrollo; los emails se pueden visualizar en la URL que muestra la consola
- Si un microservicio no está disponible, los demás siguen funcionando (arquitectura resiliente)
- El frontend usa Vite proxy para redirigir `/api` al gateway en desarrollo
