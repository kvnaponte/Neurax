import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { makeOdinService } from './odin.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CustomMisionSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().max(1000).optional(),
  objetivo_tipo: z.string().min(1).max(100),
  objetivo_valor: z.number().int().min(1),
  xp_reward: z.number().int().min(1).max(300),
  frecuencia: z.enum(['diaria', 'semanal', 'una_vez']),
})

const ProgressSchema = z.object({
  delta: z.number().int().min(1).default(1),
})

const odinPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeOdinService(db)

  fastify.get('/missions', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerMisionesDelDia(userId))
  })

  fastify.get('/missions/week', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerMisionSemana(userId))
  })

  fastify.get('/missions/month', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerMisionMes(userId))
  })

  fastify.get('/calendar', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { year, month } = req.query as Record<string, string>
    const now = new Date()
    const y = year ? parseInt(year) : now.getUTCFullYear()
    const m = month ? parseInt(month) : now.getUTCMonth() + 1
    return reply.send(await service.obtenerCalendario(userId, y, m))
  })

  fastify.post('/missions/custom', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = CustomMisionSchema.parse(req.body)
      const result = await service.crearMisionPersonalizada(userId, data)
      return reply.status(201).send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.post('/missions/:id/progress', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const { delta } = ProgressSchema.parse(req.body)
      const result = await service.actualizarProgresoManual(userId, id, delta)
      return reply.send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/cofres', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerCofres(userId))
  })
}

export default odinPlugin
