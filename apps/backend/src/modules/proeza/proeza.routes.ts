import type { FastifyInstance } from 'fastify'
import {
  registrarCancion,
  obtenerCanciones,
  editarCancion,
  eliminarCancion,
  obtenerExploracionActual,
  completarExploracion,
} from './proeza.service.js'

export async function proezaRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.send(await obtenerCanciones(usuario.id))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarCancion(usuario.id, request.body as Parameters<typeof registrarCancion>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const cancion = await editarCancion(usuario.id, id, (request.body as Parameters<typeof editarCancion>[2]) ?? {})
    if (!cancion) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(cancion)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const cancion = await eliminarCancion(usuario.id, id)
    if (!cancion) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.get('/exploracion/actual', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.send(await obtenerExploracionActual(usuario.id))
  })

  app.post('/exploracion/completar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const nueva = await completarExploracion(usuario.id)
    if (!nueva) return reply.code(404).send({ error: 'No hay exploración activa' })
    return reply.send(nueva)
  })
}
