import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../db/index'
import { prodigy_cursos } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { makeProdigyService } from './prodigy.service'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const CrearCursoSchema = z.object({
  titulo: z.string().min(1).max(500),
  plataforma: z.string().max(100).optional(),
  instructor: z.string().max(255).optional(),
  categoria: z.string().max(100).optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe ser YYYY-MM-DD'),
  total_horas: z.number().positive(),
})

const prodigyPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeProdigyService(db)

  fastify.post('/cursos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const data = CrearCursoSchema.parse(req.body)
      const [curso] = await db.insert(prodigy_cursos).values({
        usuario_id: userId,
        titulo: data.titulo,
        plataforma: data.plataforma ?? null,
        instructor: data.instructor ?? null,
        categoria: data.categoria ?? null,
        fecha_fin: data.fecha_fin,
        total_horas: String(data.total_horas),
      }).returning()
      return reply.status(201).send(curso)
    } catch (err: any) {
      if (err?.name === 'ZodError') return reply.status(400).send({ error: err.errors })
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.post('/cursos/:id/generar-horario', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      const result = await service.generarHorario(userId, id)
      return reply.send(result)
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })

  fastify.get('/cursos', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const cursos = await db.select().from(prodigy_cursos).where(eq(prodigy_cursos.usuario_id, userId))
    return reply.send(cursos)
  })
}

export default prodigyPlugin
