import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq, and, notInArray } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db } from '../../../db/index'
import { usuarios, odin_misiones_catalogo, odin_misiones_usuario, odin_cofres } from '../../../db/schema'
import { makeOdinService } from '../odin.service'
import { resetCatalogCache, CATALOG } from '../odin.catalog'

const EMAIL = `odin-${Date.now()}@neurax-test.com`
const PASSWORD = 'Test1234'

let app: FastifyInstance
let accessToken: string
let userId: string

async function post(url: string, body: object, headers: Record<string, string> = {}) {
  return app.inject({
    method: 'POST', url,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

async function authPost(url: string, body: object) {
  return post(url, body, { Authorization: `Bearer ${accessToken}` })
}

async function authGet(url: string) {
  return app.inject({ method: 'GET', url, headers: { Authorization: `Bearer ${accessToken}` } })
}

async function getCatalogId(nombre: string): Promise<string> {
  const [row] = await db.select({ id: odin_misiones_catalogo.id })
    .from(odin_misiones_catalogo)
    .where(eq(odin_misiones_catalogo.nombre, nombre))
    .limit(1)
  if (!row) throw new Error(`Catalog entry '${nombre}' not found in DB`)
  return row.id
}

beforeAll(async () => {
  resetCatalogCache()
  app = await buildApp()
  await app.ready()
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))

  // Remove stale catalog entries that don't match the current CATALOG names
  const expectedNames = CATALOG.map(c => c.nombre)
  const existing = await db.select({ id: odin_misiones_catalogo.id, nombre: odin_misiones_catalogo.nombre })
    .from(odin_misiones_catalogo)
  const stale = existing.filter(r => !expectedNames.includes(r.nombre))
  if (stale.length > 0) {
    await db.delete(odin_misiones_catalogo).where(
      notInArray(odin_misiones_catalogo.nombre, expectedNames)
    )
  }

  const res = await post('/api/auth/register', {
    nombre: 'Odin User', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD,
  })
  const body = res.json()
  accessToken = body.access_token
  userId = body.user.id

  // Seed catalog via the service (ensures catalog table has entries)
  const service = makeOdinService(db)
  await service.generarMisionesDelDia(userId)
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await app.close()
})

describe('generarMisionesDelDia', () => {
  it('genera 4-5 misiones diarias con 1 principal', async () => {
    const res = await authGet('/api/odin/missions')
    expect(res.statusCode).toBe(200)
    const missions = res.json()
    expect(missions.length).toBeGreaterThanOrEqual(4)
    expect(missions.length).toBeLessThanOrEqual(5)
    expect(missions.some((m: any) => m.tipo === 'principal')).toBe(true)
  })

  it('segunda llamada el mismo día → skipped (no duplicados)', async () => {
    const service = makeOdinService(db)
    const result = await service.generarMisionesDelDia(userId)
    expect(result).toHaveProperty('skipped', true)
  })
})

describe('verificarProgresoMisiones — consistency_5 (5 actividades)', () => {
  let misionId: string

  beforeAll(async () => {
    const catalogoId = await getCatalogId('consistency_5')
    const today = new Date().toISOString().slice(0, 10)

    // Limpiar si ya existe (de beforeAll anterior)
    await db.delete(odin_misiones_usuario).where(and(
      eq(odin_misiones_usuario.usuario_id, userId),
      eq(odin_misiones_usuario.catalogo_id, catalogoId),
      eq(odin_misiones_usuario.periodo_inicio, today),
    ))

    const [mision] = await db.insert(odin_misiones_usuario).values({
      usuario_id: userId,
      catalogo_id: catalogoId,
      periodo_tipo: 'diario',
      periodo_inicio: today,
      periodo_fin: today,
      progreso: 0,
      total: 5,
      estado: 'activa',
    }).returning()

    misionId = mision.id
  })

  it('registrar 5 actividades completa la misión consistency_5', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await authPost('/api/actividades', { tipo: 'trabajo', duracion_minutos: 30 })
      expect(res.statusCode).toBe(201)
    }

    const [updated] = await db.select({ estado: odin_misiones_usuario.estado, progreso: odin_misiones_usuario.progreso })
      .from(odin_misiones_usuario)
      .where(eq(odin_misiones_usuario.id, misionId))

    expect(updated.estado).toBe('completada')
    expect(updated.progreso).toBe(5)
  })
})

