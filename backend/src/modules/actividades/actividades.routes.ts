import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { makeActividadesService } from './actividades.service'
import { TIPOS_VALIDOS } from './actividades.catalog'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const VALID_PERIODOS = ['week', 'month', 'year'] as const

const RegistrarSchema = z.object({
  tipo: z.enum(TIPOS_VALIDOS as [string, ...string[]]),
  duracion_minutos: z.number().int().min(1).max(1440),
  timestamp: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  descripcion: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const actividadesPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeActividadesService(db)

  fastify.post('/', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const body = RegistrarSchema.parse(req.body)
      const resultado = await service.registrarActividad(userId, body)
      return reply.status(201).send(resultado)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { area, tipo, fechaInicio, fechaFin, page, limit } = req.query as Record<string, string>
    const resultado = await service.listarActividades(userId, {
      area, tipo, fechaInicio, fechaFin,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
    return reply.send(resultado)
  })

  fastify.get('/today', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.actividadesHoy(userId))
  })

  fastify.get('/stats', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { periodo = 'month' } = req.query as Record<string, string>
    if (!VALID_PERIODOS.includes(periodo as any)) {
      return reply.status(400).send({ error: 'periodo debe ser week, month o year' })
    }
    return reply.send(await service.stats(userId, periodo as 'week' | 'month' | 'year'))
  })

  fastify.get('/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    const actividad = await service.obtenerActividad(userId, id)
    if (!actividad) return reply.status(404).send({ error: 'Actividad no encontrada' })
    return reply.send(actividad)
  })

  fastify.delete('/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      await service.softDelete(userId, id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })
}

export default actividadesPlugin
