# Fase 10 — QA, Pulido y Despliegue

**Prerequisito:** Fases 7–9 completadas (mobile + web funcionando con todos los módulos).
**Resultado:** Aplicación desplegada en producción. Backend en Railway/Render, web en Vercel, mobile en Expo EAS Build. QA de flujos críticos completado. Animaciones pulidas.
**Specs de referencia:** `00-vision.md`, `01-branding.md`, `02-tech-stack.md` (servicios cloud)

---

## BLOQUE A — QA: Flujos Críticos

### Paso 10.1 — QA del Sistema de Gamificación

Verificar la integridad del motor de XP de extremo a extremo:

**Prueba 1 — Flujo completo de XP:**
1. Registrar usuario nuevo → XP = 0, nivel = 1
2. Registrar actividad `sueno` 480 min → +20 XP base
3. Con racha día 1: `bonus_racha = 1.0 + 1×0.011 = 1.011` → XP real = `⌊20 × 1.011⌋ = 20`
4. Registrar actividad `meditacion` 20 min en horario óptimo → +10 XP base × 1.2 horario = 12 XP
5. Verificar que `xp_total = 32` en DB

**Prueba 2 — Racha y multiplicador:**
1. Simular 90 días de racha (seed manual en DB o script)
2. Verificar `bonus_racha = min(1.0 + 90×0.011, 2.0) = min(1.99, 2.0) = 1.99`
3. Simular día 91: `bonus_racha = min(1.0 + 91×0.011, 2.0) = min(2.001, 2.0) = 2.0`
4. Verificar cap correcto

**Prueba 3 — Level up:**
1. Seed usuario con XP = 26_999 (nivel 1)
2. Registrar actividad que otorgue ≥ 2 XP → XP llega a 27_001
3. Verificar: nivel actualizado a 2, WebSocket emite `xp:updated` con `nivel_nuevo: 2`, notificación enviada

**Prueba 4 — Límite diario:**
1. Registrar actividades rutinarias hasta sumar 150 XP
2. Registrar una actividad rutinaria más → xp_otorgado = 0, límite_excedido = true
3. Verificar que la actividad se guarda (registro histórico) pero XP = 0

---

### Paso 10.2 — QA de Cronos y Penalización

**Prueba — Penalización por impuntualidad:**
1. Crear evento `estudio` de 9:00 a 10:00 que otorgará 50 XP
2. Completar el evento a las 10:20 (20 min tarde)
3. Verificar: `xp_penalizacion_impuntualidad = true`, XP real = `50 - ⌊50 × 0.15⌋ = 50 - 7 = 43 XP`

**Prueba — Drag & Drop con opción Deslizar:**
1. Tener eventos a 9:00, 10:00 y 11:00
2. Arrastrar evento externo al slot de 9:00 → seleccionar "Deslizar hacia abajo"
3. Verificar: evento en 9:00 ahora en 10:00, evento original de 10:00 → 11:00, original de 11:00 → 12:00

**Prueba — API Key para agente:**
1. `POST /api/cronos/api-keys` → obtener key
2. `GET /api/external/cronos/availability` con header `Authorization: Bearer <key>` → responde
3. Verificar que sin la key devuelve 401

---

### Paso 10.3 — QA del Pipeline Dionisio

**Prueba con video de TikTok real:**
1. `POST /api/dionisio/process` con URL válida de TikTok (sobre un restaurante)
2. Verificar que los estados progresan: `pendiente → descargando → convirtiendo → transcribiendo → clasificando → completado`
3. Verificar que se crea un registro en `soberbio_lugares` con los datos extraídos
4. Verificar que la transcripción se guarda en `dionisio_videos.transcripcion`

**Prueba de fallback manual:**
1. Video sin audio o en idioma no soportado por Whisper → `pipeline_estado = 'descartado'`
2. El usuario puede reclasificar manualmente → `POST /api/dionisio/videos/:id/reclassify`

---

### Paso 10.4 — QA de Leonidas

**Prueba — Reglas musculares:**
1. Registrar sesión de `triceps`
2. Intentar registrar `espalda_alta` el mismo día → error de secuencia prohibida
3. Registrar sesión de `pecho` (permitido con triceps el mismo día)
4. Intentar registrar `pecho` sin 48h de descanso → error con tiempo restante

**Prueba — Auto-asignación:**
1. Simular 7 días con distintos grupos (escenario realista)
2. Verificar que el algoritmo no repite el mismo grupo consecutivamente
3. Verificar que el grupo más recuperado tiene mayor puntuación de conveniencia

---

### Paso 10.5 — QA de Demeter

