import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { usuario_achievements } from '../../db/schema/index.js'
import { getCatalogEntry } from '../gamification/achievements.catalog.js'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const logrosPlugin: FastifyPluginAsync = async (fastify) => {
  // GET /api/logros
  fastify.get('/', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any

    const rows = await db
      .select()
      .from(usuario_achievements)
      .where(eq(usuario_achievements.usuario_id, userId))

    const logros = rows.map((r) => {
      const catalogo = getCatalogEntry(r.achievement_id)
      return {
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion ?? '',
        xp_otorgado: r.desbloqueado ? r.xp_otorgado : (catalogo?.xp ?? 0),
        desbloqueado: r.desbloqueado,
        progreso_actual: r.progreso,
        progreso_objetivo: r.total,
        fecha_desbloqueado: r.desbloqueado_at,
        categoria: catalogo?.criterio_tipo ?? 'sistema',
      }
    })

    return reply.send(logros)
  })
}

export default logrosPlugin
