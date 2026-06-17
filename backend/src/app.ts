import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import dbPlugin from './shared/plugins/db.plugin.js'
import redisPlugin from './shared/plugins/redis.plugin.js'
import authRoutes from './modules/auth/auth.routes.js'
import gamificationRoutes from './modules/gamification/gamification.routes.js'
import actividadesRoutes from './modules/actividades/actividades.routes.js'
import cronosRoutes, { cronosExternalPlugin } from './modules/cronos/cronos.routes.js'
import odinRoutes from './modules/odin/odin.routes.js'
import socketioPlugin from './shared/plugins/socketio.plugin.js'
import {
  notificationsWorker,
  odinDailyWorker,
  odinWeeklyWorker,
  odinMonthlyWorker,
  streakCheckWorker,
  iaTaskWorker,
  dionisioPipelineWorker,
} from './jobs/workers.js'
import { setupSchedulers } from './jobs/schedulers.js'

const app = Fastify({ logger: true })

await app.register(dbPlugin)
await app.register(redisPlugin)
await app.register(cookie)
await app.register(jwt, { secret: process.env.JWT_SECRET! })
await app.register(rateLimit, { global: false, redis: app.redis })
await app.register(cors)
await app.register(socketioPlugin)
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(gamificationRoutes, { prefix: '/api/gamification' })
await app.register(actividadesRoutes, { prefix: '/api/actividades' })
await app.register(cronosRoutes, { prefix: '/api/cronos' })
await app.register(cronosExternalPlugin, { prefix: '/api/external/cronos' })
await app.register(odinRoutes, { prefix: '/api/odin' })

app.get('/health', async () => {
  return { status: 'ok' }
})

app.addHook('onClose', async () => {
  await Promise.all([
    notificationsWorker.close(),
    odinDailyWorker.close(),
    odinWeeklyWorker.close(),
    odinMonthlyWorker.close(),
    streakCheckWorker.close(),
    iaTaskWorker.close(),
    dionisioPipelineWorker.close(),
  ])
})

const start = async () => {
  try {
    await setupSchedulers()
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
