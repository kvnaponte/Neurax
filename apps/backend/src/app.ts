import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { apoloRoutes } from './modules/apolo/apolo.routes.js'
import { alejandraRoutes } from './modules/alejandria/alejandria.routes.js'
import { michelinRoutes } from './modules/michelin/michelin.routes.js'
import { odysseiaRoutes } from './modules/odysseia/odysseia.routes.js'
import { proezaRoutes } from './modules/proeza/proeza.routes.js'
import { prodigyRoutes } from './modules/prodigy/prodigy.routes.js'
import { nemesisRoutes } from './modules/nemesis/nemesis.routes.js'
import { kuberaRoutes } from './modules/kubera/kubera.routes.js'
import { dionisioRoutes } from './modules/dionisio/dionisio.routes.js'
import { soberbioRoutes } from './modules/soberbio/soberbio.routes.js'
import { iaRoutes } from './modules/ia/ia.routes.js'
import './jobs/ia-task.worker.js'
import './jobs/dionisio-pipeline.worker.js'

const app = Fastify({ logger: true })

// Plugins
await app.register(helmet)
await app.register(cors, { origin: process.env.CORS_ORIGIN ?? '*' })
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
await app.register(jwt, { secret: process.env.JWT_SECRET! })

// Health check
app.get('/health', async () => ({ status: 'ok', app: 'NEURAX API' }))

// Routes
await app.register(apoloRoutes, { prefix: '/api/apolo' })
await app.register(alejandraRoutes, { prefix: '/api/alejandria' })
await app.register(michelinRoutes, { prefix: '/api/michelin' })
await app.register(odysseiaRoutes, { prefix: '/api/odysseia' })
await app.register(proezaRoutes, { prefix: '/api/proeza' })
await app.register(prodigyRoutes, { prefix: '/api/prodigy' })
await app.register(nemesisRoutes, { prefix: '/api/nemesis' })
await app.register(kuberaRoutes, { prefix: '/api/kubera' })
await app.register(dionisioRoutes, { prefix: '/api/dionisio' })
await app.register(soberbioRoutes, { prefix: '/api/soberbio' })
await app.register(iaRoutes, { prefix: '/api/ia' })

// Start
const PORT = Number(process.env.PORT ?? 3001)
await app.listen({ port: PORT, host: '0.0.0.0' })
