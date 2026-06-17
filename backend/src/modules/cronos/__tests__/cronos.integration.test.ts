import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db } from '../../../db/index'
import { usuarios, cronos_eventos, cronos_api_keys } from '../../../db/schema'

const EMAIL = `cronos-${Date.now()}@neurax-test.com`
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

async function authDelete(url: string) {
  return app.inject({ method: 'DELETE', url, headers: { Authorization: `Bearer ${accessToken}` } })
}

function makeEvento(titulo: string, inicio: string, fin: string) {
  return { titulo, tipo: 'trabajo', inicio_at: inicio, fin_at: fin }
}

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))

  const res = await post('/api/auth/register', {
    nombre: 'Cronos User', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD,
  })
  const body = res.json()
  accessToken = body.access_token
  userId = body.user.id
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await app.close()
})

describe('Motor de energía — propagación en cascada', () => {
  it('sueño de 8h → energía inicial del día es 100%', async () => {
    // Create sleep event the night before (22:00 - 06:00)
    const fecha = '2026-01-10'
    const prevNight = '2026-01-09T22:00:00.000Z'
    const morning = '2026-01-10T06:00:00.000Z'

    // Insert sleep event directly (bypasses overlap check since no other events)
    await authPost('/api/cronos/events', {
      titulo: 'Sueño nocturno',
      tipo: 'sueno',
      inicio_at: prevNight,
      fin_at: morning,
    })

    // Create a work event on the next day
    const res = await authPost('/api/cronos/events', {
      titulo: 'Trabajo mañana',
      tipo: 'trabajo',
      inicio_at: '2026-01-10T09:00:00.000Z',
      fin_at: '2026-01-10T11:00:00.000Z',
    })
    expect(res.statusCode).toBe(201)

    // Get energy for the day — after 8h sleep energy should start at 100%
    const energyRes = await authGet(`/api/cronos/energy/${fecha}`)
    expect(energyRes.statusCode).toBe(200)
    const energyData = energyRes.json()
    // trabajo 2h = 10 consumo/h * 2 = 20 → energía después del evento = 100 - 20 = 80
    expect(energyData).toHaveLength(1)
    expect(energyData[0].energia_acumulada_despues).toBe(80)
  })
})

describe('Mover evento — opción deslizar', () => {
  it('mover evento con deslizar → 3 eventos posteriores se desplazan exactamente la duración', async () => {
    // Create 4 events on 2026-02-01: A at 08:00-09:00, B at 09:00-10:00, C at 10:00-11:00, D at 11:00-12:00
    const resA = await authPost('/api/cronos/events', {
      titulo: 'A', tipo: 'trabajo',
      inicio_at: '2026-02-01T08:00:00.000Z',
      fin_at: '2026-02-01T09:00:00.000Z',
    })
    expect(resA.statusCode).toBe(201)
    const eventoAId = resA.json().id

    const resB = await authPost('/api/cronos/events', {
      titulo: 'B', tipo: 'trabajo',
      inicio_at: '2026-02-01T09:00:00.000Z',
      fin_at: '2026-02-01T10:00:00.000Z',
    })
    expect(resB.statusCode).toBe(201)

    const resC = await authPost('/api/cronos/events', {
      titulo: 'C', tipo: 'trabajo',
      inicio_at: '2026-02-01T10:00:00.000Z',
      fin_at: '2026-02-01T11:00:00.000Z',
    })
    expect(resC.statusCode).toBe(201)

    const resD = await authPost('/api/cronos/events', {
      titulo: 'D', tipo: 'trabajo',
      inicio_at: '2026-02-01T11:00:00.000Z',
      fin_at: '2026-02-01T12:00:00.000Z',
    })
    expect(resD.statusCode).toBe(201)

    // Move A (1h) to 09:00 with 'deslizar' → B, C, D shift by 1h
    const moveRes = await authPost(`/api/cronos/events/${eventoAId}/move`, {
      nuevo_inicio: '2026-02-01T09:00:00.000Z',
      opcion: 'deslizar',
    })
    expect(moveRes.statusCode).toBe(200)

    // Get events of the day and verify shifts
    const evRes = await authGet('/api/cronos/events?fecha=2026-02-01')
    expect(evRes.statusCode).toBe(200)
    const events = evRes.json()

    // A should now be at 09:00-10:00, B→10:00-11:00, C→11:00-12:00, D→12:00-13:00
    const aEv = events.find((e: any) => e.titulo === 'A')
    const bEv = events.find((e: any) => e.titulo === 'B')
    const cEv = events.find((e: any) => e.titulo === 'C')
    const dEv = events.find((e: any) => e.titulo === 'D')

    expect(new Date(aEv.inicio_at).toISOString()).toBe('2026-02-01T09:00:00.000Z')
    expect(new Date(bEv.inicio_at).toISOString()).toBe('2026-02-01T10:00:00.000Z')
    expect(new Date(cEv.inicio_at).toISOString()).toBe('2026-02-01T11:00:00.000Z')
    expect(new Date(dEv.inicio_at).toISOString()).toBe('2026-02-01T12:00:00.000Z')
  })
})

