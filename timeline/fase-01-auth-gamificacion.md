# Fase 1 — Auth, Seguridad y Motor de Gamificación

**Prerequisito:** Fase 0 completada (BD con tablas, backend corriendo).
**Resultado:** Sistema de autenticación completo + motor de XP/niveles/rachas/logros funcionando vía API.
**Specs de referencia:** `03-auth.md`, `04-gamification.md`

---

## BLOQUE A — Autenticación y Seguridad

### Paso 1.1 — Middleware de Autenticación JWT

**Archivo:** `backend/src/shared/middleware/auth.middleware.ts`

1. Registrar plugin `@fastify/jwt` con `JWT_SECRET` del entorno para access tokens y `JWT_REFRESH_SECRET` para refresh tokens
2. Crear `authenticate` preHandler:
   - Extrae token de `Authorization: Bearer <token>`
   - Verifica firma y expiración (15 min)
   - Si inválido: lanza `401 Unauthorized`
   - Si válido: adjunta `request.user = { id, email }` para uso en handlers
3. Crear `optionalAuthenticate` preHandler (no lanza error si no hay token — usado en rutas públicas opcionales)

**Criterio:** Una ruta protegida con `preHandler: [authenticate]` rechaza requests sin token válido.

---

### Paso 1.2 — Rate Limiting en Auth

**Archivo:** `backend/src/shared/plugins/rate-limit.plugin.ts`

1. Registrar `@fastify/rate-limit` con configuración global: 100 req/min por IP
2. Configuración específica para rutas de auth: **10 intentos cada 15 minutos por IP**
3. Almacenar contadores en Redis (clave: `ratelimit:auth:{ip}`)
4. Al superar el límite: respuesta `429 Too Many Requests` con header `Retry-After`

---

### Paso 1.3 — Módulo Auth — Repository y Service

**Archivos:** `backend/src/modules/auth/auth.repository.ts`, `auth.service.ts`

**`auth.repository.ts`:**
- `findByEmail(email: string)` → usuario completo
- `findById(id: string)` → usuario
- `createUser(data)` → usuario nuevo
- `updateUser(id, data)` → actualizar campos
- `saveRefreshToken(userId, tokenHash, deviceInfo, expiresAt)`
- `findRefreshToken(tokenHash)` → token (verificar no revocado)
- `revokeRefreshToken(tokenHash)`
- `revokeAllUserTokens(userId)` — para logout de todos los dispositivos

**`auth.service.ts`:**
- `register(nombre, email, password)`:
  1. Verificar que email no existe (lanzar `ConflictError` si existe)
  2. Hashear password con Argon2id (memory: 65536, iterations: 3, parallelism: 4)
  3. Crear usuario con xp_total=0, nivel=1
  4. Generar access token (15min) y refresh token (30 días)
  5. Guardar hash del refresh token en `refresh_tokens`
  6. Devolver `{ user, accessToken, refreshToken }`
- `login(email, password)`:
  1. Buscar usuario por email
  2. Verificar password con `argon2.verify()`
  3. Si incorrecto: lanzar `UnauthorizedError` (no revelar si email existe)
  4. Si correcto: generar tokens, guardar refresh token
  5. Actualizar `last_login_at`
  6. Devolver `{ user, accessToken, refreshToken }`
- `verifySecret(userId, answer)`:
  1. Obtener usuario
  2. Si `secret_activated = false` → marcar como activado y devolver `{ success: true }` (primera vez)
  3. Si `secret_activated = true` → comparar con `argon2.verify(hashed_answer, answer.trim().toLowerCase())`
  4. Si incorrecto: incrementar contador de intentos en Redis (`auth:secret_attempts:{userId}`)
  5. Si 3 intentos fallidos: bloquear 15 minutos (`auth:secret_blocked:{userId}` con TTL 900)
- `refreshToken(tokenHash)`:
  1. Verificar token existe y no está revocado ni expirado
  2. Revocar el token actual (rotación)
  3. Generar nuevo par de tokens
  4. Guardar nuevo refresh token
- `logout(tokenHash)`:
  1. Revocar refresh token en DB
- `verifyRecovery(answer1, answer2, userId)`:
  1. Verificar ambas respuestas con Argon2id
  2. Si ambas correctas: devolver `{ recovery_token }` (JWT de vida corta 10 min)
