# Fase 6 — Sistema de Notificaciones, WebSocket e Integraciones

**Prerequisito:** Fases 1–5 completadas (todos los módulos backend existen).
**Resultado:** Las notificaciones push llegan al dispositivo. Los eventos WebSocket actualizan la UI en tiempo real. Las 11 integraciones entre secciones están activas.
**Specs de referencia:** `14-notifications-ai.md`, `16-integrations.md`, `08-cronos.md` (integraciones en tabla)

---

## BLOQUE A — Sistema de Notificaciones

### Paso 6.1 — Configuración de Push Notifications

**Archivo:** `backend/src/modules/notificaciones/push.service.ts`

NEURAX usa **Expo Push Notifications** (gratuito, compatible con React Native + Expo).

1. Instalar: `pnpm add expo-server-sdk` en `backend/`
2. Implementar `push.service.ts`:

```typescript
import { Expo, ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo()

export async function enviarPush(params: {
  usuarioId: string
  titulo: string
  cuerpo: string
  datos?: Record<string, unknown>
  sonido?: 'default' | null
}): Promise<void> {
  // Obtener tokens del usuario
  const tokens = await db.query.notificaciones_config.findMany({
    where: and(
      eq(notificaciones_config.usuario_id, params.usuarioId),
      eq(notificaciones_config.push_habilitado, true),
      isNotNull(notificaciones_config.expo_push_token)
    )
  })

  if (!tokens.length) return

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.expo_push_token!))
    .map((t) => ({
      to:    t.expo_push_token!,
      sound: params.sonido ?? 'default',
      title: params.titulo,
      body:  params.cuerpo,
      data:  params.datos ?? {}
    }))

  const chunks = expo.chunkPushNotifications(messages)
  for (const chunk of chunks) {
    const receipts = await expo.sendPushNotificationsAsync(chunk)
    for (const receipt of receipts) {
      if (receipt.status === 'error') {
        console.error('Push error:', receipt.message)
      }
    }
  }

  // Guardar en tabla notificaciones (historial)
  await db.insert(notificaciones).values({
    usuario_id: params.usuarioId,
    titulo:     params.titulo,
    cuerpo:     params.cuerpo,
    datos:      params.datos,
    enviada_at: new Date()
  })
}
```

---

### Paso 6.2 — Worker de Notificaciones BullMQ

**Archivo:** `backend/src/jobs/notifications.worker.ts`

El worker procesa la cola `queue:notifications`:

```typescript
new Worker('queue:notifications', async (job) => {
  const { usuarioId, titulo, cuerpo, datos, tipo } = job.data

  // Verificar preferencias del usuario
  const config = await db.query.notificaciones_config.findFirst({
    where: eq(notificaciones_config.usuario_id, usuarioId)
  })

  if (!config) return
  
  // Respetar preferencias por tipo
  const mapeo: Record<string, keyof typeof config> = {
    xp:      'notif_xp',
    mision:  'notif_misiones',
    racha:   'notif_racha',
    cofre:   'notif_cofre',
    demeter: 'notif_demeter'
  }
  const prefKey = mapeo[tipo]
  if (prefKey && !config[prefKey]) return

  await push.service.enviarPush({ usuarioId, titulo, cuerpo, datos })
}, { connection: redisConnection })
```

---

### Paso 6.3 — Tipos de Notificación

**Archivo:** `backend/src/modules/notificaciones/notificaciones.catalog.ts`

Definir todas las notificaciones del sistema:

| Tipo | Disparador | Título | Cuerpo |
|------|-----------|--------|--------|
| `xp_ganado` | Actividad registrada | "⚔️ +{xp} XP" | "Has ganado {xp} XP por {tipo_actividad}" |
| `nivel_up` | Subir de nivel | "🏆 ¡Nivel {nivel}!" | "Has alcanzado el nivel {nombre_nivel}" |
| `mision_completada` | Completar misión | "✅ Misión completada" | "{nombre_mision} — +{xp} XP" |
| `cofre_epico` | Todas las misiones del día | "🎁 Cofre Épico" | "¡Abriste el cofre de hoy! +{xp} XP" |
| `racha_riesgo` | Job 23:59 sin actividad | "⚠️ Racha en riesgo" | "Lleva {dias} días de racha. Registra una actividad" |
| `racha_rota` | Job 23:59 racha terminada | "💔 Racha perdida" | "Tu racha de {dias} días se ha roto" |
| `presupuesto_80` | Demeter 80% | "📊 Presupuesto" | "El {categoria} está al 80% del presupuesto" |
| `fondo_objetivo` | Fondo lleno | "💰 Fondo {nombre}" | "¡Alcanzaste el objetivo de ahorro para {nombre}!" |
| `insight_semanal` | Job lunes 8am | "💡 Resumen semanal" | "{insight}" |
| `logro_desbloqueado` | Achievement | "🏅 Logro desbloqueado" | "{nombre_logro}" |
| `cronos_recordatorio` | 15 min antes del evento | "🕒 {titulo_evento}" | "Empieza en 15 minutos" |

---

### Paso 6.4 — Job de Verificación de Racha (23:59)

**Archivo:** `backend/src/jobs/streak-check.worker.ts`

Cron `'59 23 * * *'`:

```typescript
new Worker('queue:streak-check', async () => {
  const usuariosActivos = await db.query.usuarios.findMany({
    where: and(eq(usuarios.active, true), gt(usuarios.last_login_at, subDays(new Date(), 30)))
  })

  for (const usuario of usuariosActivos) {
    const tieneActividadHoy = await db.query.rachas.findFirst({
      where: and(
        eq(rachas.usuario_id, usuario.id),
        eq(rachas.fecha, format(new Date(), 'yyyy-MM-dd')),
        eq(rachas.tiene_actividad, true)
      )
    })

    if (!tieneActividadHoy) {
      const diasRacha = await racha.service.obtenerDiasRacha(usuario.id)
      if (diasRacha > 1) {
        // Enviar alerta de racha en riesgo
        await queue:notifications.add({ usuarioId: usuario.id, tipo: 'racha_riesgo', titulo: '⚠️ Racha en riesgo', cuerpo: `Llevas ${diasRacha} días de racha. Registra una actividad antes de medianoche.` })
      }
    }
  }
}, { connection: redisConnection })
```

---

### Paso 6.5 — Job de Recordatorio de Eventos Cronos (15 min)

**Archivo:** `backend/src/jobs/cronos-reminders.worker.ts`

Cron `'*/15 * * * *'` — cada 15 minutos:

- Buscar eventos que empiecen en los próximos 15 minutos y no tengan recordatorio enviado
- Enviar notificación push
- Marcar `recordatorio_enviado = true` en el evento

---

### Paso 6.6 — Endpoints de Notificaciones

**Archivo:** `backend/src/modules/notificaciones/notificaciones.routes.ts`

Prefijo `/api/notifications`. Requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Historial de notificaciones del usuario |
| POST | `/token` | Registrar expo_push_token del dispositivo |
| GET | `/config` | Obtener preferencias de notificación |
| PUT | `/config` | Actualizar preferencias |
| POST | `/read/:id` | Marcar notificación como leída |
| POST | `/read-all` | Marcar todas como leídas |

---

## BLOQUE B — WebSocket

### Paso 6.7 — Servidor Socket.IO

**Archivo:** `backend/src/shared/plugins/websocket.plugin.ts`

1. Ya instalado en Fase 0 (`socket.io` + `@fastify/websocket`)
2. Implementar el servidor Socket.IO:

```typescript
import { Server } from 'socket.io'

export function setupWebSocket(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: { origin: process.env.FRONTEND_URL },
    path: '/ws'
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    try {
      const payload = fastify.jwt.verify(token)
      socket.data.usuarioId = payload.sub
      next()
    } catch {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const usuarioId = socket.data.usuarioId
    socket.join(`user:${usuarioId}`)

    socket.on('disconnect', () => {})
  })

  fastify.decorate('io', io)
}
```

3. Decorar `fastify.io` para emitir desde cualquier servicio: `fastify.io.to('user:${userId}').emit('event', data)`

---

### Paso 6.8 — Catálogo de Eventos WebSocket

Todos los eventos que el backend emite al cliente:

| Evento | Datos | Cuándo |
|--------|-------|--------|
| `xp:updated` | `{ xp_total, xp_delta, nivel, nivel_nuevo? }` | Después de otorgar XP |
| `racha:updated` | `{ dias_racha, bonus_racha }` | Al marcar actividad del día |
| `achievement:unlocked` | `{ achievement }` | Al desbloquear logro |
| `mission:progress` | `{ mision_id, progreso, total, completada }` | Al actualizar progreso de misión |
| `mission:completed` | `{ mision_id, xp_reward }` | Al completar misión |
| `chest:opened` | `{ tipo_cofre, xp_reward }` | Al abrir cofre épico |
| `cronos:event_updated` | `{ evento }` | Al crear/mover/completar evento |
| `cronos:energy_updated` | `{ energia_por_evento[] }` | Al recalcular energía |
| `dionisio:pipeline_update` | `{ video_id, estado }` | En cada paso del pipeline |
| `notification:new` | `{ notificacion }` | Al enviar push también al socket |

---

## BLOQUE C — Integraciones Entre Secciones

### Paso 6.9 — Integración Cronos ↔ Todas las Secciones

Cronos sirve como hub. Las 11 secciones pueden crear eventos en Cronos. Implementar un servicio de integración unificado:

**Archivo:** `backend/src/modules/cronos/cronos-integration.service.ts`

- `crearEventoDesdeSoberbio(usuarioId, lugarId)`:
  - Crear evento tipo `experiencia_gastronomica` en Cronos con nombre del lugar
  - Vincular `fuente_id = lugarId`, `fuente_tipo = 'soberbio'`

- `crearEventoDesdeMichelin(usuarioId, recetaId, fechaHora)`:
  - Crear evento tipo `cocina` en Cronos
  - Al completar → disparar calificación en Michelin

- `crearEventoDesdeOdysseia(usuarioId, destinoId, fechaInicio, fechaFin)`:
  - Crear evento multi-día tipo `viaje`

- `crearEventoDesdeProdigy(usuarioId, entregaId, fechaEntrega)`:
  - Crear evento tipo `compromiso` (ya implementado en paso 4.14)

- `crearEventoDesdeNemesis(usuarioId, juegoId)`:
  - Crear evento tipo `gaming` opcional

---

### Paso 6.10 — Integración Demeter → Secciones

**Archivo:** `backend/src/modules/demeter/demeter-triggers.service.ts`

Cuando un fondo especial alcanza su objetivo, encadenar acciones:

- **Fondo Soberbio completo:**
  1. `soberbio.service.seleccionarLugarAleatorio(usuarioId)` → obtener lugar
  2. `cronos-integration.crearEventoDesdeSoberbio(usuarioId, lugar.id)` → crear evento tentativo
  3. Enviar notificación push con lugar seleccionado

- **Fondo Michelin completo:**
  1. `michelin.service.sugerirRecetaAleatoria(usuarioId)` → obtener receta
  2. Notificar al usuario con la receta seleccionada
  3. El usuario confirma la fecha → `crearEventoDesdeMichelin()`

- **Fondo Odysseia completo:**
  1. `odysseia.service.seleccionarDestinoAleatorio(usuarioId)` → obtener destino
  2. Notificar al usuario con el destino seleccionado

