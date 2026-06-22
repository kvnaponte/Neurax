import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { dionisio_videos } from '../../db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { makeDionisioService } from './dionisio.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CrearVideoSchema = z.object({
  url: z.string().url(),
  titulo: z.string().max(500).optional(),
  categoria: z.string().max(100).optional(),
  subcategoria: z.string().max(100).optional(),
  fuente: z.string().max(100).optional(),
  nota: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
})

const AccionarSchema = z.object({
  seccion: z.enum(['soberbio', 'michelin', 'odysseia', 'kubera', 'nemesis', 'prodigy', 'proeza', 'leonidas']),
  precio: z.string().optional(),
  pais: z.string().optional(),
  plataforma: z.string().optional(),
  beatmaker: z.string().optional(),
})

const dionisioPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeDionisioService(db)

  fastify.post('/videos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = CrearVideoSchema.parse(req.body)
      const [video] = await db.insert(dionisio_videos).values({
        usuario_id: userId,
        url: data.url,
        titulo: data.titulo ?? null,
        categoria: data.categoria ?? null,
        subcategoria: data.subcategoria ?? null,
        fuente: data.fuente ?? null,
        nota: data.nota ?? null,
        thumbnail_url: data.thumbnail_url ?? null,
      }).returning()
      return reply.status(201).send(video)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.post('/videos/:id/accionar', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const { seccion, ...data } = AccionarSchema.parse(req.body)
      const result = await service.accionarVideo(userId, id, seccion, data)
      return reply.send(result)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/videos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const videos = await db.select().from(dionisio_videos)
      .where(and(eq(dionisio_videos.usuario_id, userId), isNull(dionisio_videos.deleted_at)))
    return reply.send(videos)
  })
}

export default dionisioPlugin