- `resetPassword(recoveryToken, newPassword)`:
  1. Verificar recovery token
  2. Hashear nueva contraseña
  3. Actualizar usuario
  4. Revocar todos los refresh tokens del usuario

---

### Paso 1.4 — Módulo Auth — Routes

**Archivo:** `backend/src/modules/auth/auth.routes.ts`

Registrar bajo prefijo `/api/auth`:

| Método | Ruta | Handler | Rate limit |
|--------|------|---------|-----------|
| POST | `/register` | `registerHandler` | 5/15min |
| POST | `/login` | `loginHandler` | 10/15min |
| POST | `/verify-secret` | `verifySecretHandler` | 3/15min por userId |
| POST | `/refresh` | `refreshHandler` | 20/15min |
| POST | `/logout` | `logoutHandler` | auth requerido |
| POST | `/recover/verify` | `verifyRecoveryHandler` | 2/30min |
| POST | `/recover/reset` | `resetPasswordHandler` | 5/15min |

**Schemas Zod** (`auth.schema.ts`):
- `RegisterSchema`: `{ nombre: z.string().min(2).max(50), email: z.string().email(), password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/), confirmPassword: z.string() }` + refinement `password === confirmPassword`
- `LoginSchema`: `{ email, password }`
- `VerifySecretSchema`: `{ answer: z.string().trim() }`
- `RefreshSchema`: `{ refreshToken: z.string() }` (o desde cookie httpOnly)
- `RecoverySchema`: `{ answer1, answer2 }`
- `ResetPasswordSchema`: `{ recoveryToken, newPassword, confirmPassword }`

**Manejo de cookies:**
- En web: refresh token en `httpOnly` cookie (SameSite=Strict, Secure en producción)
- En mobile: refresh token en body de respuesta (guardado en `expo-secure-store`)
- Usar header `X-Client-Type: mobile|web` para diferenciar comportamiento

**Criterio:** Flujo completo de registro → login → verify-secret → refresh → logout pasa sin errores. Los tokens expiran correctamente.

---

### Paso 1.5 — Logs de Acceso

**Archivo:** `backend/src/modules/auth/auth.audit.ts`

Al hacer login exitoso, registrar en tabla `auth_logs` (agregar al schema):
- `usuario_id`, `ip` (del request), `user_agent`, `tipo` (login/logout/refresh/failed), `created_at`

Se usa para mostrar al usuario "Historial de accesos" en configuración (funcionalidad futura).

---

## BLOQUE B — Motor de Gamificación

### Paso 1.6 — Utilidades de XP

**Archivo:** `backend/src/shared/utils/xp.utils.ts`

Funciones puras (sin efectos secundarios, fáciles de testear):

```typescript
// Calcula el bonus de racha dado el número de días consecutivos
function calcularBonusRacha(diasRacha: number): number {
  return Math.min(1.0 + diasRacha * 0.011, 2.0)
}

// Calcula nivel desde XP total acumulado
function calcularNivel(xpTotal: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (xpTotal < 27001) return 1
  if (xpTotal < 70001) return 2
  if (xpTotal < 140001) return 3
  if (xpTotal < 250001) return 4
  if (xpTotal < 420001) return 5
  return 6
}

// Calcula XP final aplicando bonuses
function calcularXPFinal(xpBase: number, bonusRacha: number, bonusHorario: number): number {
  return Math.floor(xpBase * bonusRacha * bonusHorario)
}

// Verifica si una actividad cae en el horario óptimo de su tipo
function esHorarioOptimo(tipo: string, timestamp: Date): boolean {
  const hora = timestamp.getHours()
  const horarios: Record<string, [number, number]> = {
    'ejercicio_fuerza': [6, 10],
    'ejercicio_cardio': [6, 10],
    'barras': [6, 10],
    'trote': [6, 10],
    'estudio': [8, 14],
    'sol_matutino': [0, 9],
    'meditacion': [0, 9],
    'sueno': [21, 7]
  }
  const [inicio, fin] = horarios[tipo] ?? [0, 24]
  return hora >= inicio && hora < fin
}

// Calcula penalización de impuntualidad Cronos (-15%)
function calcularXPConPenalizacionCronos(xpBase: number, fuePuntual: boolean): number {
  return fuePuntual ? xpBase : Math.floor(xpBase * 0.85)
}
```