- **Fondo Nemesis completo:**
  1. Obtener juego con mayor prioridad en lista `por_comprar`
  2. Notificar que puede comprarlo

- **Fondo Kubera completo:**
  1. Obtener producto en estado `ahorrando`
  2. Notificar que puede adquirirlo
  3. El usuario confirma → `kubera.service.acquire()`

---

### Paso 6.11 — Integración Leonidas → Cronos

Cuando Leonidas asigna el músculo del día:
- Si el usuario tiene configurado un horario de entrenamiento en Cronos: verificar que existe el evento para hoy
- Si no existe: crear evento sugerido (borrable) tipo `entrenamiento` para la hora configurada

**Archivo:** Añadir en `leonidas-daily.worker.ts` (después de `asignarMusculoDelDia()`):

```typescript
const horarioConfig = await db.query.leonidas_plan_semanal.findFirst({
  where: and(eq(leonidas_plan_semanal.usuario_id, usuarioId), eq(leonidas_plan_semanal.dia_semana, diaSemana))
})

if (horarioConfig?.hora_inicio) {
  await cronos.service.crearEvento(usuarioId, {
    titulo: `Leonidas — ${asignacion.grupo_asignado}`,
    tipo: 'entrenamiento',
    inicio_at: /* fecha + hora_inicio */,
    fin_at: /* fecha + hora_fin */,
    fuente_tipo: 'leonidas',
    fuente_id: asignacion.id,
    auto_generado: true
  })
}
```

---

### Paso 6.12 — Integración Odin → Cronos

Odin puede incluir misiones del tipo `cronos_puntual` (completar N eventos de Cronos puntualmente). El progreso de estas misiones se actualiza desde `cronos.service.completarEvento()`:

**Añadir en `cronos.service.completarEvento()`** (después de la penalización):

```typescript
if (!impuntual) {
  await odin.service.verificarProgresoMisiones(usuarioId, {
    tipo: 'cronos_puntual',
    completado_puntual: true
  })
}
```

---

### Paso 6.13 — Integración XP → Sistema Completo

El flujo de XP es el corazón de las integraciones. Verificar que cada fuente de XP funciona correctamente:

| Fuente | Servicio | XP |
|--------|---------|-----|
| Actividad registrada | `actividades.service` | Variable según tipo |
| Misión completada | `odin-progress.service` | XP de la misión |
| Cofre épico | `odin-chest.service` | 300–350 XP |
| Leonidas sesión | `leonidas.service` | 30–80 XP |
| Soberbio visita | `soberbio.service` | 50 XP |
| Apolo película vista | `apolo.service` | 15 XP |
| Demeter movimiento | `demeter.service` | 5–15 XP |
| Proeza canción completa | `proeza.service` | 40 XP |
| Logro desbloqueado | `achievements.service` | Variable |

**Regla global de XP:** Toda fuente de XP pasa por `xp.service.otorgarXP()` (implementado en Fase 1), que actualiza `xp_total`, verifica level up y emite el evento WebSocket.

---

## Checklist de Aceptación — Fase 6

- [ ] `POST /api/notifications/token` registra el token Expo correctamente
- [ ] Al completar una actividad llega notificación push "+X XP"
- [ ] El socket emite `xp:updated` en tiempo real sin necesidad de recargar la UI
- [ ] Job de 23:59 envía alerta de racha si no hubo actividad
- [ ] Job de recordatorio Cronos envía push 15 min antes del evento
- [ ] Al completar el fondo Soberbio: se selecciona un lugar aleatorio y se notifica
- [ ] Al completar el fondo Michelin: se sugiere una receta pendiente
- [ ] `cronos:event_updated` se emite al mover un evento via drag & drop
- [ ] `achievement:unlocked` se emite al desbloquear un logro
- [ ] `dionisio:pipeline_update` se emite en cada cambio de estado del pipeline
- [ ] Las misiones tipo `cronos_puntual` avanzan al completar eventos Cronos a tiempo
