import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { makeKuberaService } from './kubera.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CrearProductoSchema = z.object({
  nombre: z.string().min(1).max(500),
  categoria: z.string().max(100).optional(),
  descripcion: z.string().optional(),
  precio_estimado: z.number().positive().optional(),
  moneda: z.string().max(10).optional(),
  url: z.string().url().optional(),
})

const ActualizarProductoSchema = CrearProductoSchema.partial().extend({
  estado: z.enum(['pendiente', 'listo_para_adquirir', 'adquirido']).optional(),
})

const FondoDemeterSchema = z.object({
  activo: z.boolean(),
})

const kuberaPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeKuberaService(db)

  fastify.get('/productos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    return reply.send(await service.listarProductos(userId))
  })

  fastify.post('/productos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = CrearProductoSchema.parse(req.body)
      const producto = await service.crearProducto(userId, data)
      return reply.status(201).send(producto)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.put('/productos/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const data = ActualizarProductoSchema.parse(req.body)
      const producto = await service.actualizarProducto(userId, id, data)
      return reply.send(producto)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.patch('/productos/:id/fondo-demeter', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const { activo } = FondoDemeterSchema.parse(req.body)
      const producto = await service.toggleFondoDemeter(userId, id, activo)
      return reply.send(producto)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.delete('/productos/:id', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      await service.eliminarProducto(userId, id)
      return reply.status(204).send()
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })
}

export default kuberaPlugin
