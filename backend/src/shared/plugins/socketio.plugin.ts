import fp from 'fastify-plugin'
import { Server } from 'socket.io'
import type { FastifyPluginAsync } from 'fastify'
import { setIo } from '../io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
    emitToUser: (userId: string, event: string, data: unknown) => void
  }
}

const socketioPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const io = new Server(fastify.server, {
    cors: { origin: process.env.WEB_URL ?? '*' },
    transports: ['websocket', 'polling'],
  })

  // JWT auth middleware — rejects connections without a valid access token
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('No token'))
    try {
      const payload = await fastify.jwt.verify<{ userId: string; type: string }>(token)
      if (payload.type !== 'access') return next(new Error('Invalid token'))
      socket.data.userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId: string = socket.data.userId
    socket.join(`user:${userId}`)
    socket.on('disconnect', () => { /* room cleaned up automatically by socket.io */ })
  })

  setIo(io)
  fastify.decorate('io', io)
  fastify.decorate('emitToUser', (userId: string, event: string, data: unknown) => {
    io.to(`user:${userId}`).emit(event, data)
  })
  fastify.addHook('onClose', async () => { io.close() })
})

export default socketioPlugin
