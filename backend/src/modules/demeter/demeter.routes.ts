import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { makeDemeterService } from './demeter.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CategoriaSchema = z.object({
  nombre: z.string().min(1),
  porcentaje: z.number().positive(),
})

const FondoEspecialSchema = z.object({
  nombre: z.string().min(1),
  objetivo: z.number().positive(),
  porcentaje_asignacion: z.number().min(0),
})

const PresupuestoSchema = z.object({
  ingreso_esperado: z.number().positive(),
  gastos_fijos: z.number().min(0),
  categorias: z.array(CategoriaSchema).optional(),
  fondos_especiales: z.array(FondoEspecialSchema).optional(),
})

const MovimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso', 'inversion', 'transferencia']),
  monto: z.number().positive(),
  moneda: z.string().max(10).optional(),
  categoria: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
  metodo_pago: z.string().max(100).optional(),
  es_recurrente: z.boolean().optional(),
  frecuencia_recurrente: z.enum(['semanal', 'quincenal', 'mensual', 'anual']).optional(),
  fecha_movimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

const demeterPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeDemeterService(db)

  fastify.get('/status', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const ahora = new Date()
    const estado = await service.obtenerEstadoPresupuesto(userId, ahora.getUTCFullYear(), ahora.getUTCMonth() + 1)
    if (!estado) return reply.status(404).send({ error: 'No hay presupuesto configurado para este mes' })
    return reply.send(estado)
  })

  fastify.get('/status/:año/:mes', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { año, mes } = req.params as Record<string, string>
    const estado = await service.obtenerEstadoPresupuesto(userId, parseInt(año), parseInt(mes))
    if (!estado) return reply.status(404).send({ error: 'No hay presupuesto configurado para este período' })
    return reply.send(estado)
  })

  fastify.post('/presupuesto', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = PresupuestoSchema.parse(req.body)
      const ahora = new Date()
      const result = await service.configurarPresupuesto(userId, ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, data)
      return reply.status(201).send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.put('/presupuesto/:año/:mes', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { año, mes } = req.params as Record<string, string>
    try {
      const data = PresupuestoSchema.parse(req.body)
      const result = await service.configurarPresupuesto(userId, parseInt(año), parseInt(mes), data)
      return reply.send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.post('/movimientos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = MovimientoSchema.parse(req.body)
      const result = await service.registrarMovimiento(userId, data)
      return reply.status(201).send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/movimientos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { limit = '20', offset = '0', tipo, categoria, desde, hasta } = req.query as Record<string, string>
    const movimientos = await service.obtenerHistorialMovimientos(
      userId,
      Math.min(100, parseInt(limit)),
      parseInt(offset),
      { tipo, categoria, desde, hasta }
    )
    return reply.send(movimientos)
  })

  fastify.get('/estadisticas', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.obtenerEstadisticas(userId))
  })

  fastify.get('/fondos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const ahora = new Date()
    const estado = await service.obtenerEstadoPresupuesto(userId, ahora.getUTCFullYear(), ahora.getUTCMonth() + 1)
    if (!estado) return reply.status(404).send({ error: 'No hay presupuesto configurado para este mes' })
    return reply.send(estado.fondos_especiales)
  })

  fastify.post('/revisar', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.revisarPresupuesto(userId))
  })
}

export default demeterPlugin
