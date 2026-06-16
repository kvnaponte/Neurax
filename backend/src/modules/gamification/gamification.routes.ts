import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { eq, desc, sql, and, gte } from 'drizzle-orm'
import { db } from '../../db/index'
import { usuarios, xp_events } from '../../db/schema'
import { calcularBonusRacha } from '../../shared/xp.utils'
import { makeRachaService } from './racha.service'
import { getNivelInfo, getXpParaSiguienteNivel, getPorcentajeNivel } from './gamification.constants'

async function requireAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if ((request.user as any).type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const VALID_PERIODOS = ['week', 'month', 'year'] as const
type Periodo = typeof VALID_PERIODOS[number]

const gamificationPlugin: FastifyPluginAsync = async (fastify) => {
  const rachaService = makeRachaService(db)

  // GET /api/gamification/status
  fastify.get('/status', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any

    const [userRow] = await db
      .select({ xp_total: usuarios.xp_total, nivel: usuarios.nivel })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    if (!userRow) return reply.status(404).send({ error: 'Usuario no encontrado' })

    const [rachaActual, mejorRacha] = await Promise.all([
      rachaService.calcularRachaActual(userId),
      rachaService.calcularMejorRacha(userId),
    ])

    const nivelInfo = getNivelInfo(userRow.nivel)

    return reply.send({
      xp_total: userRow.xp_total,
      nivel: userRow.nivel,
      nombre_nivel: nivelInfo.nombre,
      color_nivel: nivelInfo.color,
      racha_actual: rachaActual,
      mejor_racha: mejorRacha,
      bonus_racha_actual: calcularBonusRacha(rachaActual),
      xp_para_siguiente_nivel: getXpParaSiguienteNivel(userRow.nivel, userRow.xp_total),
      porcentaje_nivel: getPorcentajeNivel(userRow.nivel, userRow.xp_total),
    })
  })

  // GET /api/gamification/history?page=1&limit=20
  fastify.get('/history', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { page = '1', limit = '20' } = req.query as Record<string, string>
    const p = Math.max(1, parseInt(page))
    const l = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (p - 1) * l

    const [events, countRow] = await Promise.all([
      db.select({
        id: xp_events.id,
        fuente: xp_events.fuente,
        xp_amount: xp_events.xp_amount,
        xp_base: xp_events.xp_base,
        bonus_racha: xp_events.bonus_racha,
        bonus_horario: xp_events.bonus_horario,
        created_at: xp_events.created_at,
      })
        .from(xp_events)
        .where(eq(xp_events.usuario_id, userId))
        .orderBy(desc(xp_events.created_at))
        .limit(l)
        .offset(offset),
      db.select({ total: sql<number>`count(*)` })
        .from(xp_events)
        .where(eq(xp_events.usuario_id, userId)),
    ])

    return reply.send({ data: events, total: Number(countRow[0].total), page: p, limit: l })
  })

  // GET /api/gamification/leaderboard/personal?periodo=month
  fastify.get('/leaderboard/personal', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { periodo = 'month' } = req.query as Record<string, string>

    if (!VALID_PERIODOS.includes(periodo as Periodo)) {
      return reply.status(400).send({ error: 'periodo debe ser week, month o year' })
    }

    const truncSql =
      periodo === 'week'
        ? sql`date_trunc('week', ${xp_events.created_at})`
        : periodo === 'month'
          ? sql`date_trunc('month', ${xp_events.created_at})`
          : sql`date_trunc('year', ${xp_events.created_at})`

    const rows = await db
      .select({
        periodo: truncSql.as('periodo'),
        xp_total: sql<number>`sum(${xp_events.xp_amount})`.as('xp_total'),
        eventos: sql<number>`count(*)`.as('eventos'),
      })
      .from(xp_events)
      .where(eq(xp_events.usuario_id, userId))
      .groupBy(truncSql)
      .orderBy(desc(truncSql))
      .limit(12)

    return reply.send({ data: rows })
  })
}

export default gamificationPlugin
