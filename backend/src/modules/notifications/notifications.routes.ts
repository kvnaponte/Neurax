import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { notificaciones_config } from '../../db/schema/index.js'
import {
  crearNotificacion,
  marcarLeida,
  marcarTodasLeidas,
  obtenerNotificaciones,
} from './notifications.service.js'
import { getIo } from '../../shared/io.js'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const ConfigSchema = z.object({
  hora_recordatorio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  no_molestar_inicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  no_molestar_fin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  toggles: z.record(z.boolean()).optional(),
})

const WebPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

const PushTokenSchema = z.discriminatedUnion('push_type', [
  z.object({ push_type: z.literal('expo'), push_token: z.string() }),
  z.object({ push_type: z.literal('web'), web_push_subscription: WebPushSubscriptionSchema }),
])

const notificationsPlugin: FastifyPluginAsync = async (fastify) => {
  // GET /api/notifications/vapid-public-key  (público — la web app lo necesita para suscribirse)
  fastify.get('/vapid-public-key', async (_req, reply) => {
    return reply.send({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null })
  })

  // GET /api/notifications
  fastify.get('/', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const items = await obtenerNotificaciones(db, userId)
    return reply.send(items)
  })

  // PUT /api/notifications/config
  fastify.put('/config', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const body = ConfigSchema.parse(req.body)

    await db.insert(notificaciones_config)
      .values({
        usuario_id: userId,
        hora_recordatorio: body.hora_recordatorio ?? null,
        no_molestar_inicio: body.no_molestar_inicio ?? null,
        no_molestar_fin: body.no_molestar_fin ?? null,
        toggles: body.toggles ?? {},
      })
      .onConflictDoUpdate({
        target: notificaciones_config.usuario_id,
        set: {
          ...(body.hora_recordatorio !== undefined && { hora_recordatorio: body.hora_recordatorio }),
          ...(body.no_molestar_inicio !== undefined && { no_molestar_inicio: body.no_molestar_inicio }),
          ...(body.no_molestar_fin !== undefined && { no_molestar_fin: body.no_molestar_fin }),
          ...(body.toggles !== undefined && { toggles: body.toggles }),
        },
      })

    return reply.send({ ok: true })
  })

  // POST /api/notifications/:id/read
  fastify.post('/:id/read', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    await marcarLeida(db, userId, id)
    return reply.send({ ok: true })
  })

  // POST /api/notifications/read-all
  fastify.post('/read-all', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    await marcarTodasLeidas(db, userId)
    return reply.send({ ok: true })
  })

  // POST /api/notifications/register-push-token
  fastify.post('/register-push-token', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const body = PushTokenSchema.parse(req.body)

    const values = body.push_type === 'expo'
      ? { push_type: 'expo' as const, push_token: body.push_token, web_push_subscription: null }
      : { push_type: 'web' as const, push_token: null, web_push_subscription: body.web_push_subscription }

    await db.insert(notificaciones_config)
      .values({ usuario_id: userId, ...values })
      .onConflictDoUpdate({
        target: notificaciones_config.usuario_id,
        set: values,
      })

    return reply.send({ ok: true })
  })
}

export default notificationsPlugin
