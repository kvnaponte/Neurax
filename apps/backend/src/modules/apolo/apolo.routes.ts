import type { FastifyInstance } from 'fastify'
import {
  registrarPelicula,
  obtenerPeliculas,
  calificarPelicula,
  editarPelicula,
  eliminarPelicula,
  obtenerTop5,
  obtenerNivelCinefilo,
} from './apolo.service.js'

export async function apoloRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado, genero, categoria, search, page, limit } = request.query as Record<string, string>
    const peliculas = await obtenerPeliculas(usuario.id, {
      estado,
      genero,
      categoria,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
    return reply.send(peliculas)
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const pelicula = await registrarPelicula(usuario.id, request.body as Parameters<typeof registrarPelicula>[1])
    return reply.code(201).send(pelicula)
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = request.body as Parameters<typeof editarPelicula>[2]

    if (body && 'rating' in body && body.rating !== undefined) {
      const pelicula = await calificarPelicula(
        usuario.id,
        id,
        Number(body.rating),
        (body as { fecha_visualizacion?: string }).fecha_visualizacion
      )
      if (!pelicula) return reply.code(404).send({ error: 'Película no encontrada' })
      return reply.send(pelicula)
    }

    const pelicula = await editarPelicula(usuario.id, id, body ?? {})
    if (!pelicula) return reply.code(404).send({ error: 'Película no encontrada' })
    return reply.send(pelicula)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const pelicula = await eliminarPelicula(usuario.id, id)
    if (!pelicula) return reply.code(404).send({ error: 'Película no encontrada' })
    return reply.send({ deleted: true })
  })

  app.get('/top5', async (request, reply) => {
    const usuario = request.user as { id: string }
    const top5 = await obtenerTop5(usuario.id)
    return reply.send(top5)
  })

  app.get('/nivel', async (request, reply) => {
    const usuario = request.user as { id: string }
    const nivel = await obtenerNivelCinefilo(usuario.id)
    return reply.send(nivel)
  })
}
