import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import dbPlugin from './shared/plugins/db.plugin.js'
import redisPlugin from './shared/plugins/redis.plugin.js'
import authRoutes from './modules/auth/auth.routes.js'
import './jobs/workers.js'

const app = Fastify({ logger: true })

await app.register(dbPlugin)
await app.register(redisPlugin)
await app.register(cookie)
await app.register(jwt, { secret: process.env.JWT_SECRET! })
await app.register(rateLimit, { global: false, redis: app.redis })
await app.register(cors)
await app.register(authRoutes, { prefix: '/api/auth' })

app.get('/health', async () => {
  return { status: 'ok' }
})

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

const shutdown = async () => {
  await app.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

start()
