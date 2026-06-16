# NEURAX — Plan Maestro de Desarrollo

> Plan de construcción completo desde cero hasta aplicación funcional.
> Cada fase es un bloque ejecutable con prerequisitos, pasos específicos y criterio de aceptación.

---

## Cómo Leer Este Plan

- **Las fases son secuenciales**: no iniciar una fase hasta que la anterior esté completada y aceptada.
- **Dentro de cada fase, los pasos también son secuenciales** salvo que se indique lo contrario.
- **Cada paso nombra el archivo o módulo exacto** a crear/modificar.
- **Spec de referencia**: cada paso indica qué spec(s) lo rigen.
- Los pasos de backend deben completarse **antes** de que las pantallas mobile/web que los consumen existan.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Mobile | React Native + Expo (managed workflow) |
| Web | Next.js 14 (App Router) |
| Backend | Fastify 4 + Node.js 20 LTS |
| ORM | Drizzle ORM (TypeScript) |
| Base de datos | PostgreSQL 16 (Neon en producción) |
| Cache / Colas | Redis (Upstash) + BullMQ |
| Auth | JWT (access 15min + refresh 30 días) + Argon2id |
| Tiempo real | Socket.IO |
| Animaciones Mobile | React Native Reanimated v3 |
| Animaciones Web | Framer Motion |
| Estado global | Zustand |
| Data fetching | TanStack Query v5 |
| Iconos | Lucide (React Native + React) |
| Storage imágenes | Cloudinary |
| IA | Claude Code CLI (subproceso, sin API de pago) |
| Video pipeline | yt-dlp + ffmpeg + Whisper |
| CI/CD | GitHub Actions |
| Hosting backend | Railway o Render |
| Hosting web | Vercel |

---

## Índice de Fases

| # | Archivo | Contenido | Specs cubiertos |
|---|---------|-----------|-----------------|
| 0 | [fase-00-infraestructura.md](timeline/fase-00-infraestructura.md) | Repo, Docker, CI/CD, BD, migraciones | 02, 15 |
| 1 | [fase-01-auth-gamificacion.md](timeline/fase-01-auth-gamificacion.md) | Auth completo + motor de gamificación | 03, 04 |
| 2 | [fase-02-actividades-cronos.md](timeline/fase-02-actividades-cronos.md) | Sistema de actividades + Cronos | 05, 08 |
| 3 | [fase-03-odin-leonidas.md](timeline/fase-03-odin-leonidas.md) | Misiones Odin + motor Leonidas | 06, 07, 09, 10 |
| 4 | [fase-04-demeter-secciones.md](timeline/fase-04-demeter-secciones.md) | Demeter + 8 secciones de contenido | 11, 12, 13 |
| 5 | [fase-05-dionisio-ia.md](timeline/fase-05-dionisio-ia.md) | Pipeline Dionisio + módulo IA CLI | 13 (Dionisio), 14 |
| 6 | [fase-06-sistema-integraciones.md](timeline/fase-06-sistema-integraciones.md) | Notificaciones, WebSocket, integraciones cross-section | 14, 15, 16 |
| 7 | [fase-07-mobile-core.md](timeline/fase-07-mobile-core.md) | Mobile setup, design system, auth screens, dashboard | 01, 03, 06, 07 |
| 8 | [fase-08-mobile-secciones.md](timeline/fase-08-mobile-secciones.md) | Todas las pantallas mobile | 04–14 |
| 9 | [fase-09-web.md](timeline/fase-09-web.md) | Web app completa (Next.js) | 01–16 |
| 10 | [fase-10-qa-deploy.md](timeline/fase-10-qa-deploy.md) | QA, animaciones, polish, despliegue | Todos |

---

## Mapa de Dependencias Entre Fases

```
Fase 0 (Infra + BD)
    │
    ├──► Fase 1 (Auth + Gamificación)
    │         │
    │         ├──► Fase 2 (Actividades + Cronos)
    │         │         │
    │         │         ├──► Fase 3 (Odin + Leonidas)
    │         │         │         │
    │         │         │         ├──► Fase 4 (Demeter + Secciones)
    │         │         │         │         │
    │         │         │         │         ├──► Fase 5 (Dionisio + IA)
    │         │         │         │         │
    │         │         │         │         └──► Fase 6 (Sistema + Integraciones)
    │         │         │         │                   │
    │         │         │         │    ┌──────────────┘
    │         │         │         │    │
    │         │         │         ▼    ▼
    │         │         │    Fase 7 (Mobile Core)
    │         │         │         │
    │         │         │         └──► Fase 8 (Mobile Secciones)
    │         │         │                   │
    │         │         └──────────────────►│
    │         │                             └──► Fase 9 (Web)
    │         │                                       │
    └─────────┴─────────────────────────────────────►└──► Fase 10 (QA + Deploy)
```

---

## Convenciones de Nomenclatura de Archivos

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts        ← validación Zod
│   │   │   └── auth.repository.ts
│   │   ├── gamification/
│   │   ├── actividades/
│   │   ├── cronos/
│   │   └── [sección]/
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── plugins/
│   │   │   ├── db.plugin.ts
│   │   │   ├── redis.plugin.ts
│   │   │   └── socket.plugin.ts
│   │   └── utils/
│   │       ├── xp.utils.ts
│   │       └── date.utils.ts
│   ├── jobs/                         ← BullMQ workers
│   ├── db/
│   │   ├── schema/                   ← Drizzle schemas
│   │   └── migrations/
│   └── app.ts
│
mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── stores/                       ← Zustand stores
│   ├── hooks/
│   ├── api/                          ← TanStack Query + axios
│   └── theme/                        ← design system tokens
│
web/
├── src/
│   ├── app/                          ← Next.js App Router
│   ├── components/
│   ├── stores/
│   ├── hooks/
│   └── styles/
```

---

## Criterio de Completitud Global

La aplicación se considera **funcional y completa** cuando:

- [ ] Un usuario puede registrarse, loguearse y pasar la pregunta secreta con animación Dimension Split
- [ ] El sistema calcula XP, rachas y niveles correctamente con los nuevos umbrales
- [ ] Cronos asigna espacio a las 11 secciones integradas y castiga impuntualidad
- [ ] Odin genera misiones diarias y el cofre épico se desbloquea correctamente
- [ ] Leonidas auto-asigna el músculo del día respetando todas las reglas
- [ ] Demeter ejecuta el wizard de primera vez y gestiona los 5 fondos especiales
- [ ] Las 8 secciones de contenido (Apolo, Alejandría, Michelin, Odysseia, Nemesis, Proeza, Kubera, Prodigy) permiten registro completo
- [ ] Apolo muestra estética de cine, calcula Category y niveles cinéfilos
- [ ] El pipeline de Dionisio descarga, transcribe y clasifica videos de TikTok
- [ ] El módulo IA sugiere logros y misiones via CLI sin costo de API
- [ ] Todas las integraciones cross-section disparan correctamente
- [ ] Las notificaciones push llegan a mobile y web
- [ ] El web app replica todas las funcionalidades con layout adaptado
- [ ] La app mobile funciona offline y sincroniza al reconectar
