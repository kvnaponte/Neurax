import type { FastifyInstance } from 'fastify'
import {
  agregarLugar,
  listarLugares,
  editarLugar,
  eliminarLugar,
  seleccionarAleatorio,
  marcarVisitado,
  calificarVisita,
  sugerirFechas,
  obtenerLugar,
} from './soberbio.service.js'
import { crearEvento } from '../cronos/cronos.service.js'

export async function soberbioRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado } = request.query as Record<string, string>
    return reply.send(await listarLugares(usuario.id, { estado }))
  })

  app.post('/', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await agregarLugar(usuario.id, request.body as Parameters<typeof agregarLugar>[1]))
  })

  app.put('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const lugar = await editarLugar(usuario.id, id, (request.body as Parameters<typeof editarLugar>[2]) ?? {})
    if (!lugar) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(lugar)
  })

  app.delete('/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const lugar = await eliminarLugar(usuario.id, id)
    if (!lugar) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.get('/aleatorio', async (request, reply) => {
    const usuario = request.user as { id: string }
    const lugar = await seleccionarAleatorio(usuario.id)
    if (!lugar) return reply.send({ lugar: null, mensaje: 'No hay lugares pendientes' })
    return reply.send({ lugar })
  })

  app.post('/:id/visitar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { fecha_visita } = (request.body ?? {}) as { fecha_visita?: string }
    const lugar = await marcarVisitado(usuario.id, id, fecha_visita)
    if (!lugar) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(lugar)
  })

  app.post('/:id/calificar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { ingredientes, tecnica, creatividad, servicio, ambiente, resena } = request.body as {
      ingredientes: number; tecnica: number; creatividad: number; servicio: number; ambiente: number; resena?: string
    }
    const lugar = await calificarVisita(usuario.id, id, { ingredientes, tecnica, creatividad, servicio, ambiente }, resena)
    if (!lugar) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(lugar)
  })

  app.get('/:id/fechas', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const fechas = await sugerirFechas(usuario.id, id)
    return reply.send({ fechas })
  })

  app.post('/:id/programar-visita', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const { fecha } = request.body as { fecha: string }
    if (!fecha) return reply.code(400).send({ error: 'fecha requerida' })

    const lugar = await obtenerLugar(usuario.id, id)
    if (!lugar) return reply.code(404).send({ error: 'No encontrado' })

    const inicio = new Date(`${fecha}T20:00:00`)
    const fin = new Date(`${fecha}T22:00:00`)

    const evento = await crearEvento(usuario.id, {
      titulo: `🍽️ Visita: ${lugar.nombre}`,
      tipo: 'ocio',
      area: 'otras',
      inicio_at: inicio.toISOString(),
      fin_at: fin.toISOString(),
      seccion_origen: 'soberbio',
      seccion_ref_id: id,
    })
    return reply.code(201).send(evento)
  })
}
