import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db, client } from '../../../db/index'
import { usuarios, usuario_achievements } from '../../../db/schema'
import { makeLogrosService } from '../logros.service'
import { makeRachaService } from '../racha.service'
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

describe('Hitos manuales', () => {
  let hitoId: string

  it('POST /achievements/hito crea un hito manual', async () => {
    const res = await post('/api/gamification/achievements/hito',
      { nombre: 'Mi Hito', descripcion: 'Test', xp: 100 },
      { Authorization: `Bearer ${accessToken}` },
    )
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.tipo).toBe('manual')
    expect(body.desbloqueado).toBe(false)
    hitoId = body.id
  })

  it('POST /achievements/:id/complete completa el hito y otorga XP exacto', async () => {
    const res = await post(`/api/gamification/achievements/${hitoId}/complete`, {}, { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(200)

    const [user] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(user.xp_total).toBe(100)
  })

  it('completar el mismo hito dos veces → 409', async () => {
    const res = await post(`/api/gamification/achievements/${hitoId}/complete`, {}, { Authorization: `Bearer ${accessToken}` })
    expect(res.statusCode).toBe(409)

    // XP no se duplicó
    const [user] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(user.xp_total).toBe(100)
  })
})
