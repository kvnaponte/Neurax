import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { db } from '../../db/index'
import { makeAuthService } from './auth.service'
import { makeAuditLogger } from './auth.audit'
import {
  RegisterSchema,
  LoginSchema,
  VerifySecretSchema,
  RecoverVerifySchema,
  ResetPasswordSchema,
} from './auth.schema'
import { SYSTEM_SECRET, RECOVERY_QUESTIONS } from './auth.constants'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; type: string }
    user: { userId: string; type: string }
  }
}

function isWeb(req: FastifyRequest) {
  return req.headers['x-client-type'] !== 'mobile'
}

function getIp(req: FastifyRequest) {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip
}

function statusOf(err: unknown): number {
  if (err instanceof ZodError) return 400
  return (err as any)?.statusCode ?? 500
}

function messageOf(err: unknown): string {
  if (err instanceof ZodError) return err.errors[0]?.message ?? 'Datos inválidos'
  return (err as Error).message
}

async function requireAccessToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if (request.user.type !== 'access') throw new Error()
  } catch {
    reply.status(401).send({ error: 'No autorizado' })
  }
}

const RATE = {
  REGISTER:       { max: 5,  timeWindow: 900000 },
  LOGIN:          { max: 10, timeWindow: 900000 },
  REFRESH:        { max: 20, timeWindow: 900000 },
  RECOVER_VERIFY: { max: 2,  timeWindow: 1800000 },
  RECOVER_RESET:  { max: 5,  timeWindow: 900000 },
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeAuthService(db, fastify.redis)
  const audit = makeAuditLogger(service.repo)

  // POST /register
  fastify.post('/register', { config: { rateLimit: RATE.REGISTER } }, async (req, reply) => {
    try {
      const body = RegisterSchema.parse(req.body)
      const { user, refreshToken } = await service.register(body.nombre, body.email, body.password)
      const accessToken = fastify.jwt.sign({ userId: user.id, type: 'access' }, { expiresIn: '15m' })

      audit('register', 'success', { usuarioId: user.id, ip: getIp(req) }).catch(() => {})

      const userPayload = { id: user.id, nombre: user.nombre, email: user.email }
      if (isWeb(req)) {
        reply.setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' })
        return reply.status(201).send({ access_token: accessToken, user: userPayload })
      }
      return reply.status(201).send({ access_token: accessToken, refresh_token: refreshToken, user: userPayload })
    } catch (err) {
      audit('register', 'failure', { ip: getIp(req), metadata: { error: messageOf(err) } }).catch(() => {})
      return reply.status(statusOf(err)).send({ error: messageOf(err) })
    }
  })

  // POST /login
  fastify.post('/login', { config: { rateLimit: RATE.LOGIN } }, async (req, reply) => {
    try {
      const body = LoginSchema.parse(req.body)
      const { user, refreshToken } = await service.login(body.email, body.password)
      const accessToken = fastify.jwt.sign({ userId: user.id, type: 'access' }, { expiresIn: '15m' })

      audit('login', 'success', { usuarioId: user.id, ip: getIp(req), userAgent: req.headers['user-agent'] }).catch(() => {})

      const userPayload = { id: user.id, nombre: user.nombre, email: user.email }
      if (isWeb(req)) {
        reply.setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' })
        return reply.send({ access_token: accessToken, secret_question: SYSTEM_SECRET.question, user: userPayload })
      }
      return reply.send({ access_token: accessToken, refresh_token: refreshToken, secret_question: SYSTEM_SECRET.question, user: userPayload })
    } catch (err) {
      audit('login', 'failure', { ip: getIp(req) }).catch(() => {})
      return reply.status(statusOf(err)).send({ error: messageOf(err) })
    }
  })

  // POST /verify-secret (rate limiting por userId manejado por el servicio Redis)
  fastify.post('/verify-secret', { preHandler: requireAccessToken }, async (req, reply) => {
    const { userId } = req.user
    try {
      const body = VerifySecretSchema.parse(req.body)
      await service.verifySecret(userId, body.answer)
      const sessionToken = fastify.jwt.sign({ userId, type: 'access' }, { expiresIn: '15m' })
      audit('verify_secret', 'success', { usuarioId: userId, ip: getIp(req) }).catch(() => {})
      return reply.send({ access_token: sessionToken, verified: true })
    } catch (err: any) {
      const result = err?.statusCode === 429 ? 'blocked' : 'failure'
      audit('verify_secret', result, { usuarioId: userId, ip: getIp(req) }).catch(() => {})
      const headers: Record<string, string> = {}
      if (err?.statusCode === 429) headers['Retry-After'] = '900'
      return reply.status(statusOf(err)).headers(headers).send({ error: messageOf(err) })
    }
  })

  // POST /refresh
  fastify.post('/refresh', { config: { rateLimit: RATE.REFRESH } }, async (req, reply) => {
    const rawToken = isWeb(req)
      ? req.cookies?.refresh_token
      : (req.body as any)?.refresh_token

    if (!rawToken) return reply.status(401).send({ error: 'Refresh token requerido' })

    try {
      const { userId, refreshToken } = await service.refreshToken(rawToken)
      const accessToken = fastify.jwt.sign({ userId, type: 'access' }, { expiresIn: '15m' })

      audit('refresh_token', 'success', { usuarioId: userId, ip: getIp(req) }).catch(() => {})

      if (isWeb(req)) {
        reply.setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' })
        return reply.send({ access_token: accessToken })
      }
      return reply.send({ access_token: accessToken, refresh_token: refreshToken })
    } catch (err) {
      audit('refresh_token', 'failure', { ip: getIp(req) }).catch(() => {})
      return reply.status(statusOf(err)).send({ error: messageOf(err) })
    }
  })

  // POST /logout (requires access token)
  fastify.post('/logout', { preHandler: requireAccessToken }, async (req, reply) => {
    const { userId } = req.user
    const rawToken = isWeb(req)
      ? req.cookies?.refresh_token
      : (req.body as any)?.refresh_token

    if (rawToken) await service.logout(rawToken)
    audit('logout', 'success', { usuarioId: userId, ip: getIp(req) }).catch(() => {})

    if (isWeb(req)) reply.clearCookie('refresh_token', { path: '/api/auth' })
    return reply.send({ success: true })
  })

  // POST /recover/verify
  fastify.post('/recover/verify', { config: { rateLimit: RATE.RECOVER_VERIFY } }, async (req, reply) => {
    try {
      const body = RecoverVerifySchema.parse(req.body)
      await service.verifyRecovery(body.userId, body.answer1, body.answer2)
      const recoveryToken = fastify.jwt.sign({ userId: body.userId, type: 'recovery' }, { expiresIn: '10m' })
      audit('recover_verify', 'success', { usuarioId: body.userId, ip: getIp(req) }).catch(() => {})
      return reply.send({
        recovery_token: recoveryToken,
        questions: [RECOVERY_QUESTIONS[0].question, RECOVERY_QUESTIONS[1].question],
      })
    } catch (err) {
      audit('recover_verify', 'failure', { ip: getIp(req) }).catch(() => {})
      return reply.status(statusOf(err)).send({ error: messageOf(err) })
    }
  })

  // POST /recover/reset
  fastify.post('/recover/reset', { config: { rateLimit: RATE.RECOVER_RESET } }, async (req, reply) => {
    const authHeader = req.headers.authorization?.replace('Bearer ', '')
    if (!authHeader) return reply.status(401).send({ error: 'Recovery token requerido' })

    let payload: { userId: string; type: string }
    try {
      payload = fastify.jwt.verify(authHeader)
    } catch {
      return reply.status(401).send({ error: 'Recovery token inválido o expirado' })
    }
    if (payload.type !== 'recovery') return reply.status(401).send({ error: 'Token no válido para esta operación' })

    try {
      const body = ResetPasswordSchema.parse(req.body)
      await service.resetPassword(payload.userId, body.password)
      audit('reset_password', 'success', { usuarioId: payload.userId, ip: getIp(req) }).catch(() => {})
      return reply.send({ success: true })
    } catch (err) {
      return reply.status(statusOf(err)).send({ error: messageOf(err) })
    }
  })
}

export default authPlugin
