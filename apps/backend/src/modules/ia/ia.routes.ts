import type { FastifyInstance } from 'fastify'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { redisConnection } from '../../shared/redis.js'
import { generarResumenProgreso } from './ia.service.js'
import { db } from '../../db/index.js'
import { iaConfig } from '../../db/schema/ia.js'
import { eq } from 'drizzle-orm'

const iaQueue = new Queue('ai-task', { connection: redisConnection })
const redis = new Redis({ ...redisConnection, lazyConnect: false })

export async function iaRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.post('/logros/sugerir', async (request, reply) => {
    const usuario = request.user as { id: string }
    const [config] = await db.select().from(iaConfig).where(eq(iaConfig.usuarioId, usuario.id))
    if (config && !config.sugerenciasLogros)
      return reply.send({ mensaje: 'IA desactivada para esta función' })
    const job = await iaQueue.add('suggest_logros', { tipo: 'suggest_logros', usuarioId: usuario.id })
    await redis.set(`ai:job:${job.id}`, JSON.stringify({ status: 'pending' }), 'EX', 3600)
    return reply.code(202).send({ jobId: job.id })
  })

  app.get('/logros/sugerir/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const raw = await redis.get(`ai:job:${jobId}`)
    if (!raw) return reply.code(404).send({ error: 'Job no encontrado o expirado' })
    return reply.send(JSON.parse(raw))
  })

  app.post('/misiones/sugerir', async (request, reply) => {
    const usuario = request.user as { id: string }
    const [config] = await db.select().from(iaConfig).where(eq(iaConfig.usuarioId, usuario.id))
    if (config && !config.sugerenciasMisiones)
      return reply.send({ mensaje: 'IA desactivada para esta función' })
    const job = await iaQueue.add('suggest_misiones', { tipo: 'suggest_misiones', usuarioId: usuario.id })
    await redis.set(`ai:job:${job.id}`, JSON.stringify({ status: 'pending' }), 'EX', 3600)
    return reply.code(202).send({ jobId: job.id })
  })

  app.get('/misiones/sugerir/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const raw = await redis.get(`ai:job:${jobId}`)
    if (!raw) return reply.code(404).send({ error: 'Job no encontrado o expirado' })
    return reply.send(JSON.parse(raw))
  })

  app.get('/resumen', async (request, reply) => {
    const usuario = request.user as { id: string }
    const markdown = await generarResumenProgreso(usuario.id)
    return reply.send({ resumen: markdown })
  })
}
