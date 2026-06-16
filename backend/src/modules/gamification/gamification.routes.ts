import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { eq, desc, sql, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index'
import { usuarios, xp_events, usuario_achievements } from '../../db/schema'
import { calcularBonusRacha } from '../../shared/xp.utils'
import { makeRachaService } from './racha.service'
import { makeXpService } from './xp.service'
import { makeLogrosService } from './logros.service'
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

const VALID_TABS = ['todos', 'desbloqueados', 'en_progreso', 'manuales'] as const

const HitoSchema = z.object({
  nombre: z.string().min(2).max(255),
  descripcion: z.string().max(500).optional(),
  xp: z.number().int().min(1).max(500),
  icono: z.string().max(255).optional(),
})

const gamificationPlugin: FastifyPluginAsync = async (fastify) => {
  const rachaService = makeRachaService(db)
  const xpService = makeXpService(db)
  const logrosService = makeLogrosService(db, rachaService, xpService.otorgarXP)

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
      db.select({ id: xp_events.id, fuente: xp_events.fuente, xp_amount: xp_events.xp_amount, xp_base: xp_events.xp_base, bonus_racha: xp_events.bonus_racha, bonus_horario: xp_events.bonus_horario, created_at: xp_events.created_at })
        .from(xp_events).where(eq(xp_events.usuario_id, userId)).orderBy(desc(xp_events.created_at)).limit(l).offset(offset),
      db.select({ total: sql<number>`count(*)` }).from(xp_events).where(eq(xp_events.usuario_id, userId)),
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

    const truncSql = periodo === 'week'
      ? sql`date_trunc('week', ${xp_events.created_at})`
      : periodo === 'month'
        ? sql`date_trunc('month', ${xp_events.created_at})`
        : sql`date_trunc('year', ${xp_events.created_at})`

    const rows = await db.select({
      periodo: truncSql.as('periodo'),
      xp_total: sql<number>`sum(${xp_events.xp_amount})`.as('xp_total'),
      eventos: sql<number>`count(*)`.as('eventos'),
    }).from(xp_events).where(eq(xp_events.usuario_id, userId)).groupBy(truncSql).orderBy(desc(truncSql)).limit(12)

    return reply.send({ data: rows })
  })

  // GET /api/gamification/achievements?tab=todos
  fastify.get('/achievements', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { tab = 'todos' } = req.query as Record<string, string>

    if (!VALID_TABS.includes(tab as typeof VALID_TABS[number])) {
      return reply.status(400).send({ error: 'tab inválido' })
    }

    const conditions = [eq(usuario_achievements.usuario_id, userId)]
    if (tab === 'desbloqueados') conditions.push(eq(usuario_achievements.desbloqueado, true))
    if (tab === 'en_progreso') conditions.push(eq(usuario_achievements.desbloqueado, false))
    if (tab === 'manuales') conditions.push(eq(usuario_achievements.tipo, 'manual'))

    const rows = await db.select().from(usuario_achievements)
      .where(and(...conditions))
      .orderBy(desc(usuario_achievements.desbloqueado), desc(usuario_achievements.created_at))

    return reply.send({ data: rows, total: rows.length })
  })

  // POST /api/gamification/achievements/hito
  fastify.post('/achievements/hito', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    try {
      const body = HitoSchema.parse(req.body)
      const hito = await logrosService.crearHitoManual(userId, body)
      return reply.status(201).send(hito)
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 400).send({ error: err.message })
    }
  })

  // POST /api/gamification/achievements/:id/complete
  fastify.post('/achievements/:id/complete', { preHandler: requireAccess }, async (req, reply) => {
    const { userId } = req.user as any
    const { id } = req.params as { id: string }
    try {
      await logrosService.completarHito(userId, id)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(err?.statusCode ?? 500).send({ error: err.message })
    }
  })
}

export default gamificationPlugin
