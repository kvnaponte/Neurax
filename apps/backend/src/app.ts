import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { apoloRoutes } from './modules/apolo/apolo.routes.js'

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

// Start
const PORT = Number(process.env.PORT ?? 3001)
await app.listen({ port: PORT, host: '0.0.0.0' })