**Criterio:** Tests unitarios para `calcularBonusRacha(90) === 1.99`, `calcularNivel(27001) === 2`, etc.

---

### Paso 1.7 — Servicio de Rachas

**Archivo:** `backend/src/modules/gamification/racha.service.ts`

- `marcarActividadDelDia(usuarioId: string, fecha: Date)`:
  1. Upsert en tabla `rachas` (`ON CONFLICT (usuario_id, fecha) DO UPDATE SET tiene_actividad = true`)
- `calcularRachaActual(usuarioId: string): Promise<number>`:
  1. Obtener días desde hoy hacia atrás donde `tiene_actividad = true`
  2. Contar días consecutivos sin gap (usando query recursiva o loop en JS)
  3. Si hay un día sin actividad: detener el conteo
  4. Devolver el contador
- `calcularMejorRacha(usuarioId: string): Promise<number>`:
  1. Obtener todos los registros de `rachas` del usuario
  2. Calcular la secuencia más larga de días consecutivos con actividad
- `verificarRupturaRacha(usuarioId: string)`:
  - Se invoca desde el job diario a las 23:59
  - Si el día de hoy no tiene actividad: registrar el gap (no modifica tabla, el cálculo ya lo detecta)
  - Emitir WebSocket `streak:updated` con la racha calculada

**Job BullMQ** (`backend/src/jobs/streak-check.worker.ts`):
- Cron: `'59 23 * * *'` (23:59 todos los días)
- Para cada usuario activo con sesión reciente: verificar racha y emitir evento si se rompió
- Si la racha se rompe: enviar notificación push (ver Fase 6)

---

### Paso 1.8 — Servicio de XP y Niveles

**Archivo:** `backend/src/modules/gamification/xp.service.ts`

- `otorgarXP(params: { usuarioId, xpBase, fuente, fuenteId, bonusHorario?, descripcion? })`:
  1. Obtener `diasRacha` del usuario con `racha.service.calcularRachaActual()`
  2. Calcular `bonusRacha = calcularBonusRacha(diasRacha)`
  3. Calcular `xpFinal = calcularXPFinal(xpBase, bonusRacha, bonusHorario ?? 1.0)`
  4. Insertar en `xp_events`
  5. `UPDATE usuarios SET xp_total = xp_total + xpFinal WHERE id = usuarioId`
  6. Obtener `xp_total` nuevo
  7. Calcular nivel nuevo con `calcularNivel(xpTotalNuevo)`
  8. Si nivel nuevo > nivel anterior: `UPDATE usuarios SET nivel = nuevoNivel`, emitir `level:up` via WebSocket
  9. Emitir `xp:updated` via WebSocket con `{ xp_total, nivel, xp_delta: xpFinal }`
  10. Llamar a `logros.service.verificarLogros(usuarioId)` (ver paso 1.10)
  11. Devolver `{ xp_otorgado: xpFinal, nivel_nuevo, subio_nivel: boolean }`

- `obtenerEstadoGamificacion(usuarioId: string)`:
  - Devuelve `{ xp_total, nivel, racha_actual, mejor_racha, bonus_racha_actual, xp_para_siguiente_nivel, porcentaje_nivel }`

---

### Paso 1.9 — Definición de Logros del Sistema

**Archivo:** `backend/src/modules/gamification/achievements.catalog.ts`

Array de constantes con todos los logros predefinidos del spec 04:
```typescript
export const LOGROS_SISTEMA = [
  {
    id: 'first_step',
    nombre: 'Primer Paso',
    descripcion: 'Registra tu primera actividad',
    criterio_tipo: 'actividades_total',
    criterio_valor: 1,
    xp: 25
  },
  // ... todos los logros del spec 04
  {
    id: 'level_3',
    criterio_tipo: 'nivel_minimo',
    criterio_valor: 3,
    xp: 150
  },
  {
    id: 'level_6',
    criterio_tipo: 'nivel_minimo',
    criterio_valor: 6,
    xp: 500
  }
  // ... todos los demás
]
```

---

### Paso 1.10 — Servicio de Logros

**Archivo:** `backend/src/modules/gamification/logros.service.ts`

- `inicializarLogrosUsuario(usuarioId: string)`:
  - Al registrarse, insertar todos los logros del sistema en `usuario_achievements` con `progreso=0`, `desbloqueado=false`
