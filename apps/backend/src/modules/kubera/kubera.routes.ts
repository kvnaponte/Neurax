import type { FastifyInstance } from 'fastify'
import { registrarProducto, obtenerProductos, iniciarAhorro, adquirir, editarProducto, eliminarProducto } from './kubera.service.js'

export async function kuberaRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado, categoria } = request.query as Record<string, string>
    return reply.send(await obtenerProductos(usuario.id, { estado, categoria }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarProducto(usuario.id, request.body as Parameters<typeof registrarProducto>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const producto = await editarProducto(usuario.id, id, (request.body as Parameters<typeof editarProducto>[2]) ?? {})
    if (!producto) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(producto)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const producto = await eliminarProducto(usuario.id, id)
    if (!producto) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.post('/:id/iniciar-ahorro', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const resultado = await iniciarAhorro(usuario.id, id)
    if (!resultado) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(resultado)
  })

  app.post('/:id/adquirir', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { precio_real } = request.body as { precio_real: string }
    const resultado = await adquirir(usuario.id, id, precio_real)
    if (!resultado) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(resultado)
  })
}
