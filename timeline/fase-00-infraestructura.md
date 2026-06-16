# Fase 0 — Infraestructura y Fundamentos del Proyecto

**Prerequisito:** Ninguno. Es el punto de partida absoluto.
**Resultado de esta fase:** Repositorio configurado, base de datos corriendo con todas las tablas creadas, CI/CD funcional, entornos de desarrollo y producción listos.
**Specs de referencia:** `02-tech-stack.md`, `15-data-model.md`

---

## Paso 0.1 — Crear el Repositorio y Estructura Monorepo

**Archivos:** `/`, `package.json`, `.gitignore`, `README.md`

1. Crear repositorio en GitHub: `neurax`
2. Inicializar monorepo con `pnpm workspaces`:
   ```
   /
   ├── backend/          ← Fastify API
   ├── mobile/           ← React Native + Expo
   ├── web/              ← Next.js 14
   ├── shared/           ← Tipos TypeScript compartidos (Zod schemas)
   ├── docker-compose.yml
   ├── .github/workflows/
   ├── package.json      ← workspace root
   └── .gitignore
   ```
3. Configurar `.gitignore` global: `node_modules/`, `.env*`, `dist/`, `.expo/`, `.next/`, `*.local`
4. Configurar `pnpm-workspace.yaml` apuntando a `["backend", "mobile", "web", "shared"]`
5. Crear `shared/package.json` con nombre `@neurax/shared` — aquí irán los tipos y schemas Zod compartidos entre backend y frontends

**Criterio:** `pnpm install` en raíz instala dependencias de todos los workspaces sin errores.

---

## Paso 0.2 — Docker Compose (Desarrollo Local)

**Archivo:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: neurax_dev
      POSTGRES_USER: neurax
      POSTGRES_PASSWORD: neurax_dev_pass
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes
    volumes: ["redis_data:/data"]

volumes:
  postgres_data:
  redis_data:
```

Ejecutar `docker compose up -d` y verificar que ambos servicios responden.

**Criterio:** `psql -h localhost -U neurax -d neurax_dev` conecta sin error. `redis-cli ping` responde `PONG`.

---

## Paso 0.3 — Inicializar Proyecto Backend (Fastify)

**Directorio:** `backend/`

1. `cd backend && pnpm init`
2. Instalar dependencias:
   ```
   pnpm add fastify @fastify/jwt @fastify/cookie @fastify/cors @fastify/rate-limit
   pnpm add drizzle-orm drizzle-kit postgres
   pnpm add argon2 zod bullmq ioredis socket.io
   pnpm add @fastify/websocket cloudinary
   pnpm add -D typescript @types/node tsx nodemon drizzle-kit
   ```
3. Crear `backend/tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "CommonJS",
       "strict": true,
       "outDir": "dist",
       "rootDir": "src",
       "paths": { "@neurax/shared": ["../shared/src"] }
     }
   }
   ```
4. Crear estructura de carpetas:
   ```
   backend/src/
   ├── app.ts
   ├── db/
   │   ├── index.ts          ← conexión Drizzle
   │   ├── schema/           ← un archivo .ts por dominio
   │   └── migrations/
   ├── modules/
   ├── shared/
   │   ├── middleware/
   │   ├── plugins/
   │   └── utils/
   └── jobs/
   ```
5. Crear `backend/src/app.ts` con Fastify básico: instanciar app, registrar plugins CORS y rate-limit, `app.listen({ port: 3001 })`
6. Script `backend/package.json`:
   ```json
   "scripts": {
     "dev": "tsx watch src/app.ts",
     "build": "tsc",
     "start": "node dist/app.js",
     "db:generate": "drizzle-kit generate",
     "db:migrate": "drizzle-kit migrate",
     "db:studio": "drizzle-kit studio"
   }
   ```

**Criterio:** `pnpm dev` levanta el servidor y `GET http://localhost:3001/health` responde `{ "status": "ok" }`.

---

## Paso 0.4 — Configurar Drizzle ORM y Conexión a PostgreSQL

**Archivos:** `backend/src/db/index.ts`, `backend/drizzle.config.ts`, `backend/.env`

1. Crear `backend/.env`:
   ```env
   DATABASE_URL=postgresql://neurax:neurax_dev_pass@localhost:5432/neurax_dev
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=dev_jwt_secret_change_in_prod
   JWT_REFRESH_SECRET=dev_refresh_secret_change_in_prod
   CLOUDINARY_URL=cloudinary://...
   PORT=3001
   NODE_ENV=development
   ```
2. Crear `backend/src/db/index.ts`:
   ```typescript
   import { drizzle } from 'drizzle-orm/postgres-js'
   import postgres from 'postgres'
   import * as schema from './schema'

   const client = postgres(process.env.DATABASE_URL!)
   export const db = drizzle(client, { schema })
   ```