**Prueba — Wizard de primer acceso:**
1. Nuevo usuario → `GET /api/demeter/status` → `{ configurado: false }`
2. Configurar presupuesto con gastos fijos y distribución
3. Verificar que los 5 fondos se inicializan con objetivo = 0 (hasta que el usuario los configure)

**Prueba — Fondo Soberbio:**
1. Configurar fondo Soberbio objetivo = 500,000
2. Registrar ingresos hasta superar 500,000 en el fondo
3. Verificar: notificación enviada + lugar aleatorio seleccionado + evento creado en Cronos

---

## BLOQUE B — Pulido de Animaciones

### Paso 10.6 — Dimension Split (Mobile)

Afinar la animación de 4.0s del spec 01 con timings exactos:

```typescript
// Verificar que los timings son:
// 0.0 – 0.4s: fadeIn del logo
// 0.4 – 1.2s: pulse (scale 1.0 → 1.03 → 1.0)
// 1.2 – 2.2s: split de pantalla (top sube, bottom baja)
// 2.2 – 3.2s: contenido emerge
// 3.2 – 4.0s: fade out de fragmentos
```

Ajustar `useNativeDriver: true` en todas las animaciones para 60fps.

---

### Paso 10.7 — Animaciones de Gamificación

- **XP Float:** verificar que aparece en todas las pantallas donde se puede ganar XP (no solo actividades)
- **Level Up Overlay:** efecto de partículas doradas. Duración 2.5s. Se reproduce con sonido si el usuario lo tiene habilitado.
- **Cofre Épico:** animación de apertura con destello gold y lluvia de partículas. Reproducir sonido de recompensa.
- **Logro Desbloqueado:** overlay con reveal del badge. 2.0s. Accesible desde cualquier pantalla.
- **Racha actualizada:** animación de llama que crece ligeramente al registrar la primera actividad del día.

---

## BLOQUE C — Despliegue

### Paso 10.8 — Despliegue Backend (Railway)

1. Crear proyecto en Railway (`railway.app`)
2. Conectar repositorio GitHub → seleccionar directorio `backend/`
3. Configurar variables de entorno (las del `.env.example`):
   - `DATABASE_URL`: de Neon PostgreSQL
   - `REDIS_URL`: de Upstash Redis
   - `JWT_SECRET` + `JWT_REFRESH_SECRET`: generar con `openssl rand -base64 32`
   - `PORT=3001`
   - `NODE_ENV=production`
4. Build command: `pnpm build`
5. Start command: `node dist/app.js`
6. Ejecutar migraciones en Railway: `railway run pnpm db:migrate`
7. Ejecutar seeds: `railway run pnpm db:seed`
8. Verificar: `GET https://neurax-api.railway.app/health` → `{ status: 'ok' }`

**Alternativa a Railway:** Render.com — mismo proceso, diferente dashboard. Railway tiene la ventaja del free tier de PostgreSQL + Redis.

---

### Paso 10.9 — Despliegue Web (Vercel)

1. Importar repositorio en Vercel → seleccionar directorio `web/`
2. Framework: Next.js (detectado automáticamente)
3. Variables de entorno en Vercel:
   - `NEXT_PUBLIC_API_URL=https://neurax-api.railway.app`
4. Deploy settings:
   - Build command: `pnpm build`
   - Output directory: `.next`
5. Deploy → obtener URL: `neurax-web.vercel.app`
6. Verificar: acceder → redirige a `/login` → login funciona

---

### Paso 10.10 — Build Mobile (Expo EAS Build)

1. Instalar EAS CLI: `npm install -g eas-cli`
2. Configurar `mobile/eas.json`:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```
3. Configurar variables de entorno en EAS:
   - `EXPO_PUBLIC_API_URL=https://neurax-api.railway.app`
4. Build para Android: `eas build --platform android --profile preview`
5. Descargar APK para pruebas en dispositivo real
6. Verificar: login, registro, dashboard, XP, Cronos, Dionisio

**Para producción (Google Play / App Store):**
- Build production: `eas build --platform all --profile production`
- Submit: `eas submit --platform android` (requiere cuenta en Google Play Console)

---

### Paso 10.11 — Configuración de Dominios y CORS

**Backend:** Actualizar CORS para aceptar las URLs de producción:
```typescript
await fastify.register(cors, {
  origin: [
    'https://neurax-web.vercel.app',
    'http://localhost:3000',  // desarrollo web
    'neurax://',              // deep links de la app
    /\.vercel\.app$/          // preview deployments
  ],
  credentials: true
})
```

**Cookies:** Asegurarse que las httpOnly cookies de auth usen `SameSite=None; Secure` en producción (para que Vercel y Railway en distintos dominios puedan compartir cookies).

---

