import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db } from '../../../db/index'
import { usuarios, actividades, leonidas_sesiones } from '../../../db/schema'

const EMAIL = `act-${Date.now()}@neurax-test.com`
const FECHA_LUNES = new Date('2026-06-23T10:00:00.000Z')
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

async function authPost(url: string, body: object) {
  return post(url, body, { Authorization: `Bearer ${accessToken}` })
}

async function authGet(url: string) {
  return app.inject({ method: 'GET', url, headers: { Authorization: `Bearer ${accessToken}` } })
}

beforeAll(async () => {
  vi.useFakeTimers({ now: FECHA_LUNES })
  app = await buildApp()
  await app.ready()
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))

  const res = await post('/api/auth/register', { nombre: 'Act User', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD })
  const body = res.json()
  accessToken = body.access_token
  userId = body.user.id
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await app.close()
  vi.useRealTimers()
})

describe('POST /api/actividades — cálculo XP base', () => {
  it('sueno ≥345min → xp_base=20', async () => {
    const res = await authPost('/api/actividades', { tipo: 'sueno', duracion_minutos: 480 })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.actividad.xp_base).toBe(20)
  })

  it('sueno <345min → xp_base=10', async () => {
    const res = await authPost('/api/actividades', { tipo: 'sueno', duracion_minutos: 300 })
    expect(res.statusCode).toBe(201)
    expect(res.json().actividad.xp_base).toBe(10)
  })

  it('estudio ≥50min → xp_base=25', async () => {
    const res = await authPost('/api/actividades', { tipo: 'estudio', duracion_minutos: 60 })
    expect(res.statusCode).toBe(201)
    expect(res.json().actividad.xp_base).toBe(25)
  })
})

describe('POST /api/actividades — bonus_horario', () => {
  it('ejercicio_fuerza a las 07:00 UTC → bonus_horario=1.2', async () => {
    const ts = new Date()
    ts.setUTCHours(7, 0, 0, 0)
    const res = await authPost('/api/actividades', {
      tipo: 'ejercicio_fuerza',
      duracion_minutos: 60,
      timestamp: ts.toISOString(),
    })
    expect(res.statusCode).toBe(201)
    expect(parseFloat(res.json().actividad.bonus_horario)).toBe(1.2)
  })

  it('ejercicio_fuerza a las 15:00 UTC → bonus_horario=1.0', async () => {
    const ts = new Date()
    ts.setUTCHours(15, 0, 0, 0)
    const res = await authPost('/api/actividades', {
      tipo: 'ejercicio_fuerza',
      duracion_minutos: 60,
      timestamp: ts.toISOString(),
    })
    expect(res.statusCode).toBe(201)
    expect(parseFloat(res.json().actividad.bonus_horario)).toBe(1.0)
  })

  it('estudio a las 10:00 UTC → bonus_horario=1.2', async () => {
    const ts = new Date()
    ts.setUTCHours(10, 0, 0, 0)
    const res = await authPost('/api/actividades', {
      tipo: 'estudio',
      duracion_minutos: 60,
      timestamp: ts.toISOString(),
    })
    expect(res.statusCode).toBe(201)
    expect(parseFloat(res.json().actividad.bonus_horario)).toBe(1.2)
  })
})

describe('POST /api/actividades — límite diario por área', () => {
  it('área fisicas con 200 XP acumulados → siguiente xp_otorgado=0 y limite_excedido=true', async () => {
    // Insertar directamente 200 XP en fisicas para simular límite alcanzado
    const today = new Date()
    today.setUTCHours(12, 0, 0, 0)
    await db.insert(actividades).values({
      usuario_id: userId,
      tipo: 'ejercicio_fuerza',
      area: 'fisicas',
      duracion_minutos: 90,
      timestamp: today,
      xp_base: 200,
      xp_generado: 200,
      bonus_racha: '1.00',
      bonus_horario: '1.00',
      limite_excedido: false,
    })

    const res = await authPost('/api/actividades', { tipo: 'ejercicio_cardio', duracion_minutos: 30 })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.xp_otorgado).toBe(0)
    expect(body.limite_excedido).toBe(true)
  })
})

describe('POST /api/actividades — validaciones Leonidas (descanso muscular)', () => {
  it('pecho trabajado hace 2h → 422 con mensaje de descanso', async () => {
    // Insertar sesión reciente de pecho en leonidas_sesiones
    const [fakeActividad] = await db.insert(actividades).values({
      usuario_id: userId,
      tipo: 'ejercicio_fuerza',
      area: 'fisicas',
      duracion_minutos: 60,
      xp_base: 15,
      xp_generado: 15,
      bonus_racha: '1.00',
      bonus_horario: '1.00',
    }).returning({ id: actividades.id })

    await db.insert(leonidas_sesiones).values({
      usuario_id: userId,
      actividad_id: fakeActividad.id,
      tipo: 'ejercicio_fuerza',
      grupos_trabajados: ['pecho'],
      duracion_minutos: 60,
      intensidad: 3,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2h
    })

    const res = await authPost('/api/actividades', {
      tipo: 'ejercicio_fuerza',
      duracion_minutos: 60,
      metadata: { grupo_muscular: 'pecho' },
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().error).toMatch(/pecho/)
    expect(res.json().error).toMatch(/descanso/)
  })
})

describe('POST /api/actividades — restricciones sábado', () => {
  const SATURDAY = new Date('2025-01-04T08:00:00Z') // Sábado conocido

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(SATURDAY)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('barras el sábado → 201 exitoso', async () => {
    const res = await authPost('/api/actividades', {
      tipo: 'barras',
      duracion_minutos: 45,
      timestamp: SATURDAY.toISOString(),
    })
    expect(res.statusCode).toBe(201)
  })

  it('ejercicio_fuerza el sábado → 422', async () => {
    const res = await authPost('/api/actividades', {
      tipo: 'ejercicio_fuerza',
      duracion_minutos: 60,
      timestamp: SATURDAY.toISOString(),
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().error).toContain('sábados')
  })

  it('trote el sábado → 201 exitoso', async () => {
    const res = await authPost('/api/actividades', {
      tipo: 'trote',
      duracion_minutos: 40,
      timestamp: SATURDAY.toISOString(),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('Endpoints CRUD', () => {
  let actividadId: string

  it('GET /api/actividades → lista paginada', async () => {
    const res = await authGet('/api/actividades')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('total')
    expect(Array.isArray(body.data)).toBe(true)
    actividadId = body.data[0]?.id
  })

  it('GET /api/actividades/today → actividades del día', async () => {
    const res = await authGet('/api/actividades/today')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('conteos_por_area')
  })

  it('GET /api/actividades/stats → estadísticas por período', async () => {
    const res = await authGet('/api/actividades/stats?periodo=month')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('data')
  })

  it('GET /api/actividades/:id → detalle', async () => {
    if (!actividadId) return
    const res = await authGet(`/api/actividades/${actividadId}`)
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(actividadId)
  })

  it('DELETE /api/actividades/:id → soft delete', async () => {
    if (!actividadId) return
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/actividades/${actividadId}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)

    // Confirmar que ya no aparece en listado
    const getRes = await authGet(`/api/actividades/${actividadId}`)
    expect(getRes.statusCode).toBe(404)
  })
})
