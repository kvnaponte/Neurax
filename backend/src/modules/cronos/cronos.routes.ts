import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { makeCronosService } from './cronos.service'
import { makeCronosApiKeysService } from './cronos-api-keys.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CrearEventoSchema = z.object({
  titulo: z.string().min(1).max(255),
  tipo: z.string().min(1).max(100),
  area: z.string().max(100).optional(),
  inicio_at: z.string().datetime().transform((v) => new Date(v)),
  fin_at: z.string().datetime().transform((v) => new Date(v)),
  prioridad: z.number().int().min(1).max(3).optional(),
  seccion_origen: z.string().max(100).optional(),
  seccion_ref_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const MoverEventoSchema = z.object({
  nuevo_inicio: z.string().datetime().transform((v) => new Date(v)),
  opcion: z.enum(['reemplazar', 'deslizar', 'intercambiar']),
})

const ApiKeySchema = z.object({
  nombre: z.string().min(1).max(255),
  permisos: z.record(z.unknown()).optional(),
})

const VALID_OPCIONES = ['reemplazar', 'deslizar', 'intercambiar'] as const

const cronosPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeCronosService(db)
  const apiKeysService = makeCronosApiKeysService(db)

  // GET /events
  fastify.get('/events', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { fecha, inicio, fin } = req.query as Record<string, string>

    try {
      if (inicio && fin) {
        return reply.send(await service.obtenerEventosPorRango(userId, new Date(inicio), new Date(fin)))
      }
      const fechaTarget = fecha ?? new Date().toISOString().slice(0, 10)
      return reply.send(await service.obtenerEventosDelDia(userId, fechaTarget))
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // POST /events
  fastify.post('/events', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = CrearEventoSchema.parse(req.body)
      const evento = await service.crearEvento(userId, data)
      return reply.status(201).send(evento)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // PUT /events/:id
  fastify.put('/events/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const data = CrearEventoSchema.partial().parse(req.body)
      const updated = await service.actualizarEvento(userId, id, data)
      return reply.send(updated)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // DELETE /events/:id
  fastify.delete('/events/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      await service.eliminarEvento(userId, id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // POST /events/:id/move
  fastify.post('/events/:id/move', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const { nuevo_inicio, opcion } = MoverEventoSchema.parse(req.body)
      await service.moverEvento(userId, id, nuevo_inicio, opcion)
      return reply.send({ success: true })
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // POST /events/:id/complete
  fastify.post('/events/:id/complete', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const result = await service.completarEvento(userId, id)
      return reply.send(result)
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // GET /availability
  fastify.get('/availability', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { fecha } = req.query as Record<string, string>
    const fechaTarget = fecha ?? new Date().toISOString().slice(0, 10)
    return reply.send(await service.obtenerDisponibilidad(userId, fechaTarget))
  })

  // GET /energy/:fecha
  fastify.get('/energy/:fecha', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { fecha } = req.params as { fecha: string }
    const resultado = await service.energiaService.propagarEnergiaDelDia(userId, fecha)
    return reply.send(resultado)
  })

  // POST /api-keys
  fastify.post('/api-keys', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const { nombre, permisos } = ApiKeySchema.parse(req.body)
      const result = await apiKeysService.generarApiKey(userId, nombre, permisos)
      return reply.status(201).send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  // DELETE /api-keys/:id
  fastify.delete('/api-keys/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      await apiKeysService.revocarApiKey(userId, id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })
}

// External routes plugin (agent access via API Key)
const cronosExternalPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeCronosService(db)
  const apiKeysService = makeCronosApiKeysService(db)

  async function authenticateAgent(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer NEURAX_AGENT_')) {
      return reply.status(401).send({ error: 'API Key requerida' })
    }
    const key = authHeader.slice(7)
    const agentUser = await apiKeysService.autenticarAgente(key)
    if (!agentUser) return reply.status(401).send({ error: 'API Key inválida o revocada' })
    ;(request as any).agentUser = agentUser
  }

  fastify.get('/events', { preHandler: authenticateAgent }, async (req, reply) => {
    const { userId } = (req as any).agentUser
    const { fecha, inicio, fin } = req.query as Record<string, string>
    if (inicio && fin) {
      return reply.send(await service.obtenerEventosPorRango(userId, new Date(inicio), new Date(fin)))
    }
    const fechaTarget = fecha ?? new Date().toISOString().slice(0, 10)
    return reply.send(await service.obtenerEventosDelDia(userId, fechaTarget))
  })

  fastify.post('/events', { preHandler: authenticateAgent }, async (req, reply) => {
    const { userId } = (req as any).agentUser
    try {
      const data = CrearEventoSchema.parse(req.body)
      const evento = await service.crearEvento(userId, data)
      return reply.status(201).send(evento)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.put('/events/:id', { preHandler: authenticateAgent }, async (req, reply) => {
    const { userId } = (req as any).agentUser
    const { id } = req.params as { id: string }
    try {
      const data = CrearEventoSchema.partial().parse(req.body)
      const updated = await service.actualizarEvento(userId, id, data)
      return reply.send(updated)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.delete('/events/:id', { preHandler: authenticateAgent }, async (req, reply) => {
    const { userId } = (req as any).agentUser
    const { id } = req.params as { id: string }
    try {
      await service.eliminarEvento(userId, id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/availability', { preHandler: authenticateAgent }, async (req, reply) => {
    const { userId } = (req as any).agentUser
    const { fecha } = req.query as Record<string, string>
    const fechaTarget = fecha ?? new Date().toISOString().slice(0, 10)
    return reply.send(await service.obtenerDisponibilidad(userId, fechaTarget))
  })
}

export { cronosExternalPlugin }
export default cronosPlugin
