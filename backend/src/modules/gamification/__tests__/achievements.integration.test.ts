import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db } from '../../../db/index'
import { usuarios, usuario_achievements, actividades, rachas } from '../../../db/schema'
import { makeLogrosService } from '../logros.service'
import { makeRachaService } from '../racha.service'
import { makeXpService } from '../xp.service'
import { ACHIEVEMENTS_CATALOG } from '../achievements.catalog'

const EMAIL = `ach-${Date.now()}@neurax-test.com`
const PASSWORD = 'Test1234'

let app: FastifyInstance
let accessToken: string
let userId: string

async function post(url: string, body: object, headers: Record<string, string> = {}) {
  return app.inject({
    method: 'POST', url,
    headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'mobile', ...headers },
    body: JSON.stringify(body),
  })
}

async function get(url: string, headers: Record<string, string> = {}) {
  return app.inject({ method: 'GET', url, headers })
}

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))

  const res = await post('/api/auth/register', { nombre: 'Ach User', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD })
  const body = res.json()
  accessToken = body.access_token
  userId = body.user.id
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await app.close()
})

describe('Inicialización de logros', () => {
  it('registro crea exactamente 17 logros con progreso=0', async () => {
    const logros = await db.select().from(usuario_achievements).where(eq(usuario_achievements.usuario_id, userId))
    expect(logros).toHaveLength(17)
    expect(logros.every(l => l.progreso === 0)).toBe(true)
    expect(logros.every(l => !l.desbloqueado)).toBe(true)
    expect(logros.every(l => l.tipo === 'sistema')).toBe(true)
  })

  it('todos los 17 IDs del catálogo están presentes', async () => {
    const logros = await db.select({ aid: usuario_achievements.achievement_id }).from(usuario_achievements)
      .where(eq(usuario_achievements.usuario_id, userId))
    const ids = new Set(logros.map(l => l.aid))
    for (const a of ACHIEVEMENTS_CATALOG) {
      expect(ids.has(a.id)).toBe(true)
    }
  })
})

describe('GET /api/gamification/achievements', () => {
  it('devuelve 17 logros sin filtro', async () => {
    const res = await get('/api/gamification/achievements', { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(17)
    expect(res.json().total).toBe(17)
  })

  it('tab=desbloqueados devuelve 0 inicialmente', async () => {
    const res = await get('/api/gamification/achievements?tab=desbloqueados', { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(0)
  })

  it('tab=manuales devuelve 0 inicialmente', async () => {
    const res = await get('/api/gamification/achievements?tab=manuales', { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(0)
  })
})

describe('Idempotencia de verificarLogros', () => {
  it('llamar verificarLogros 3 veces sin actividades no otorga XP', async () => {
    const rachaService = makeRachaService(db)
    const logrosService = makeLogrosService(db, rachaService, async () => {})

    await logrosService.verificarLogros(userId)
    await logrosService.verificarLogros(userId)
    await logrosService.verificarLogros(userId)

    const [user] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(user.xp_total).toBe(0)
  })
})

// Insertar actividad con racha=0 garantiza bonus_racha=1.0 → XP exacto del catálogo
describe('Desbloqueo de logros por criterio', () => {
  it('primera actividad desbloquea first_step con 25 XP exactos (racha=0, bonus=1.0)', async () => {
    // timestamp fijo a mediodía UTC: evita disparar early_bird (<7AM) o night_owl (>=11PM),
    // garantizando que solo first_step se desbloquee con esta primera actividad
    await db.insert(actividades).values({
      usuario_id: userId,
      tipo: 'estudio',
      area: 'intelectuales',
      duracion_minutos: 30,
      xp_base: 30,
      xp_generado: 30,
      timestamp: new Date('2026-06-15T12:00:00Z'),
    })

    const [before] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))

    const { logrosService } = makeXpService(db)
    await logrosService.verificarLogros(userId)

    const [logro] = await db.select().from(usuario_achievements)
      .where(and(eq(usuario_achievements.usuario_id, userId), eq(usuario_achievements.achievement_id, 'first_step')))
    expect(logro.desbloqueado).toBe(true)
    expect(logro.xp_otorgado).toBe(25)

    const [after] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(after.xp_total).toBe(before.xp_total + 25)
  })

  it('verificarLogros 3 veces después de desbloquear first_step no duplica XP (idempotencia post-desbloqueo)', async () => {
    const [before] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))

    const { logrosService } = makeXpService(db)
    await logrosService.verificarLogros(userId)
    await logrosService.verificarLogros(userId)
    await logrosService.verificarLogros(userId)

    const [after] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(after.xp_total).toBe(before.xp_total)
  })
})

// Hitos van antes de insertar rachas para que bonus_racha=1.0 → XP exacto del hito
describe('Hitos manuales', () => {
  let hitoId: string

  it('POST /achievements/hito crea un hito manual', async () => {
    const res = await post('/api/gamification/achievements/hito',
      { nombre: 'Mi Hito', descripcion: 'Test', xp: 500 },
      { Authorization: `Bearer ${accessToken}` },
    )
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.tipo).toBe('manual')
    expect(body.desbloqueado).toBe(false)
    hitoId = body.id
  })

  it('POST /achievements/:id/complete completa el hito y otorga XP exacto', async () => {
    const [before] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))

    const res = await post(`/api/gamification/achievements/${hitoId}/complete`, {}, { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(200)

    const [after] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(after.xp_total).toBe(before.xp_total + 500)
  })

  it('completar el mismo hito dos veces → 409', async () => {
    const [before] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))

    const res = await post(`/api/gamification/achievements/${hitoId}/complete`, {}, { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(409)

    const [after] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(after.xp_total).toBe(before.xp_total)
  })
})

// Racha insertada al final para no afectar bonus de tests anteriores
describe('Desbloqueo consistent_7', () => {
  it('racha de 7 días desbloquea consistent_7 (xp_otorgado=100 en catálogo)', async () => {
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i)
      const fecha = d.toISOString().slice(0, 10)
      await db.insert(rachas)
        .values({ usuario_id: userId, fecha, tiene_actividad: true })
        .onConflictDoUpdate({ target: [rachas.usuario_id, rachas.fecha], set: { tiene_actividad: true } })
    }

    const [before] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))

    const { logrosService } = makeXpService(db)
    await logrosService.verificarLogros(userId)

    const [logro] = await db.select().from(usuario_achievements)
      .where(and(eq(usuario_achievements.usuario_id, userId), eq(usuario_achievements.achievement_id, 'consistent_7')))
    expect(logro.desbloqueado).toBe(true)
    // xp_otorgado almacena el valor del catálogo (100), el XP real lleva bonus de racha
    expect(logro.xp_otorgado).toBe(100)

    const [after] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    // consistent_3 también se desbloquea; el XP real > 100 por bonus de racha
    expect(after.xp_total).toBeGreaterThan(before.xp_total)
  })
})
