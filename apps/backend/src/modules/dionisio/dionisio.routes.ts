import type { FastifyInstance } from 'fastify'
import {
  listarVideos,
  obtenerVideo,
  agregarVideoManual,
  procesarVideo,
  accionarVideo,
  reclasificarVideo,
  eliminarVideo,
} from './dionisio.service.js'

export async function dionisioRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { categoria, estado } = request.query as Record<string, string>
    return reply.send(await listarVideos(usuario.id, { categoria, estado }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { url } = request.body as { url: string }
    if (!url) return reply.code(400).send({ error: 'url requerida' })
    const video = await agregarVideoManual(usuario.id, url)
    return reply.code(201).send(video)
  })

  app.get('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const video = await obtenerVideo(usuario.id, id)
    if (!video) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(video)
  })

  app.post('/:id/pipeline', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const video = await obtenerVideo(usuario.id, id)
    if (!video) return reply.code(404).send({ error: 'No encontrado' })
    await procesarVideo(id)
    return reply.send({ queued: true })
  })

  app.post('/:id/accionar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { seccion, ...data } = request.body as { seccion: string; [key: string]: unknown }
    if (!seccion) return reply.code(400).send({ error: 'seccion requerida' })
    const video = await accionarVideo(usuario.id, id, seccion, data)
    if (!video) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(video)
  })

  app.post('/:id/reclasificar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { categoria } = request.body as { categoria: string }
    if (!categoria) return reply.code(400).send({ error: 'categoria requerida' })
    const video = await reclasificarVideo(usuario.id, id, categoria)
    if (!video) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(video)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const video = await eliminarVideo(usuario.id, id)
    if (!video) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })
}
