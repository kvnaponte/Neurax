import argon2 from 'argon2'
import { createHash, randomBytes } from 'crypto'
import type { Redis } from 'ioredis'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { makeAuthRepository } from './auth.repository'
import { inicializarLogrosUsuario } from '../gamification/logros.service'
import {
  ARGON2_OPTIONS,
  SYSTEM_SECRET,
  RECOVERY_QUESTIONS,
  REFRESH_TOKEN_TTL_MS,
  SECRET_BLOCK_TTL_SECONDS,
  SECRET_MAX_ATTEMPTS,
} from './auth.constants'

type DB = PostgresJsDatabase<typeof schema>

function generateRefreshToken() {
  const token = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export function makeAuthService(db: DB, redis: Redis) {
  const repo = makeAuthRepository(db)

  return {
    repo,

    async register(nombre: string, email: string, password: string) {
      const existing = await repo.findByEmail(email)
      if (existing) throw makeError('Email ya registrado', 409)

      const [hashed_password, secret_answer_hash, recovery_answer_1_hash, recovery_answer_2_hash] =
        await Promise.all([
          argon2.hash(password, ARGON2_OPTIONS),
          argon2.hash(SYSTEM_SECRET.answer, ARGON2_OPTIONS),
          argon2.hash(RECOVERY_QUESTIONS[0].answer, ARGON2_OPTIONS),
          argon2.hash(RECOVERY_QUESTIONS[1].answer, ARGON2_OPTIONS),
        ])

      const user = await repo.createUser({
        nombre,
        email,
        hashed_password,
        secret_answer_hash,
        recovery_answer_1_hash,
        recovery_answer_2_hash,
      })

      const { token, hash } = generateRefreshToken()
      await repo.saveRefreshToken({
        usuario_id: user.id,
        token_hash: hash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      })

      await inicializarLogrosUsuario(db, user.id)

      return { user, refreshToken: token }
    },

    async login(email: string, password: string) {
      const user = await repo.findByEmail(email)
      if (!user || user.deleted_at) throw makeError('Credenciales inválidas', 401)

      const valid = await argon2.verify(user.hashed_password, password)
      if (!valid) throw makeError('Credenciales inválidas', 401)

      await repo.updateUser(user.id, { last_login_at: new Date() })

      const { token, hash } = generateRefreshToken()
      await repo.saveRefreshToken({
        usuario_id: user.id,
        token_hash: hash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      })

      return { user, refreshToken: token }
    },

    async verifySecret(userId: string, answer: string) {
      const blockedKey = `auth:secret_blocked:${userId}`
      const blocked = await redis.get(blockedKey)
      if (blocked) throw makeError('Bloqueado 15 minutos', 429)

      const user = await repo.findById(userId)
      if (!user || !user.secret_answer_hash) throw makeError('Usuario no encontrado', 404)

      const valid = await argon2.verify(user.secret_answer_hash, answer.trim().toLowerCase())

      if (!valid) {
        const attemptsKey = `auth:secret_attempts:${userId}`
        const attempts = await redis.incr(attemptsKey)
        await redis.expire(attemptsKey, SECRET_BLOCK_TTL_SECONDS)

        if (attempts >= SECRET_MAX_ATTEMPTS) {
          await redis.set(blockedKey, '1', 'EX', SECRET_BLOCK_TTL_SECONDS)
          await redis.del(attemptsKey)
          throw makeError('Bloqueado 15 minutos', 429)
        }
        throw makeError('Respuesta incorrecta', 401)
      }

      await redis.del(`auth:secret_attempts:${userId}`)
      return true
    },

    async refreshToken(rawToken: string) {
      const hash = hashRefreshToken(rawToken)
      const existing = await repo.findRefreshToken(hash)
      if (!existing || existing.expires_at < new Date()) {
        throw makeError('Token inválido o expirado', 401)
      }

      await repo.revokeRefreshToken(hash)

      const { token, hash: newHash } = generateRefreshToken()
      await repo.saveRefreshToken({
        usuario_id: existing.usuario_id,
        token_hash: newHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        device_info: existing.device_info as object,
      })

      return { userId: existing.usuario_id, refreshToken: token }
    },

    async logout(rawToken: string) {
      const hash = hashRefreshToken(rawToken)
      await repo.revokeRefreshToken(hash)
    },

    async verifyRecovery(userId: string, answer1: string, answer2: string) {
      const user = await repo.findById(userId)
      if (!user || !user.recovery_answer_1_hash || !user.recovery_answer_2_hash) {
        throw makeError('Usuario no encontrado', 404)
      }

      const [valid1, valid2] = await Promise.all([
        argon2.verify(user.recovery_answer_1_hash, answer1.trim().toLowerCase()),
        argon2.verify(user.recovery_answer_2_hash, answer2.trim().toLowerCase()),
      ])

      if (!valid1 || !valid2) throw makeError('Respuestas de recuperación incorrectas', 401)
      return true
    },

    async resetPassword(userId: string, newPassword: string) {
      const hashed_password = await argon2.hash(newPassword, ARGON2_OPTIONS)
      await repo.updateUser(userId, { hashed_password })
      await repo.revokeAllUserTokens(userId)
    },
  }
}

export type AuthService = ReturnType<typeof makeAuthService>