## BLOQUE D — Monitoreo y Seguridad Final

### Paso 10.12 — Verificaciones de Seguridad

Checklist de seguridad antes de considerar la app lista:

- [ ] **Argon2id**: parámetros correctos (memory 64MB, iter 3, parallelism 4) — verificar con un hash de prueba
- [ ] **JWT**: duración access token = 15min, refresh = 30 días
- [ ] **Rate limiting**: `POST /api/auth/login` limitado a 5 intentos por IP por 15 min
- [ ] **Redis blacklist**: logout invalida el refresh token en Redis
- [ ] **Directorio ai-memory**: no accesible por HTTP (no hay ruta que lo sirva)
- [ ] **TikTok cookies**: archivo `.tiktok-cookies.txt` en `.gitignore` y NO commiteado
- [ ] **Headers de seguridad**: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` en las respuestas del backend
- [ ] **HTTPS**: todas las URLs de producción usan HTTPS (Railway y Vercel lo proveen por defecto)
- [ ] **Variables de entorno**: ningún secreto en el código fuente o en el repositorio

---

### Paso 10.13 — Monitoreo Básico

**Backend Railway:**
- Habilitar los logs de Railway (retención de 7 días en plan gratuito)
- Crear alerta: si la app cae más de 5 min → Railway puede configurar health check automático

**Neon PostgreSQL:**
- Activar backups automáticos en Neon (incluidos en el plan gratuito)

**Upstash Redis:**
- Verificar el dashboard de Upstash: comandos/seg, uso de memoria

**Para V2 (post-MVP):**
- Añadir Sentry para error tracking (SDK disponible para Fastify, Next.js y Expo)
- Añadir métricas con Prometheus/Grafana si el uso crece

---

## BLOQUE E — Documentación Final

### Paso 10.14 — README y Guías

**Archivo:** `README.md` (raíz del monorepo)

- Descripción del proyecto y stack
- Setup local (prerrequisitos: Node 20, pnpm, Docker, yt-dlp, ffmpeg, whisper, Claude CLI)
- Comandos de desarrollo
- Variables de entorno necesarias
- Cómo correr las migraciones y seeds
- Guía para configurar Claude CLI para el módulo de IA

---

## Checklist Final de Aceptación — Fase 10 (y del proyecto completo)

### Gamificación
- [ ] XP se calcula correctamente con racha y bonus horario en todos los flujos
- [ ] Level up emite WebSocket y notificación push
- [ ] Sistema de logros detecta y desbloquea correctamente los 15+ logros del spec
- [ ] Misiones se generan automáticamente a medianoche para todos los usuarios activos
- [ ] Cofre épico se abre al completar todas las misiones del día

### Cronos
- [ ] Drag & drop con 3 opciones funciona en mobile y web
- [ ] Penalización de -15% por impuntualidad se aplica correctamente
- [ ] API Key del agente funciona para leer/escribir eventos vía `/api/external/cronos`
- [ ] Integración con Leonidas (crea evento de entrenamiento si hay horario configurado)

### Leonidas
- [ ] Motor de auto-asignación respeta descansos mínimos y secuencias prohibidas
- [ ] Solo trote/barras los sábados
- [ ] El ejercicio añadido por Demeter (equipamiento deportivo) aparece en el catálogo

### Demeter
- [ ] Wizard de primer acceso y botón "Re-distribuir gastos"
- [ ] Los 5 fondos especiales con sus triggers correctos
- [ ] Alertas de presupuesto al 80% y al 100%

### Dionisio
- [ ] Pipeline completo: URL → audio → transcripción → clasificación → guardado → eliminado de guardados
- [ ] Estados del pipeline visibles en tiempo real via WebSocket
- [ ] Reclasificación manual disponible

### IA
- [ ] `invocarIA()` funciona con Claude CLI como subprocess
- [ ] Memoria del usuario se actualiza después de cada invocación
- [ ] Las 4 features de IA operativas: misiones, finanzas, clasificación Dionisio, insight semanal

### Secciones de Contenido
- [ ] Soberbio sin fotos ni referencia Dionisio
- [ ] Apolo con sistema de categorías (DIAMOND→BAD) y nivel cinéfilo
- [ ] Odysseia sin campo reseña
- [ ] Proeza con Exploración Musical aleatoria
- [ ] Kubera sin campo prioridad
- [ ] Proeza campos simplificados (nombre, estado, beatmaker, fecha, links)

### Despliegue
- [ ] Backend respondiendo en Railway con HTTPS
- [ ] Web desplegada en Vercel
- [ ] APK de Android construido y probado en dispositivo real
- [ ] CI/CD pasa en todas las ramas
- [ ] Ningún secreto expuesto en el repositorio
