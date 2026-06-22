import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import dbPlugin from '../shared/plugins/db.plugin'
import redisPlugin from '../shared/plugins/redis.plugin'
import authRoutes from '../modules/auth/auth.routes'
import gamificationRoutes from '../modules/gamification/gamification.routes'
import actividadesRoutes from '../modules/actividades/actividades.routes'
import cronosRoutes, { cronosExternalPlugin } from '../modules/cronos/cronos.routes'
import odinRoutes from '../modules/odin/odin.routes'
import leonidasRoutes from '../modules/leonidas/leonidas.routes'
import demeterRoutes from '../modules/demeter/demeter.routes'
import prodigyRoutes from '../modules/prodigy/prodigy.routes'
import proezaRoutes from '../modules/proeza/proeza.routes'
import dionisioRoutes from '../modules/dionisio/dionisio.routes'
import kuberaRoutes from '../modules/kubera/kubera.routes'

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
  await app.register(cronosRoutes, { prefix: '/api/cronos' })
  await app.register(cronosExternalPlugin, { prefix: '/api/external/cronos' })
  await app.register(odinRoutes, { prefix: '/api/odin' })
  await app.register(leonidasRoutes, { prefix: '/api/leonidas' })
  await app.register(demeterRoutes, { prefix: '/api/demeter' })
  await app.register(prodigyRoutes, { prefix: '/api/prodigy' })
  await app.register(proezaRoutes, { prefix: '/api/proeza' })
  await app.register(dionisioRoutes, { prefix: '/api/dionisio' })
  await app.register(kuberaRoutes, { prefix: '/api/kubera' })

  return app
}
