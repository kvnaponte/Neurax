import type { FastifyInstance } from 'fastify'
import { registrarDestino, obtenerDestinos, marcarVisitado, editarDestino, eliminarDestino } from './odysseia.service.js'

export async function odysseiaRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado, pais } = request.query as Record<string, string>
    return reply.send(await obtenerDestinos(usuario.id, { estado, pais }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarDestino(usuario.id, request.body as Parameters<typeof registrarDestino>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const destino = await editarDestino(usuario.id, id, (request.body as Parameters<typeof editarDestino>[2]) ?? {})
    if (!destino) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(destino)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const destino = await eliminarDestino(usuario.id, id)
    if (!destino) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.post('/:id/visitar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { fotos_urls } = (request.body ?? {}) as { fotos_urls?: string[] }
    const destino = await marcarVisitado(usuario.id, id, fotos_urls)
    if (!destino) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(destino)
  })
}