describe('cofre épico — se desbloquea al completar todas las misiones', () => {
  it('completar única misión del día → cofre abierto con 300-350 XP', async () => {
    const emailAux = `odin-cofre-${Date.now()}@neurax-test.com`
    await post('/api/auth/register', {
      nombre: 'Cofre User', email: emailAux, password: PASSWORD, confirmPassword: PASSWORD,
    })
    const loginRes = await post('/api/auth/login', { email: emailAux, password: PASSWORD })
    const auxToken = loginRes.json().access_token
    const auxUserId = loginRes.json().user.id

    const catalogoId = await getCatalogId('consistency_5')
    const today = new Date().toISOString().slice(0, 10)

    await db.insert(odin_misiones_usuario).values({
      usuario_id: auxUserId,
      catalogo_id: catalogoId,
      periodo_tipo: 'diario',
      periodo_inicio: today,
      periodo_fin: today,
      progreso: 4,
      total: 5,
      estado: 'activa',
    })

    const res = await app.inject({
      method: 'POST', url: '/api/actividades',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auxToken}` },
      body: JSON.stringify({ tipo: 'trabajo', duracion_minutos: 30 }),
    })
    expect(res.statusCode).toBe(201)

    const cofres = await db.select().from(odin_cofres).where(eq(odin_cofres.usuario_id, auxUserId))
    expect(cofres.length).toBe(1)
    expect(cofres[0].xp_otorgado).toBeGreaterThanOrEqual(300)
    expect(cofres[0].xp_otorgado).toBeLessThanOrEqual(350)

    await db.delete(usuarios).where(eq(usuarios.email, emailAux))
  })
})

describe('GET /missions/week — super misión semanal activa', () => {
  it('devuelve la super misión semanal con progreso cuando existe', async () => {
    const catalogoId = await getCatalogId('weekly_streak')
    const now = new Date()
    const day = now.getUTCDay()
    const monday = new Date(now)
    monday.setUTCDate(now.getUTCDate() - (day === 0 ? 6 : day - 1))
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)

    await db.insert(odin_misiones_usuario).values({
      usuario_id: userId,
      catalogo_id: catalogoId,
      periodo_tipo: 'semanal',
      periodo_inicio: monday.toISOString().slice(0, 10),
      periodo_fin: sunday.toISOString().slice(0, 10),
      progreso: 3,
      total: 7,
      estado: 'activa',
    })

    const res = await authGet('/api/odin/missions/week')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).not.toBeNull()
    expect(body.nombre).toBe('weekly_streak')
    expect(body.progreso).toBe(3)
  })
})

describe('Misión personalizada — XP exacto', () => {
  it('crear misión con xp=300 y completarla → recibe exactamente 300 XP', async () => {
    const [before] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))

    const createRes = await authPost('/api/odin/missions/custom', {
      nombre: 'Mi misión especial',
      objetivo_tipo: 'actividades_count',
      objetivo_valor: 1,
      xp_reward: 300,
      frecuencia: 'diaria',
    })
    expect(createRes.statusCode).toBe(201)
    const { mision } = createRes.json()

    const progressRes = await authPost(`/api/odin/missions/${mision.id}/progress`, { delta: 1 })
    expect(progressRes.statusCode).toBe(200)
    expect(progressRes.json().completada).toBe(true)

    const [after] = await db.select({ xp_total: usuarios.xp_total }).from(usuarios).where(eq(usuarios.id, userId))
    expect(Number(after.xp_total)).toBe(Number(before.xp_total) + 300)
  })
})

describe('Misiones del día anterior — expiración', () => {
  it('misiones de ayer se expiran al generar las de hoy', async () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const catalogoId = await getCatalogId('transport_log')
    const [oldMision] = await db.insert(odin_misiones_usuario).values({
      usuario_id: userId,
      catalogo_id: catalogoId,
      periodo_tipo: 'diario',
      periodo_inicio: yesterdayStr,
      periodo_fin: yesterdayStr,
      progreso: 0,
      total: 1,
      estado: 'activa',
    }).returning()

    // Eliminar misiones de hoy para que generarMisionesDelDia no haga skip
    const today = new Date().toISOString().slice(0, 10)
    await db.delete(odin_misiones_usuario).where(and(
      eq(odin_misiones_usuario.usuario_id, userId),
      eq(odin_misiones_usuario.periodo_tipo, 'diario'),
      eq(odin_misiones_usuario.periodo_inicio, today),
    ))

    const service = makeOdinService(db)
    await service.generarMisionesDelDia(userId)

    const [expired] = await db.select({ estado: odin_misiones_usuario.estado })
      .from(odin_misiones_usuario)
      .where(eq(odin_misiones_usuario.id, oldMision.id))
    expect(expired.estado).toBe('expirada')

    // GET /missions solo devuelve las de hoy
    const res = await authGet('/api/odin/missions')
    const missions = res.json() as any[]
    expect(missions.some((m: any) => m.id === oldMision.id)).toBe(false)
  })
})
