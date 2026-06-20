import type { FastifyInstance } from 'fastify'
import { registrarJuego, obtenerJuegos, calificarJuego, editarJuego, eliminarJuego, obtenerEstadisticas } from './nemesis.service.js'

export async function nemesisRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado, plataforma } = request.query as Record<string, string>
    return reply.send(await obtenerJuegos(usuario.id, { estado, plataforma }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarJuego(usuario.id, request.body as Parameters<typeof registrarJuego>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const juego = await editarJuego(usuario.id, id, (request.body as Parameters<typeof editarJuego>[2]) ?? {})
    if (!juego) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(juego)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const juego = await eliminarJuego(usuario.id, id)
    if (!juego) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.get('/estadisticas', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.send(await obtenerEstadisticas(usuario.id))
  })
}
