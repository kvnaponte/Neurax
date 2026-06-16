import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { client, db } from '../../db/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db
  }
}

const dbPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('db', db)

  fastify.addHook('onClose', async () => {
    await client.end()
  })
})

export default dbPlugin
