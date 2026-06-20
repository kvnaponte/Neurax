import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { makeLeonidasService } from './leonidas.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const EjercicioSchema = z.object({
  nombre: z.string().min(1).max(255),
  grupo: z.string().min(1).max(100),
  series: z.number().int().min(1),
  reps: z.number().int().min(1),
  peso_kg: z.number().positive().optional(),
  notas: z.string().max(500).optional(),
})

const RegistrarSesionSchema = z.object({
  tipo: z.enum(['fuerza', 'cardio', 'barras', 'trote']),
  grupos_trabajados: z.array(z.string().min(1)).min(0),
  duracion_minutos: z.number().int().min(1),
  ejercicios: z.array(EjercicioSchema).optional(),
  intensidad: z.number().int().min(1).max(5).optional(),
  notas: z.string().max(2000).optional(),
  timestamp: z.string().datetime().optional(),
})

const PlanDiaSchema = z.object({
  dia: z.number().int().min(0).max(6),
  tipo: z.string().min(1),
  grupos_planeados: z.array(z.string()),
})

const leonidasPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeLeonidasService(db)

  fastify.get('/today', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const fecha = new Date()
    const motor = await service.obtenerMusculoAsignado(userId, fecha)
    const ejercicios_sugeridos = motor.grupo_asignado
      ? await service.obtenerEjercicios(motor.grupo_asignado)
      : []
    return reply.send({ ...motor, ejercicios_sugeridos })
  })

  fastify.get('/disponibilidad', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerDisponibilidadMuscular(userId))
  })

  fastify.get('/plan', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerPlanSemanal(userId))
  })

  fastify.put('/plan', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const plan = z.array(PlanDiaSchema).parse(req.body)
      return reply.send(await service.actualizarPlanSemanal(userId, plan))
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.post('/sesiones', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = RegistrarSesionSchema.parse(req.body)
      const result = await service.registrarSesion(userId, {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      })
      return reply.status(201).send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/sesiones', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { limit = '20', offset = '0' } = req.query as Record<string, string>
    return reply.send(await service.obtenerHistorialSesiones(userId, Math.min(100, parseInt(limit)), parseInt(offset)))
  })

  fastify.get('/estadisticas', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerEstadisticasSemana(userId))
  })

  fastify.get('/ejercicios', { preHandler: requireAccess }, async (req, reply) => {
    const { grupo } = req.query as Record<string, string>
    return reply.send(await service.obtenerEjercicios(grupo))
  })

  fastify.post('/today/complete', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = RegistrarSesionSchema.parse(req.body)
      const result = await service.registrarSesion(userId, {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      })
      return reply.status(201).send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.post('/sincronizar-cronos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.sincronizarConCronos(userId))
  })
}

export default leonidasPlugin
