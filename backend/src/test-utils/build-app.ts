import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import dbPlugin from '../shared/plugins/db.plugin'
import redisPlugin from '../shared/plugins/redis.plugin'
import authRoutes from '../modules/auth/auth.routes'
import gamificationRoutes from '../modules/gamification/gamification.routes'
import actividadesRoutes from '../modules/actividades/actividades.routes'

// No importa workers para no abrir conexiones BullMQ en tests

export async function buildApp() {
  const app = Fastify({ logger: false })

  await app.register(dbPlugin)
  await app.register(redisPlugin)
  await app.register(cookie)
  await app.register(jwt, { secret: process.env.JWT_SECRET! })
  // rate-limit omitido en tests (la lógica de bloqueo se prueba a nivel de servicio Redis)
  await app.register(cors)
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(gamificationRoutes, { prefix: '/api/gamification' })
  await app.register(actividadesRoutes, { prefix: '/api/actividades' })

  return app
}