- `verificarLogros(usuarioId: string)`:
  1. Obtener todos los logros no desbloqueados del usuario
  2. Para cada logro, según `criterio_tipo`:
     - `actividades_total`: `SELECT COUNT(*) FROM actividades WHERE usuario_id = ?`
     - `racha_minima`: comparar con `racha_actual`
     - `nivel_minimo`: comparar con `usuario.nivel`
     - `sesiones_fisicas`: count actividades área física
     - `horas_estudio`: sum duracion_minutos donde tipo='estudio'
     - `dias_sueno`: count registros sueño >= 420 min
     - `actividades_tipo`: count por tipo específico
     - `cronos_100`: verificar Cronos completado al 100% ese día
  3. Si `progreso >= criterio_valor` y `!desbloqueado`:
     - `UPDATE SET desbloqueado=true, desbloqueado_at=NOW()`
     - Llamar a `xp.service.otorgarXP(...)` con el XP del logro
     - Emitir `achievement:unlocked` via WebSocket
     - Crear notificación in-app
- `crearHitoManual(usuarioId, nombre, descripcion, xp, icono)`:
  - Insertar en `usuario_achievements` con `tipo='manual'`, `desbloqueado=false`
- `completarHito(usuarioId, achievementId)`:
  - Marcar como desbloqueado y otorgar XP
- `sugerirConIA(usuarioId)`:
  - Compilar resumen de actividades últimos 7 días
  - Invocar módulo IA (implementado en Fase 5)
  - Devolver las 3 sugerencias

---

### Paso 1.11 — Endpoints de Gamificación

**Archivo:** `backend/src/modules/gamification/gamification.routes.ts`

Prefijo `/api/gamification`. Todos requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/status` | XP, nivel, racha, mejor racha, bonus actual, XP para siguiente nivel |
| GET | `/achievements` | Lista de logros del usuario (con progreso y estado) |
| POST | `/achievements/hito` | Crear hito manual |
| POST | `/achievements/:id/complete` | Marcar hito como completado |
| POST | `/achievements/suggest` | Sugerir logros con IA |
| GET | `/history` | Historial de XP events paginado |
| GET | `/leaderboard/personal` | Progreso personal por período (semana/mes/año) |

---

### Paso 1.12 — Integración con WebSocket

**Archivo:** `backend/src/shared/plugins/socket.plugin.ts`

1. Registrar Socket.IO en el servidor Fastify
2. Autenticación de conexión: el cliente envía el access token en el handshake
   ```typescript
   io.use((socket, next) => {
     const token = socket.handshake.auth.token
     // verificar JWT → adjuntar socket.data.userId
   })
   ```
3. Cada usuario conectado se une a su sala privada: `socket.join(`user:${userId}`)`
4. Crear `emitToUser(userId, event, data)` helper
5. Emitir desde `xp.service` y `racha.service` al disparar eventos

Eventos a emitir desde esta fase:
- `xp:updated` → `{ xp_total, nivel, xp_delta }`
- `level:up` → `{ nivel_anterior, nivel_nuevo, nombre_nivel }`
- `achievement:unlocked` → `{ achievement_id, nombre, xp }`
- `streak:updated` → `{ racha_actual, mejor_racha }`

---

## Checklist de Aceptación — Fase 1

- [ ] `POST /api/auth/register` crea usuario con XP=0, nivel=1, logros inicializados
- [ ] `POST /api/auth/login` devuelve access token (15min) y refresh token (30 días)
- [ ] `POST /api/auth/verify-secret` bloquea tras 3 intentos fallidos
- [ ] `POST /api/auth/refresh` rota tokens correctamente
- [ ] Argon2id hashea passwords con los parámetros de seguridad correctos
- [ ] `calcularBonusRacha(90)` devuelve `1.99`, `calcularBonusRacha(91)` devuelve `2.0`
- [ ] `calcularNivel(27000)` devuelve `1`, `calcularNivel(27001)` devuelve `2`
- [ ] `otorgarXP()` actualiza xp_total, crea xp_event, emite WebSocket
- [ ] Level Up se dispara correctamente al cruzar umbral
- [ ] Los 17 logros del sistema se inicializan al registrarse
- [ ] `verificarLogros()` desbloquea `first_step` al registrar la primera actividad
- [ ] WebSocket emite eventos correctamente a la sala del usuario
