# Grand-Stay · Frontend

Interfaz web del sistema de gestión hotelera **Grand-Stay**, desarrollada en **React 18 + Vite** con **Tailwind CSS** y consumo del backend a través del API Gateway.

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| Estilos | Tailwind CSS + PostCSS |
| Routing | React Router |
| Estado global | Context API (`AuthContext`, `UIContext`) |
| HTTP | Axios (proxy `/api` → API Gateway) |
| Lenguaje | JavaScript (ES Modules) |

---

## 2. Estructura

```
Frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Toast.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── UIContext.jsx
│   ├── hooks/
│   │   └── useFormValidation.js
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Rooms.jsx
│   │   ├── Reservations.jsx
│   │   ├── Consumptions.jsx
│   │   ├── Billing.jsx
│   │   ├── Cleaning.jsx
│   │   └── Reports.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── errorHelpers.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 3. Requisitos Previos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- El **backend** debe estar corriendo (mínimo el API Gateway en `http://localhost:4000`). Ver [../Backend/README.md](../Backend/README.md).

---

## 4. Instalación y Ejecución

Desde la carpeta `Frontend/`:

```bash
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**.

Vite redirige automáticamente todas las llamadas a `/api` hacia `http://localhost:4000` (API Gateway) mediante proxy en [vite.config.js](vite.config.js).

### Build de producción

```bash
npm run build
npm run preview
```

---

## 5. Páginas y Funcionalidad

| Página | Ruta | Descripción |
|--------|------|-------------|
| LandingPage | `/` | Página pública de bienvenida |
| Login | `/login` | Autenticación con JWT |
| Dashboard | `/dashboard` | Resumen general (todos los roles) |
| Rooms | `/rooms` | Gestión de habitaciones |
| Reservations | `/reservations` | Reservas, check-in y check-out |
| Consumptions | `/consumptions` | Cargos adicionales por reserva |
| Billing | `/billing` | Facturación consolidada |
| Cleaning | `/cleaning` | Tareas de limpieza e insumos |
| Reports | `/reports` | Reportes (solo Administrador) |

Las rutas protegidas se encapsulan con [`ProtectedRoute`](src/components/ProtectedRoute.jsx), que valida el JWT desde `AuthContext` y redirige a `/login` si no hay sesión.

---

## 6. Roles y Permisos en la UI

| Funcionalidad | Administrador | Recepcionista | Limpieza | Huésped |
|---------------|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Gestión de habitaciones | ✓ | — | — | — |
| Cambiar estado de habitación | ✓ | ✓ | — | — |
| Cambiar tarifas | ✓ | — | — | — |
| Crear reservas | ✓ | ✓ | — | ✓ |
| Check-in / Check-out | ✓ | ✓ | — | — |
| Registrar consumos | ✓ | ✓ | — | — |
| Facturación | ✓ | ✓ | — | — |
| Tareas de limpieza | ✓ | — | ✓ | — |
| Insumos | ✓ | — | ✓ | — |
| Reportes | ✓ | — | — | — |

---

## 7. Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@grandstay.com | password123 |
| Recepcionista | recepcion@grandstay.com | password123 |
| Limpieza | limpieza@grandstay.com | password123 |
| Huésped | huesped@grandstay.com | password123 |

> Los usuarios se crean al ejecutar `seed_data.sql` del backend, o registrándolos desde la pantalla de login.

---

## 8. Notas de Desarrollo

- El cliente HTTP centralizado vive en [src/services/api.js](src/services/api.js) e inyecta el JWT automáticamente.
- Los errores de API se normalizan vía [src/utils/errorHelpers.js](src/utils/errorHelpers.js).
- Las notificaciones visuales (toasts) se gestionan desde [`UIContext`](src/context/UIContext.jsx).
- El proxy de Vite evita problemas de CORS en desarrollo; en producción debes configurar el reverse proxy hacia el API Gateway.
