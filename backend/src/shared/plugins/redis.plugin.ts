import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import type { FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

  redis.on('error', (err) => fastify.log.error({ err }, '[Redis] connection error'))
  redis.on('connect', () => fastify.log.info('[Redis] connected'))

  fastify.decorate('redis', redis)
  fastify.addHook('onClose', async () => redis.quit())
})

export default redisPlugin