3. Crear `backend/drizzle.config.ts`:
   ```typescript
   export default {
     schema: './src/db/schema',
     out: './src/db/migrations',
     dialect: 'postgresql',
     dbCredentials: { url: process.env.DATABASE_URL! }
   }
   ```
4. Registrar la conexión como plugin de Fastify en `backend/src/shared/plugins/db.plugin.ts` — decorar `fastify.db` para acceso global

**Criterio:** `pnpm db:studio` abre Drizzle Studio y muestra la conexión activa.

---

## Paso 0.5 — Schemas de Base de Datos (Drizzle)

**Archivos:** `backend/src/db/schema/` — un archivo por dominio

Crear los schemas Drizzle en el siguiente orden (respetando dependencias de FK):

### 0.5.1 — `schema/core.ts` — Usuarios y tokens
Definir tablas: `usuarios`, `refresh_tokens`
- `usuarios`: id UUID (default gen_random_uuid), nombre, email (unique), hashed_password, secret_answer_hash, secret_activated, recovery_answer_1_hash, recovery_answer_2_hash, xp_total (integer default 0), nivel (integer default 1), active (boolean default true), created_at, updated_at, last_login_at, deleted_at
- `refresh_tokens`: id, usuario_id (FK), token_hash, device_info (jsonb), expires_at, created_at, revoked_at

### 0.5.2 — `schema/gamification.ts` — XP, logros, rachas
Tablas: `xp_events`, `usuario_achievements`, `rachas`
- `xp_events`: id, usuario_id (FK), fuente (varchar), fuente_id (uuid), xp_amount, xp_base, bonus_racha (decimal 3,2), bonus_horario (decimal 3,2), created_at
- `usuario_achievements`: id, usuario_id (FK), achievement_id (varchar), tipo (sistema/manual/ia), progreso, total, desbloqueado (bool), desbloqueado_at, xp_otorgado, nombre, descripcion, icono, created_at
- `rachas`: id, usuario_id (FK), fecha (date), tiene_actividad (bool), UNIQUE(usuario_id, fecha)

### 0.5.3 — `schema/notifications.ts` — Notificaciones
Tablas: `notificaciones`, `notificaciones_config`, `ia_config`
- Según specs 14 (exactamente los campos definidos, incluyendo la versión simplificada de `ia_config` sin API key)

### 0.5.4 — `schema/actividades.ts`
Tabla: `actividades` con todos los campos del spec 05 + metadata JSONB

### 0.5.5 — `schema/cronos.ts`
Tablas: `cronos_eventos`, `cronos_api_keys`
- `xp_penalizacion_impuntualidad` (boolean) en lugar de `xp_bonus_puntualidad`

### 0.5.6 — `schema/odin.ts`
Tablas: `odin_misiones_catalogo`, `odin_misiones_usuario`, `odin_cofres`

### 0.5.7 — `schema/leonidas.ts`
Tablas: `leonidas_sesiones`, `leonidas_ejercicios_sesion`, `leonidas_plan_semanal`
+ View `leonidas_disponibilidad_muscular` (usar Drizzle `sql` template)

### 0.5.8 — `schema/demeter.ts`
Tablas: `demeter_movimientos`, `demeter_presupuestos`
- En `fondos_especiales` JSONB soportar los 5 fondos: soberbio, michelin, odysseia, nemesis, kubera

### 0.5.9 — `schema/soberbio.ts` y `schema/dionisio.ts`
- `soberbio_lugares`: sin `fotos_urls` ni `dionisio_video_id`
- `dionisio_videos`: incluir `transcripcion`, `pipeline_estado`, `pipeline_error`

### 0.5.10 — `schema/apolo.ts`
Tabla: `apolo_peliculas` con campos: year, movie, director, country, producer, distributed, genre, estado, fecha_visualizacion, rating (decimal 3,1), stars (decimal 3,1), category (varchar 20)

### 0.5.11 — `schema/contenido.ts` — Resto de secciones
Tablas: `alejandria_libros`, `michelin_recetas`, `odysseia_destinos` (sin resena), `nemesis_juegos`

### 0.5.12 — `schema/proeza.ts`
Tablas: `proeza_canciones` (campos simplificados: nombre, estado, beatmaker, fecha_inicio, links), `proeza_exploracion_musical`

### 0.5.13 — `schema/prodigy.ts`
Tablas: `prodigy_cursos`, `prodigy_entregas`

### 0.5.14 — `schema/kubera.ts`
Tabla: `kubera_productos` sin campo `prioridad`

**Criterio:** `pnpm db:generate` genera archivos de migración sin errores para todos los schemas.

---

## Paso 0.6 — Ejecutar Migraciones

