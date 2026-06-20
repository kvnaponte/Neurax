import type { FastifyInstance } from 'fastify'
import { registrarLibro, obtenerLibros, calificarLibro, editarLibro, eliminarLibro } from './alejandria.service.js'

export async function alejandraRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado, genero } = request.query as Record<string, string>
    return reply.send(await obtenerLibros(usuario.id, { estado, genero }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarLibro(usuario.id, request.body as Parameters<typeof registrarLibro>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = request.body as Parameters<typeof editarLibro>[2]
    const libro = await editarLibro(usuario.id, id, body ?? {})
    if (!libro) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(libro)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const libro = await eliminarLibro(usuario.id, id)
    if (!libro) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })
}
