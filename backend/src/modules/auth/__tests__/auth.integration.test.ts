import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db, client } from '../../../db/index'
import { usuarios, auth_logs } from '../../../db/schema'

const EMAIL = `int-${Date.now()}@neurax-test.com`
const EMAIL_WEB = `web-${Date.now()}@neurax-test.com`
const PASSWORD = 'Test1234'
const CORRECT_SECRET = 'no es 2019 es 2024'
const RECOVERY_1 = 'esa es la diferencia entre mi pais y el tuyo'
const RECOVERY_2 = 'eres un hijo de perra'

let app: FastifyInstance
let accessToken: string
let refreshToken: string
let userId: string

async function injectJson(app: FastifyInstance, opts: {
  method: string; url: string; body?: object; headers?: Record<string, string>
}) {
  return app.inject({
    method: opts.method as any,
    url: opts.url,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
}

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  // limpieza previa por si quedaron datos de ejecuciones anteriores
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL_WEB))
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL_WEB))
  await app.close()
})

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('201 mobile — devuelve access_token + refresh_token en body', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'X-Client-Type': 'mobile' },
      body: { nombre: 'Test User', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.access_token).toBeDefined()
    expect(body.refresh_token).toBeDefined()
    expect(body.user.email).toBe(EMAIL)
    accessToken = body.access_token
    refreshToken = body.refresh_token
    userId = body.user.id
  })

  it('201 web — refresh_token en Set-Cookie httpOnly, NO en body', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/register',
      // sin X-Client-Type → comportamiento web
      body: { nombre: 'Web User', email: EMAIL_WEB, password: PASSWORD, confirmPassword: PASSWORD },
    })
    expect(res.statusCode).toBe(201)
    const setCookie = res.headers['set-cookie'] as string | undefined
    expect(setCookie).toBeDefined()
    expect(setCookie).toContain('refresh_token=')
    expect(setCookie).toContain('HttpOnly')
    expect(res.json().refresh_token).toBeUndefined()
  })

  it('409 — email duplicado', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'X-Client-Type': 'mobile' },
      body: { nombre: 'Duplicado', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD },
    })
    expect(res.statusCode).toBe(409)
  })

  it('400 — contraseñas no coinciden', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'X-Client-Type': 'mobile' },
      body: { nombre: 'X', email: 'x@y.com', password: PASSWORD, confirmPassword: 'Otro1234' },
    })
    expect(res.statusCode).toBe(400)
  })
})

// ─── LOGIN ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('200 — devuelve access_token y secret_question', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'X-Client-Type': 'mobile' },
      body: { email: EMAIL, password: PASSWORD },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.access_token).toBeDefined()
    expect(body.secret_question).toBeDefined()
    accessToken = body.access_token
    refreshToken = body.refresh_token
  })

  it('401 — password incorrecta', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'X-Client-Type': 'mobile' },
      body: { email: EMAIL, password: 'WrongPass1' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ─── VERIFY SECRET ──────────────────────────────────────────────────────────

describe('POST /api/auth/verify-secret', () => {
  it('200 — respuesta correcta', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/verify-secret',
      headers: { 'X-Client-Type': 'mobile', Authorization: `Bearer ${accessToken}` },
      body: { answer: CORRECT_SECRET },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().verified).toBe(true)
  })

  it('401 → 401 → 429 "Bloqueado 15 minutos" tras 3 fallos', async () => {
    // login fresco para tener tokens no contaminados
    const login = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'X-Client-Type': 'mobile' },
      body: { email: EMAIL, password: PASSWORD },
    })
    const freshToken = login.json().access_token
    const freshUserId = login.json().user.id

    const r1 = await injectJson(app, {
      method: 'POST', url: '/api/auth/verify-secret',
      headers: { 'X-Client-Type': 'mobile', Authorization: `Bearer ${freshToken}` },
      body: { answer: 'wrong' },
    })
    expect(r1.statusCode).toBe(401)

    const r2 = await injectJson(app, {
      method: 'POST', url: '/api/auth/verify-secret',
      headers: { 'X-Client-Type': 'mobile', Authorization: `Bearer ${freshToken}` },
      body: { answer: 'wrong' },
    })
    expect(r2.statusCode).toBe(401)

    const r3 = await injectJson(app, {
      method: 'POST', url: '/api/auth/verify-secret',
      headers: { 'X-Client-Type': 'mobile', Authorization: `Bearer ${freshToken}` },
      body: { answer: 'wrong' },
    })
    expect(r3.statusCode).toBe(429)
    expect(r3.json().error).toContain('Bloqueado')

    // incluso respuesta correcta → sigue bloqueado
    const r4 = await injectJson(app, {
      method: 'POST', url: '/api/auth/verify-secret',
      headers: { 'X-Client-Type': 'mobile', Authorization: `Bearer ${freshToken}` },
      body: { answer: CORRECT_SECRET },
    })
    expect(r4.statusCode).toBe(429)

    // cleanup del bloqueo para no contaminar otros tests
    await app.redis.del(`auth:secret_blocked:${freshUserId}`)
  })
})

