import Fastify from 'fastify'
import cors from '@fastify/cors'
import dbPlugin from './shared/plugins/db.plugin.js'

const app = Fastify({ logger: true })

await app.register(dbPlugin)
await app.register(cors)

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
