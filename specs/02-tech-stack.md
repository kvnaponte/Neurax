# NEURAX — Stack Tecnológico y Arquitectura

## Stack Principal

### Mobile (Prioritario)
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | **React Native** | 0.74+ |
| Navegación | **React Navigation** v6 | Stack + Tab navigators |
| Estado global | **Zustand** | Ligero, sin boilerplate |
| Persistencia local | **MMKV** | Cache rápido, sync offline |
| Animaciones | **React Native Reanimated** v3 | Animaciones fluidas 60fps |
| Gestos | **React Native Gesture Handler** | Drag & drop en Cronnos |
| UI Components | **Custom components** sobre RN base | Tema RPG propio |
| Iconos | **Lucide React Native** | Consistencia con web |
| Peticiones HTTP | **TanStack Query** (React Query) | Cache, sync, retry automático |
| Formularios | **React Hook Form** + **Zod** | Validación tipada |
| Notificaciones | **Expo Notifications** | Push notifications |
| Compilación | **Expo** (managed workflow) | Simplifica build pipeline |

### Web
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | **Next.js** | 14+ (App Router) |
| Estilos | **Tailwind CSS** + CSS Variables | Tokens del design system |
| Estado | **Zustand** | Compartido con mobile via API |
| Peticiones | **TanStack Query** | Mismo patrón que mobile |
| Animaciones | **Framer Motion** | Transiciones entre secciones |
| Drag & Drop | **dnd-kit** | Cronnos web |
| Iconos | **Lucide React** | |
| Formularios | **React Hook Form** + **Zod** | |
| Tipografía RPG | **Cinzel** (Google Fonts) | Display, Cinzel Decorative |

### Backend
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | **Node.js** | 20 LTS |
| Framework | **Fastify** | 4+ (rendimiento > Express) |
| ORM | **Drizzle ORM** | TypeScript-first, SQL directo |
| Base de datos | **PostgreSQL** | 16 |
| Auth | **JWT** (access + refresh tokens) | jose library |
| Hashing passwords | **Argon2** | |
| Validación | **Zod** | Compartido con frontend |
| WebSockets | **Socket.IO** | Sync tiempo real web↔mobile |
| Cola de tareas | **BullMQ** + **Redis** | Jobs async (notificaciones, cálculos) |
| Cache | **Redis** | Sesiones, datos frecuentes |
| File storage | **Cloudinary** | Imágenes de películas, libros, etc. |

### Infraestructura y DevOps
| Servicio | Tecnología |
|---------|-----------|
| Containerización | **Docker** + **Docker Compose** |
| CI/CD | **GitHub Actions** |
| Hosting backend | **Railway** o **Render** (tier gratuito viable) |
| Hosting web | **Vercel** (Next.js nativo) |
| Base de datos hosted | **Neon** (PostgreSQL serverless, free tier generoso) |
| Redis hosted | **Upstash** (serverless Redis, free tier) |
| Monitoreo | **Sentry** (errores) |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE MOBILE                        │
│              React Native + Expo                         │
│         Zustand │ TanStack Query │ MMKV                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS + WSS
┌─────────────────────▼───────────────────────────────────┐
│                    CLIENTE WEB                           │
│              Next.js 14 (App Router)                     │
│         Zustand │ TanStack Query │ Framer Motion          │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS + WSS
┌─────────────────────▼───────────────────────────────────┐
│                  API REST + WebSocket                     │
│               Fastify + Socket.IO                        │
│         JWT Auth │ Zod Validation │ Drizzle ORM          │
│                  BullMQ (jobs async)                     │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │ PostgreSQL  │        │    Redis    │
    │  (Neon)     │        │  (Upstash)  │
    └─────────────┘        └─────────────┘
```

---

## Patrones de Arquitectura

### Patrón de Módulos (Backend)
Cada sección del sistema es un módulo independiente:
```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts
│   │   └── auth.repository.ts
│   ├── gamification/
│   ├── activities/
│   ├── cronos/
│   ├── odin/
│   ├── leonidas/
│   └── ... (un módulo por sección)
├── shared/
│   ├── middleware/
│   ├── plugins/
│   └── utils/
└── app.ts
```

### Repository Pattern
- Toda interacción con la base de datos pasa por un repository
- Los services nunca tocan SQL directamente
- Permite testear sin base de datos real

### Validación en Capas
```
Request → Zod Schema → Service → Repository → DB
         (validación)  (lógica)  (queries)