// ─── REFRESH ────────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('200 — rota tokens correctamente', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { 'X-Client-Type': 'mobile' },
      body: { refresh_token: refreshToken },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.access_token).toBeDefined()
    expect(body.refresh_token).toBeDefined()
    // El token anterior queda revocado
    accessToken = body.access_token
    refreshToken = body.refresh_token
  })

  it('401 — token inválido', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { 'X-Client-Type': 'mobile' },
      body: { refresh_token: 'invalid_token_xx' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ─── RECOVER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/recover/*', () => {
  let recoveryToken: string

  it('recover/verify 200 — devuelve recovery_token con respuestas correctas', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/recover/verify',
      body: { userId, answer1: RECOVERY_1, answer2: RECOVERY_2 },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.recovery_token).toBeDefined()
    expect(body.questions).toHaveLength(2)
    recoveryToken = body.recovery_token
  })

  it('recover/verify 401 — respuestas incorrectas', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/recover/verify',
      body: { userId, answer1: 'wrong', answer2: 'wrong' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('recover/reset 200 — cambia contraseña y se puede loguear con la nueva', async () => {
    const resetRes = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/recover/reset',
      headers: { Authorization: `Bearer ${recoveryToken}` },
      body: { password: 'Nueva1234' },
    })
    expect(resetRes.statusCode).toBe(200)
    expect(resetRes.json().success).toBe(true)

    // login con nueva contraseña
    const loginRes = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'X-Client-Type': 'mobile' },
      body: { email: EMAIL, password: 'Nueva1234' },
    })
    expect(loginRes.statusCode).toBe(200)
    accessToken = loginRes.json().access_token
    refreshToken = loginRes.json().refresh_token
  })
})

// ─── AUTH_LOGS ───────────────────────────────────────────────────────────────

describe('Auditoría auth_logs', () => {
  it('existen entradas de register, login, verify_secret, refresh_token en BD', async () => {
    const logs = await db
      .select()
      .from(auth_logs)
      .where(eq(auth_logs.usuario_id, userId))

    expect(logs.length).toBeGreaterThan(0)
    const types = new Set(logs.map((l) => l.event_type))
    expect(types.has('register')).toBe(true)
    expect(types.has('login')).toBe(true)
    expect(types.has('verify_secret')).toBe(true)
    expect(types.has('refresh_token')).toBe(true)
    expect(types.has('recover_verify')).toBe(true)
    expect(types.has('reset_password')).toBe(true)
  })
})

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('200 — cierra sesión correctamente', async () => {
    const res = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/logout',
      headers: { 'X-Client-Type': 'mobile', Authorization: `Bearer ${accessToken}` },
      body: { refresh_token: refreshToken },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)

    // refresh token ya no funciona
    const refreshRes = await injectJson(app, {
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { 'X-Client-Type': 'mobile' },
      body: { refresh_token: refreshToken },
    })
    expect(refreshRes.statusCode).toBe(401)
  })
})
