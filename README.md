# Prueba Técnica Finmarkets

API REST para gestión de tareas desarrollada con **NestJS**, **Prisma v7** y **PostgreSQL**.

## Descripción

API modular que permite crear, listar, obtener, actualizar, cambiar estado y eliminar tareas. Incluye validación de datos con `class-validator`, documentación interactiva con Swagger y manejo global de errores.

## Tecnologías

- **NestJS** v11 — Framework backend
- **Prisma** v7 — ORM con driver adapter (`@prisma/adapter-pg`)
- **PostgreSQL** 16 — Base de datos (Docker)
- **Swagger** — Documentación de la API
- **Jest** — Testing unitario
- **TypeScript** v5 — ESM (`"type": "module"`)

## Estructura del Proyecto

```
src/
├── config/                          # Configuración de la app (puerto, entorno)
├── common/
│   ├── filters/                     # Filtro global de excepciones
│   ├── interceptors/                # Logging y response wrapper
│   └── pipes/
├── modules/
│   ├── prisma/                      # Módulo global de Prisma (servicio + módulo)
│   └── tasks/                       # Módulo de tareas (CRUD completo)
│       ├── dto/                     # DTOs con validación
│       ├── tasks.controller.ts
│       ├── tasks.service.ts
│       └── tasks.module.ts
├── app.module.ts
└── main.ts
```

## Endpoints

| Método   | Ruta                       | Descripción                               |
| -------- | -------------------------- | ----------------------------------------- |
| `POST`   | `/api/v1/tasks`            | Crear una nueva tarea                     |
| `GET`    | `/api/v1/tasks`            | Listar tareas (filtros: status, priority) |
| `GET`    | `/api/v1/tasks/:id`        | Obtener una tarea por ID                  |
| `PATCH`  | `/api/v1/tasks/:id`        | Actualizar una tarea                      |
| `PATCH`  | `/api/v1/tasks/:id/status` | Cambiar el estado de una tarea            |
| `DELETE` | `/api/v1/tasks/:id`        | Eliminar una tarea                        |

## Requisitos Previos

- **Node.js** >= 22
- **npm** >= 10
- **Docker** y **Docker Compose**

## Instalación y Levantamiento

### 1. Clonar el repositorio

```bash
git clone https://github.com/Hesllar/prueba-tecnica-finmarkets.git
cd prueba-tecnica-finmarkets
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=finmarkets_db
DB_PORT=5432

# Database (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finmarkets_db?schema=public"
```

> **Nota:** Los valores de `DATABASE_URL` deben coincidir con `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_PORT`.

### 4. Levantar la base de datos con Docker

```bash
docker compose up -d
```

Esto levanta un contenedor PostgreSQL 16 en el puerto configurado en `DB_PORT`.

### 5. Generar el cliente de Prisma y ejecutar migraciones

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Levantar la aplicación

**Modo desarrollo (con hot-reload):**

```bash
npm run start:dev
```

**Modo producción:**

```bash
npm run build
npm run start:prod
```

La API estará disponible en `http://localhost:3000/api/v1`.

## Documentación Swagger

Una vez levantada la app, acceder a la documentación interactiva en:

```
http://localhost:3000/api/docs
```

## Tests

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:cov
```

## Scripts Disponibles

| Script               | Descripción                    |
| -------------------- | ------------------------------ |
| `npm run start:dev`  | Levantar en modo desarrollo    |
| `npm run build`      | Compilar el proyecto           |
| `npm run start:prod` | Levantar en modo producción    |
| `npm test`           | Ejecutar tests                 |
| `npm run test:cov`   | Tests con reporte de cobertura |
| `npm run lint`       | Ejecutar linter                |
| `npm run format`     | Formatear código con Prettier  |
