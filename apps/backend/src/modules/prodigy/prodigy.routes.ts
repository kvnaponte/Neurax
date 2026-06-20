import type { FastifyInstance } from 'fastify'
import {
  registrarCurso,
  obtenerCursos,
  editarCurso,
  eliminarCurso,
  registrarEntrega,
  obtenerEntregas,
  editarEntrega,
  generarHorario,
  confirmarHorario,
} from './prodigy.service.js'

export async function prodigyRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try { await request.jwtVerify() } catch { reply.code(401).send({ error: 'Unauthorized' }) }
  })

  app.get('/cursos', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { estado } = request.query as Record<string, string>
    return reply.send(await obtenerCursos(usuario.id, { estado }))
  })

  app.post('/cursos', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarCurso(usuario.id, request.body as Parameters<typeof registrarCurso>[1]))
  })

  app.put('/cursos/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const curso = await editarCurso(usuario.id, id, (request.body as Parameters<typeof editarCurso>[2]) ?? {})
    if (!curso) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(curso)
  })

  app.delete('/cursos/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const curso = await eliminarCurso(usuario.id, id)
    if (!curso) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send({ deleted: true })
  })

  app.get('/entregas', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { curso_id } = request.query as Record<string, string>
    return reply.send(await obtenerEntregas(usuario.id, { curso_id }))
  })

  app.post('/entregas', async (request, reply) => {
    const usuario = request.user as { id: string }
    return reply.code(201).send(await registrarEntrega(usuario.id, request.body as Parameters<typeof registrarEntrega>[1]))
  })

  app.put('/entregas/:id', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { id } = request.params as { id: string }
    const entrega = await editarEntrega(usuario.id, id, (request.body as Parameters<typeof editarEntrega>[2]) ?? {})
    if (!entrega) return reply.code(404).send({ error: 'No encontrado' })
    return reply.send(entrega)
  })

  app.post('/generar-horario', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { curso_id } = request.body as { curso_id: string }
    const resultado = await generarHorario(usuario.id, curso_id)
    if (!resultado) return reply.code(404).send({ error: 'Curso no encontrado o sin deadline' })
    return reply.send(resultado)
  })

  app.post('/generar-horario/confirmar', async (request, reply) => {
    const usuario = request.user as { id: string }
    const { curso_id, bloques } = request.body as { curso_id: string; bloques: { inicio: string; fin: string; titulo?: string }[] }
    const eventos = await confirmarHorario(usuario.id, curso_id, bloques)
    return reply.code(201).send(eventos)
  })
}
