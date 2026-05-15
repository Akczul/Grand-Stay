# Grand-Stay

Sistema completo de **gestión hotelera de lujo** basado en arquitectura de microservicios.

> Repositorio organizado en dos dominios principales: [Backend](Backend/) (microservicios + API Gateway + base de datos) y [Frontend](Frontend/) (SPA en React).

---

## Visión General

| Capa | Tecnología | Puerto |
|------|------------|:------:|
| Frontend | React 18 + Vite + Tailwind CSS | 5173 |
| API Gateway | Express.js (JWT validator) | 4000 |
| Microservicios | Node.js + Express + TypeORM | 3001–3008 |
| Base de datos | MySQL (una DB por microservicio) | 3306 |

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│    Frontend     │ ───▶ │   API Gateway    │ ───▶ │   8 Microservicios  │
│  React :5173    │      │   Express :4000  │      │   3001 … 3008       │
└─────────────────┘      └──────────────────┘      └─────────────────────┘
```

---

## Estructura del Repositorio

```
Grand-Stay/
├── Backend/        # API Gateway, microservicios y scripts SQL
│   ├── api-gateway/
│   ├── services/
│   ├── database/
│   └── README.md
├── Frontend/       # SPA en React + Vite
│   ├── src/
│   └── README.md
└── README.md
```

---

## Inicio Rápido

### Opción recomendada: Docker Compose

Desde la raíz del proyecto:

```powershell
docker compose up -d --build
```

Esto levanta en una sola ejecución:

- Frontend: http://localhost:5173
- API Gateway: http://localhost:4000
- MySQL: localhost:3306
- Microservicios backend: puertos 3001 a 3008

Comandos útiles:

```powershell
docker compose ps
docker compose logs -f api-gateway
docker compose down
```

Si necesitas reinicializar la base de datos desde `Backend/database/Grand-Stay.sql`, elimina también el volumen:

```powershell
docker compose down -v
docker compose up -d --build
```

### Opción manual

1. **Levantar el backend** — sigue [Backend/README.md](Backend/README.md) (crear DBs, instalar dependencias, levantar API Gateway + 8 microservicios).
2. **Levantar el frontend** — sigue [Frontend/README.md](Frontend/README.md) (`npm install && npm run dev`).
3. Acceder a **http://localhost:5173**.

---

## Documentación Detallada

- [Backend/README.md](Backend/README.md) — endpoints, microservicios, reglas de negocio, base de datos.
- [Frontend/README.md](Frontend/README.md) — páginas, roles, contexto, configuración de Vite.

---

## Requisitos Previos

- **Node.js** ≥ 18.x
- **MySQL** ≥ 8.0
- **npm** ≥ 9.x
