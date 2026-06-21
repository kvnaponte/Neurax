import { eq, desc, and } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { Server } from 'socket.io'
import webpush from 'web-push'
import type * as schema from '../../db/schema'
import { notificaciones, notificaciones_config } from '../../db/schema'
import { notificationsQueue } from '../../jobs/queues.js'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:admin@neurax.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

type DB = PostgresJsDatabase<typeof schema>

const PUSH_ENABLED_TYPES = new Set([
  'recordatorio_diario',
  'racha_en_riesgo',
  'logro_desbloqueado',
  'odin_disponible',
  'cofre_epico',
  'meta_demeter',
  'cronos_proximo',
  'entrega_prodigy',
  'fecha_proeza',
])

// Maps notification type → toggles key in notificaciones_config.toggles
const TOGGLE_KEY: Record<string, string> = {
  recordatorio_diario: 'recordatorio_diario',
  racha_en_riesgo: 'racha_en_riesgo',
  logro_desbloqueado: 'logros',
  odin_disponible: 'odin_daily',
  mision_completada: 'odin_daily',
  cofre_epico: 'logros',
  meta_demeter: 'demeter',
  cronos_proximo: 'cronos',
  entrega_prodigy: 'prodigy',
  fecha_proeza: 'proeza',
}

function isInNoMolestarWindow(inicio: string | null, fin: string | null): boolean {
  if (!inicio || !fin) return false
  const now = new Date()
  const current = now.getUTCHours() * 60 + now.getUTCMinutes()
  const [hI, mI] = inicio.split(':').map(Number)
  const [hF, mF] = fin.split(':').map(Number)
  const start = hI * 60 + mI
  const end = hF * 60 + mF
  // Overnight range (e.g. 23:00-06:00) when start > end
  if (start > end) return current >= start || current < end
  return current >= start && current < end
}

export async function crearNotificacion(
  db: DB,
  io: Server | null,
  usuarioId: string,
  opts: { tipo: string; titulo: string; mensaje: string; data?: Record<string, unknown> },
): Promise<void> {
  const [notif] = await db.insert(notificaciones).values({
    usuario_id: usuarioId,
    tipo: opts.tipo,
    titulo: opts.titulo,
    mensaje: opts.mensaje,
    data: opts.data ?? {},
  }).returning({ id: notificaciones.id })

  io?.to(usuarioId).emit('notification:new', {
    id: notif.id,
    tipo: opts.tipo,
    titulo: opts.titulo,
    mensaje: opts.mensaje,
  })

  if (PUSH_ENABLED_TYPES.has(opts.tipo)) {
    await notificationsQueue.add('send-push', { usuarioId, notificacionId: notif.id, tipo: opts.tipo }, {
      jobId: `push-${notif.id}`, // deduplication by notificacion id
    })
  }
}

export async function enviarPush(db: DB, usuarioId: string, notificacionId: string, tipo: string): Promise<void> {
  const [config] = await db.select().from(notificaciones_config)
    .where(eq(notificaciones_config.usuario_id, usuarioId))
    .limit(1)

  if (!config?.push_token) return

  // Check no_molestar window
  const inicio = (config.no_molestar_inicio as string | null)?.substring(0, 5) ?? null
  const fin = (config.no_molestar_fin as string | null)?.substring(0, 5) ?? null
  if (isInNoMolestarWindow(inicio, fin)) return

  // Check per-type toggle (default true if key absent)
  const toggleKey = TOGGLE_KEY[tipo]
  if (toggleKey) {
    const toggles = (config.toggles as Record<string, boolean> | null) ?? {}
    if (toggles[toggleKey] === false) return
  }

  const [notif] = await db.select({ titulo: notificaciones.titulo, mensaje: notificaciones.mensaje })
    .from(notificaciones)
    .where(and(eq(notificaciones.id, notificacionId), eq(notificaciones.usuario_id, usuarioId)))
    .limit(1)

  if (!notif) return

  if (config.push_type === 'expo') {
    await sendExpoPush(config.push_token, notif.titulo, notif.mensaje)
  } else if (config.push_type === 'web') {
    const sub = config.web_push_subscription as { endpoint: string; keys: { p256dh: string; auth: string } } | null
    if (sub?.endpoint) await sendWebPush(sub, notif.titulo, notif.mensaje)
  }
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  title: string,
  body: string,
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.warn('[Notifications] Web push skipped: VAPID keys not configured')
    return
  }
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body }),
    )
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn('[Notifications] Web push subscription expired:', subscription.endpoint)
    } else {
      console.error('[Notifications] Web push failed:', err.message)
    }
  }
}

async function sendExpoPush(token: string, title: string, body: string): Promise<void> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  })
  if (!res.ok) {
    console.error('[Notifications] Expo push failed:', await res.text())
  }
}

// Used by cron workers to skip notification creation entirely when toggle is off
// or user is in no_molestar window. Event-triggered notifications (logro, cofre,
// meta) always create the DB record so the in-app badge reflects the event.
export async function puedeNotificarCron(db: DB, usuarioId: string, tipo: string): Promise<boolean> {
  const [config] = await db.select().from(notificaciones_config)
    .where(eq(notificaciones_config.usuario_id, usuarioId))
    .limit(1)

  if (!config) return true

  const inicio = (config.no_molestar_inicio as string | null)?.substring(0, 5) ?? null
  const fin = (config.no_molestar_fin as string | null)?.substring(0, 5) ?? null
  if (isInNoMolestarWindow(inicio, fin)) return false

  const toggleKey = TOGGLE_KEY[tipo]
  if (toggleKey) {
    const toggles = (config.toggles as Record<string, boolean> | null) ?? {}
    if (toggles[toggleKey] === false) return false
  }

  return true
}

export async function marcarLeida(db: DB, usuarioId: string, notificacionId: string): Promise<void> {
  await db.update(notificaciones)
    .set({ leida: true })
    .where(and(eq(notificaciones.id, notificacionId), eq(notificaciones.usuario_id, usuarioId)))
}

export async function marcarTodasLeidas(db: DB, usuarioId: string): Promise<void> {
  await db.update(notificaciones)
    .set({ leida: true })
    .where(and(eq(notificaciones.usuario_id, usuarioId), eq(notificaciones.leida, false)))
}

export async function obtenerNotificaciones(db: DB, usuarioId: string) {
  return db.select().from(notificaciones)
    .where(eq(notificaciones.usuario_id, usuarioId))
    .orderBy(desc(notificaciones.created_at))
    .limit(30)
}