```

---

## Base de Datos — Esquema General

### Estrategia
- **Una base de datos PostgreSQL** con un schema por dominio
- Tablas compartidas: `usuarios`, `xp_events`, `achievements`, `notifications`
- Tablas por sección: prefijadas con el nombre de la sección (`leonidas_sesiones`, `apolo_peliculas`, etc.)
- **JSONB** para campos dinámicos que varían por tipo (criterios de calificación, metadatos de actividades)

### Convenciones
- PKs: `UUID v7` (ordenable por tiempo, mejor que UUID v4)
- Timestamps: `timestamptz` siempre con zona horaria UTC
- Soft delete: columna `deleted_at TIMESTAMPTZ` (no se borra nada físicamente)
- Auditoría: `created_at`, `updated_at` en todas las tablas

---

## Autenticación y Seguridad

### Flujo de Tokens
- **Access Token**: JWT firmado, expira en 15 minutos
- **Refresh Token**: JWT rotativo, expira en 30 días, almacenado en httpOnly cookie (web) o SecureStore (mobile)
- **Rotación**: Cada refresh invalida el token anterior
- **Revocación**: Lista negra en Redis con TTL

### Almacenamiento Seguro
- Contraseñas: Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
- Preguntas/respuestas secretas: hashed con Argon2id (no reversibles)
- Tokens en mobile: `expo-secure-store`
- Tokens en web: httpOnly cookie (access) + localStorage NO se usa para tokens

---

## Sincronización Web ↔ Mobile

### WebSocket Events
```
client:activity_created    → server broadcast → client:state_updated
client:xp_changed          → server broadcast → client:xp_updated
client:achievement_unlocked → server broadcast → client:achievement_popup
client:section_updated     → server broadcast → client:section_refresh
```

### Estrategia Offline (Mobile)
1. Acciones se guardan en cola local (MMKV)
2. Al recuperar conexión: sync automático con el servidor
3. Conflictos resueltos por `updated_at` más reciente (last-write-wins)
4. Actividades registradas offline se sincronizan manteniendo el timestamp original

---

## Integración con IA — Estrategia CLI

### Decisión Arquitectónica
**No se usará la API de pago de Claude** (ni Anthropic API ni ninguna otra de costo por token). En su lugar, el sistema automatiza la interacción con herramientas de IA a través de la CLI.

### Enfoque: Automatización via Claude Code CLI

El backend implementa un módulo de IA que:
1. **Genera un archivo de prompt** estructurado con los datos del usuario (contexto comprimido)
2. **Invoca Claude Code CLI** (`claude`) como subproceso del backend, pasándole el prompt
3. **Lee la respuesta** del output y la parsea en el formato esperado (JSON estructurado)
4. **Mantiene archivos de memoria** en disco que acumulan contexto del usuario sesión a sesión
5. Claude Code lee estos archivos de memoria en cada invocación, generando continuidad de aprendizaje

```
Backend Job → genera prompt.md + contexto.md
           → exec: claude --prompt prompt.md --memory-dir ./memoria/usuario_id/
           → parsea stdout como JSON
           → respuesta → feature (logros, misiones, clasificación, etc.)
```

### Memoria Persistente
- Directorio por usuario: `./ai-memory/{usuario_id}/`
- Archivos: `perfil.md`, `habitos.md`, `patrones.md`, `historial_resumen.md`
- El sistema actualiza estos archivos automáticamente tras cada sesión relevante
- Claude Code los consume como contexto en la siguiente invocación

### Hoja de Ruta de Migración
| Fase | Herramienta | Condición |
|------|-------------|-----------|
| V1 | Claude Code CLI (actual) | Disponible desde el inicio, sin costo API |
| V2 | Qwen modelo local | Cuando esté disponible la infraestructura local |
| V2 alt. | OpenCode | Evaluar como alternativa a Qwen según madurez |

---

## Integración Dionisio (Videos)

### Pipeline Automático (Principal)
El flujo principal de Dionisio es un pipeline automatizado:
1. Detecta videos guardados en TikTok
2. Los descarga automáticamente
3. Convierte video → audio → texto (transcripción)
4. Clasifica por contenido y envía a la sección correspondiente
5. Elimina el video de guardados de TikTok una vez procesado
6. Videos sin texto → descartados automáticamente

**Componentes del backend del pipeline:**
- Módulo de descarga: downloader de TikTok (evaluar yt-dlp u herramienta equivalente)
- Módulo de conversión: ffmpeg para video → audio
- Módulo de transcripción: Whisper local o equivalente
- Módulo de clasificación: CLI de IA (ver sección anterior)

### Fallback Manual
- El usuario pega la URL del video
- El sistema extrae metadata via Open Graph (título, thumbnail)
- El usuario clasifica manualmente el destino

### Hoja de Ruta de Redes
| Fase | Plataforma |
|------|-----------|
| V1 | TikTok (pipeline principal) |
| V2 | Facebook e Instagram (si no es posible en V1, implementar en V2)

---

## Notificaciones Push

### Stack
- Mobile: **Expo Push Notifications** + Firebase FCM
- Web: **Web Push API** (browser notifications)
- Backend: BullMQ job que envía al servicio de Expo

### Tipos de Notificaciones
| Tipo | Trigger | Prioridad |
|------|---------|-----------|
| Recordatorio diario | Hora configurable por usuario | Normal |
| Racha en riesgo | 20:00 si no hay actividad del día | Alta |
| Logro desbloqueado | Inmediato al desbloquear | Alta |
| Misión Odin disponible | 06:00 todos los días | Normal |
| Meta Demeter alcanzada | Al superar presupuesto objetivo | Normal |
| Meta Kubera alcanzada | Al alcanzar saldo objetivo | Normal |

---

## Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Redis
REDIS_URL=redis://...

# Cloudinary
CLOUDINARY_URL=...

# Expo
EXPO_ACCESS_TOKEN=...

# Social APIs (optional, V2)
META_APP_ID=...
META_APP_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
```
