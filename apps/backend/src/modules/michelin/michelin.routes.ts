import type { FastifyInstance } from 'fastify'
import { registrarReceta, obtenerRecetas, sugerirAleatoria, marcarCocinada, editarReceta, eliminarReceta } from './michelin.service.js'

export async function michelinRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { tipo, estado } = request.query as Record<string, string>
    return reply.send(await obtenerRecetas(usuario.id, { tipo, estado }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarReceta(usuario.id, request.body as Parameters<typeof registrarReceta>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const body = request.body as Parameters<typeof editarReceta>[2]
    const receta = await editarReceta(usuario.id, id, body ?? {})
    if (!receta) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(receta)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const receta = await eliminarReceta(usuario.id, id)
    if (!receta) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.get('/sugerir', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { dificultad, tiempo_max } = request.query as Record<string, string>
    const receta = await sugerirAleatoria(usuario.id, {
      dificultad: dificultad ? Number(dificultad) : undefined,
      tiempo_max: tiempo_max ? Number(tiempo_max) : undefined,
    })
    if (!receta) return reply.code(404).send({ error: 'No hay recetas pendientes' })
    return reply.send(receta)
  })
}