**Comando:** `pnpm db:migrate`

Verificar que las migraciones se ejecutan en el orden correcto (según spec 15):
1. core (usuarios, refresh_tokens)
2. actividades
3. gamification (xp_events, achievements, rachas)
4. notifications (notificaciones, notificaciones_config, ia_config)
5. cronos
6. odin (schema + seed)
7. leonidas
8. demeter
9. soberbio, dionisio
10. apolo, alejandria, michelin, odysseia
11. nemesis, proeza, prodigy, kubera

**Criterio:** Todas las tablas existen en PostgreSQL. `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` lista las 30+ tablas esperadas.

---

## Paso 0.7 — Seed de Datos Iniciales

**Archivo:** `backend/src/db/seeds/`

### 0.7.1 — `seeds/odin-catalogo.ts`
Insertar las ~25 misiones del catálogo de Odin (principales, secundarias, super semanales, super mensuales) según la tabla completa del spec 09. Cada misión con su `id`, `nombre`, `descripcion`, `tipo`, `objetivo_tipo`, `objetivo_valor`, `objetivo_filtro` (JSON), `xp_reward`.

### 0.7.2 — `seeds/leonidas-catalogo.ts`
Insertar el catálogo completo de ejercicios predefinidos del spec 10 en una tabla de referencia `leonidas_ejercicios_catalogo` (a agregar al schema):
- id, nombre, grupo_muscular, descripcion
- Ejercicios de Pecho, Espalda, Hombros, Bíceps, Tríceps, Cuádriceps, Femorales/Glúteos, Core, Cardio, Barras/Calistenia

### 0.7.3 — `seeds/run.ts`
Script que ejecuta ambos seeds con manejo de errores y evita duplicados (`ON CONFLICT DO NOTHING`)

**Script en package.json:** `"db:seed": "tsx src/db/seeds/run.ts"`

**Criterio:** `pnpm db:seed` inserta todos los registros. `SELECT COUNT(*) FROM odin_misiones_catalogo` devuelve ≥ 25.

---

## Paso 0.8 — Configurar Redis y BullMQ

**Archivo:** `backend/src/shared/plugins/redis.plugin.ts`

1. Instanciar conexión Redis (`ioredis`) con `process.env.REDIS_URL`
2. Decorar `fastify.redis` para acceso global
3. Crear `backend/src/jobs/queues.ts` — definir todas las colas BullMQ:
   - `queue:notifications` — envío de notificaciones push
   - `queue:odin-daily` — generación de misiones diarias (cron 00:00)
   - `queue:streak-check` — verificación de rachas (cron 23:59)
   - `queue:ai-task` — tareas de IA (sugerencias, clasificación)
   - `queue:dionisio-pipeline` — procesamiento de videos
4. Crear `backend/src/jobs/workers.ts` — registrar workers (vacíos por ahora, se implementan en fases posteriores)

**Criterio:** La app inicia sin error y los workers se conectan a Redis.

---

## Paso 0.9 — Variables de Entorno de Producción

**Servicios externos a configurar:**

1. **Neon PostgreSQL**: crear proyecto en neon.tech, obtener `DATABASE_URL` de producción
2. **Upstash Redis**: crear base en upstash.com, obtener `REDIS_URL` de producción
3. **Cloudinary**: crear cuenta, obtener `CLOUDINARY_URL`
4. Crear `backend/.env.production` (NO commitear — solo documentar qué variables existen en `backend/.env.example`)

**Archivo:** `backend/.env.example`
```env
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://user:pass@host:port
JWT_SECRET=min_32_chars_random
JWT_REFRESH_SECRET=min_32_chars_random
CLOUDINARY_URL=cloudinary://key:secret@cloud
PORT=3001
NODE_ENV=production
```

---

## Paso 0.10 — CI/CD con GitHub Actions

**Archivo:** `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: pnpm --filter backend build
      - run: pnpm --filter backend test (cuando existan tests)

  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm --filter mobile typecheck

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm --filter web build
```

**Criterio:** Push a `develop` pasa el pipeline de CI sin errores. La estructura de carpetas es válida para TypeScript.

---

## Checklist de Aceptación — Fase 0

- [ ] Repositorio inicializado con estructura monorepo correcta
- [ ] `docker compose up -d` levanta PostgreSQL y Redis localmente
- [ ] Backend Fastify responde en `localhost:3001/health`
- [ ] Drizzle conecta a PostgreSQL y genera migraciones
- [ ] Las 30+ tablas existen en la base de datos
- [ ] Los seeds de Odin y Leonidas están insertados
- [ ] Redis y BullMQ se conectan sin errores
- [ ] Variables de entorno de producción configuradas en los servicios externos
- [ ] CI/CD pasa en GitHub Actions
