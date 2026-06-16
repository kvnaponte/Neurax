import fp from 'fastify-plugin'
import { Server } from 'socket.io'
import type { FastifyPluginAsync } from 'fastify'
import { setIo } from '../io'

declare module 'fastify' {
  interface FastifyInstance { io: Server }
}

const socketioPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const io = new Server(fastify.server, {
    cors: { origin: '*' },
  })

  setIo(io)
  fastify.decorate('io', io)
  fastify.addHook('onClose', async () => { io.close() })
})

export default socketioPlugin
