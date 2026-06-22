import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { proeza_canciones } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { makeProezaService } from './proeza.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CrearCancionSchema = z.object({
  titulo: z.string().min(1).max(500),
  artista: z.string().max(255).optional(),
  genero: z.string().max(100).optional(),
  beatmaker: z.string().max(255).optional(),
})

const FechaObjetivoSchema = z.object({
  fecha_objetivo_lanzamiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe ser YYYY-MM-DD'),
})

const proezaPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeProezaService(db)

  fastify.post('/canciones', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = CrearCancionSchema.parse(req.body)
      const [cancion] = await db.insert(proeza_canciones).values({
        usuario_id: userId,
        titulo: data.titulo,
        artista: data.artista ?? null,
        genero: data.genero ?? null,
        beatmaker: data.beatmaker ?? null,
      }).returning()
      return reply.status(201).send(cancion)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.put('/canciones/:id/fecha-objetivo', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const { fecha_objetivo_lanzamiento } = FechaObjetivoSchema.parse(req.body)
      const result = await service.registrarFechaObjetivo(userId, id, fecha_objetivo_lanzamiento)
      return reply.send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/canciones', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const canciones = await db.select().from(proeza_canciones).where(eq(proeza_canciones.usuario_id, userId))
    return reply.send(canciones)
  })
}

export default proezaPlugin
