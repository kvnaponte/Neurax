import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
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
  VERIFY_SECRET:  { max: 3,  timeWindow: 900000 },
  REFRESH:        { max: 20, timeWindow: 900000 },
  RECOVER_VERIFY: { max: 2,  timeWindow: 1800000 },
  RECOVER_RESET:  { max: 5,  timeWindow: 900000 },
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const service = makeAuthService(db, fastify.redis)
  const audit = makeAuditLogger(service.repo)

  // POST /register
  fastify.post('/register', { config: { rateLimit: RATE.REGISTER } }, async (req, reply) => {
    const body = RegisterSchema.parse(req.body)
    try {
      const { user, refreshToken } = await service.register(body.nombre, body.email, body.password)
      const accessToken = fastify.jwt.sign({ userId: user.id, type: 'access' }, { expiresIn: '15m' })

      await audit('register', 'success', { usuarioId: user.id, ip: getIp(req) })

      const userPayload = { id: user.id, nombre: user.nombre, email: user.email }
      if (isWeb(req)) {
        reply.setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' })
        return reply.status(201).send({ access_token: accessToken, user: userPayload })
      }
      return reply.status(201).send({ access_token: accessToken, refresh_token: refreshToken, user: userPayload })
    } catch (err: any) {
      await audit('register', 'failure', { ip: getIp(req), metadata: { error: err.message } })
      return reply.status(err.statusCode ?? 500).send({ error: err.message })
    }
  })

  // POST /login
  fastify.post('/login', { config: { rateLimit: RATE.LOGIN } }, async (req, reply) => {
    const body = LoginSchema.parse(req.body)
    try {
      const { user, refreshToken } = await service.login(body.email, body.password)
      const accessToken = fastify.jwt.sign({ userId: user.id, type: 'access' }, { expiresIn: '15m' })

      await audit('login', 'success', { usuarioId: user.id, ip: getIp(req), userAgent: req.headers['user-agent'] })

      const userPayload = { id: user.id, nombre: user.nombre, email: user.email }
      if (isWeb(req)) {
        reply.setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' })
        return reply.send({ access_token: accessToken, secret_question: SYSTEM_SECRET.question, user: userPayload })
      }
      return reply.send({ access_token: accessToken, refresh_token: refreshToken, secret_question: SYSTEM_SECRET.question, user: userPayload })
    } catch (err: any) {
      await audit('login', 'failure', { ip: getIp(req), metadata: { email: body.email } })
      return reply.status(err.statusCode ?? 500).send({ error: err.message })
    }
  })

  // POST /verify-secret (requires access token — rate limiting handled by service Redis per userId)
  fastify.post('/verify-secret', {
    preHandler: requireAccessToken,
  }, async (req, reply) => {
    const { userId } = req.user
    const body = VerifySecretSchema.parse(req.body)
    try {
      await service.verifySecret(userId, body.answer)
      const sessionToken = fastify.jwt.sign({ userId, type: 'access' }, { expiresIn: '15m' })
      await audit('verify_secret', 'success', { usuarioId: userId, ip: getIp(req) })
      return reply.send({ access_token: sessionToken, verified: true })
    } catch (err: any) {
      const result = err.statusCode === 429 ? 'blocked' : 'failure'
      await audit('verify_secret', result, { usuarioId: userId, ip: getIp(req) })
      const headers: Record<string, string> = {}
      if (err.statusCode === 429) headers['Retry-After'] = '900'
      return reply.status(err.statusCode ?? 500).headers(headers).send({ error: err.message })
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

      await audit('refresh_token', 'success', { usuarioId: userId, ip: getIp(req) })

      if (isWeb(req)) {
        reply.setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth' })
        return reply.send({ access_token: accessToken })
      }
      return reply.send({ access_token: accessToken, refresh_token: refreshToken })
    } catch (err: any) {
      await audit('refresh_token', 'failure', { ip: getIp(req) })
      return reply.status(err.statusCode ?? 500).send({ error: err.message })
    }
  })

  // POST /logout (requires access token)
  fastify.post('/logout', { preHandler: requireAccessToken }, async (req, reply) => {
    const { userId } = req.user
    const rawToken = isWeb(req)
      ? req.cookies?.refresh_token
      : (req.body as any)?.refresh_token

    if (rawToken) await service.logout(rawToken)
    await audit('logout', 'success', { usuarioId: userId, ip: getIp(req) })

    if (isWeb(req)) reply.clearCookie('refresh_token', { path: '/api/auth' })
    return reply.send({ success: true })
  })

  // POST /recover/verify
  fastify.post('/recover/verify', { config: { rateLimit: RATE.RECOVER_VERIFY } }, async (req, reply) => {
    const body = RecoverVerifySchema.parse(req.body)
    try {
      await service.verifyRecovery(body.userId, body.answer1, body.answer2)
      const recoveryToken = fastify.jwt.sign({ userId: body.userId, type: 'recovery' }, { expiresIn: '10m' })
      await audit('recover_verify', 'success', { usuarioId: body.userId, ip: getIp(req) })
      return reply.send({
        recovery_token: recoveryToken,
        questions: [RECOVERY_QUESTIONS[0].question, RECOVERY_QUESTIONS[1].question],
      })
    } catch (err: any) {
      await audit('recover_verify', 'failure', { ip: getIp(req), metadata: { userId: body.userId } })
      return reply.status(err.statusCode ?? 500).send({ error: err.message })
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

    const body = ResetPasswordSchema.parse(req.body)
    await service.resetPassword(payload.userId, body.password)
    await audit('reset_password', 'success', { usuarioId: payload.userId, ip: getIp(req) })

    return reply.send({ success: true })
  })
}

export default authPlugin
