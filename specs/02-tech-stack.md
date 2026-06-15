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

## Integración con Claude AI

### Restricción Presupuestaria
El sistema usa **Claude API** en nivel mínimo de costo. Está diseñado para consumir la menor cantidad posible de tokens.

### Uso Permitido
| Feature | Enfoque | Estimado tokens/uso |
|---------|---------|---------------------|
| Sugerencia de logros personalizados | 1 llamada, prompt compacto | ~500 tokens |
| Descripción narrativa de progreso semanal | 1 llamada, datos comprimidos | ~800 tokens |
| Creación de misiones personalizadas en Odin | 1 llamada opcional | ~400 tokens |

### Alternativa Manual
Si el usuario no quiere gasto de API:
- Botón "Copiar resumen para Claude" en estadísticas
- Genera un texto estructurado que el usuario puede pegar en claude.ai (Plan Pro propio)
- Las respuestas de Claude se pueden importar manualmente

### Prompt Design
- Todos los prompts son ultra-compactos (sin explicaciones innecesarias)
- Los datos del usuario se comprimen (no se envían historial completo, solo resúmenes)
- El modelo a usar: `claude-haiku-4-5` (más económico, suficiente para las tareas)

---

## Integración Dionisio (Videos)

### Estrategia Híbrida
1. **API Oficial (cuando disponible)**:
   - Facebook/Meta: Graph API (requiere token de usuario OAuth)
   - TikTok: TikTok for Developers API (acceso limitado, requiere revisión)
   - Instagram: Basic Display API (deprecada, usar Graph API de Meta)
   - Implementación: el usuario autoriza con OAuth una sola vez

2. **Fallback Manual**:
   - El usuario pega la URL del video
   - El sistema extrae metadata (título, thumbnail) vía Open Graph tags
   - Clasificación automática por IA del contenido del título/descripción

3. **Prioridad de implementación**: Fallback manual primero (V1), APIs sociales en V2

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

# Claude API
ANTHROPIC_API_KEY=...

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