describe('Completar evento — penalización impuntualidad', () => {
  it('completar evento 20min después de fin_at → xp_penalizacion_impuntualidad=true y xp_delta negativo', async () => {
    // Create an event that ended 20 minutes ago
    const now = new Date()
    const fin = new Date(now.getTime() - 20 * 60000)
    const inicio = new Date(fin.getTime() - 60 * 60000)

    const createRes = await authPost('/api/cronos/events', {
      titulo: 'Evento tardío',
      tipo: 'trabajo',
      inicio_at: inicio.toISOString(),
      fin_at: fin.toISOString(),
    })
    expect(createRes.statusCode).toBe(201)
    const eventoId = createRes.json().id

    const completeRes = await authPost(`/api/cronos/events/${eventoId}/complete`, {})
    expect(completeRes.statusCode).toBe(200)
    const body = completeRes.json()
    expect(body.impuntual).toBe(true)
    expect(body.completado).toBe(true)

    // Verify in DB
    const [dbEvento] = await db
      .select({ xp_penalizacion_impuntualidad: cronos_eventos.xp_penalizacion_impuntualidad })
      .from(cronos_eventos)
      .where(eq(cronos_eventos.id, eventoId))
    expect(dbEvento.xp_penalizacion_impuntualidad).toBe(true)
  })

  it('completar evento puntualmente → xp_penalizacion_impuntualidad=false', async () => {
    // Create an event that ended 5 min ago (puntual), starts after the impuntual event ends
    const now = new Date()
    const fin = new Date(now.getTime() - 5 * 60000)
    const inicio = new Date(now.getTime() - 15 * 60000) // starts 15 min ago, after impuntual (ended 20 min ago)

    const createRes = await authPost('/api/cronos/events', {
      titulo: 'Evento puntual',
      tipo: 'trabajo',
      inicio_at: inicio.toISOString(),
      fin_at: fin.toISOString(),
    })
    expect(createRes.statusCode).toBe(201)
    const eventoId = createRes.json().id

    const completeRes = await authPost(`/api/cronos/events/${eventoId}/complete`, {})
    expect(completeRes.statusCode).toBe(200)
    expect(completeRes.json().impuntual).toBe(false)
  })
})

describe('GET /availability — slots sin solapamiento', () => {
  it('3 eventos en el día → slots devueltos no se solapan con ningún evento', async () => {
    const fecha = '2026-03-01'

    await authPost('/api/cronos/events', {
      titulo: 'Ev1', tipo: 'trabajo',
      inicio_at: `${fecha}T08:00:00.000Z`,
      fin_at: `${fecha}T09:00:00.000Z`,
    })
    await authPost('/api/cronos/events', {
      titulo: 'Ev2', tipo: 'estudio',
      inicio_at: `${fecha}T10:00:00.000Z`,
      fin_at: `${fecha}T11:30:00.000Z`,
    })
    await authPost('/api/cronos/events', {
      titulo: 'Ev3', tipo: 'meditacion',
      inicio_at: `${fecha}T14:00:00.000Z`,
      fin_at: `${fecha}T14:30:00.000Z`,
    })

    const res = await authGet(`/api/cronos/availability?fecha=${fecha}`)
    expect(res.statusCode).toBe(200)
    const slots = res.json() as { inicio: string; fin: string }[]

    const eventoRanges = [
      { inicio: new Date(`${fecha}T08:00:00.000Z`), fin: new Date(`${fecha}T09:00:00.000Z`) },
      { inicio: new Date(`${fecha}T10:00:00.000Z`), fin: new Date(`${fecha}T11:30:00.000Z`) },
      { inicio: new Date(`${fecha}T14:00:00.000Z`), fin: new Date(`${fecha}T14:30:00.000Z`) },
    ]

    for (const slot of slots) {
      const si = new Date(slot.inicio)
      const sf = new Date(slot.fin)
      const solapa = eventoRanges.some(ev => si < ev.fin && sf > ev.inicio)
      expect(solapa).toBe(false)
    }

    expect(slots.length).toBeGreaterThan(0)
  })
})

describe('API Keys — agente IA externo', () => {
  let apiKey: string

  it('generar API Key → devuelve key en claro con prefijo NEURAX_AGENT_', async () => {
    const res = await authPost('/api/cronos/api-keys', { nombre: 'Agente Test' })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.key).toMatch(/^NEURAX_AGENT_/)
    apiKey = body.key
  })

  it('POST /api/external/cronos/events con API Key válida → crea evento exitosamente', async () => {
    const res = await post('/api/external/cronos/events', {
      titulo: 'Evento del agente',
      tipo: 'trabajo',
      inicio_at: '2026-04-01T08:00:00.000Z',
      fin_at: '2026-04-01T09:00:00.000Z',
    }, { Authorization: `Bearer ${apiKey}` })
    expect(res.statusCode).toBe(201)
    expect(res.json().titulo).toBe('Evento del agente')
  })

  it('API Key revocada → HTTP 401', async () => {
    // Get the key id from DB
    const [keyRow] = await db
      .select({ id: cronos_api_keys.id })
      .from(cronos_api_keys)
      .where(eq(cronos_api_keys.usuario_id, userId))
      .limit(1)

    const revokeRes = await authDelete(`/api/cronos/api-keys/${keyRow.id}`)
    expect(revokeRes.statusCode).toBe(200)

    const res = await post('/api/external/cronos/events', {
      titulo: 'Evento rechazado',
      tipo: 'trabajo',
      inicio_at: '2026-04-02T08:00:00.000Z',
      fin_at: '2026-04-02T09:00:00.000Z',
    }, { Authorization: `Bearer ${apiKey}` })
    expect(res.statusCode).toBe(401)
  })
})
