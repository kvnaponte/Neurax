import { db } from '../../db/index.js'
import { prodigyCursos, prodigyEntregas } from '../../db/schema/prodigy.js'
import { cronosEventos } from '../../db/schema/cronos.js'
import { eq, and, isNull, desc } from 'drizzle-orm'

type CursoData = {
  nombre: string
  categoria?: string
  plataforma?: string
  estado?: string
  porcentaje_completado?: number
  fecha_inicio?: string
  fecha_limite?: string
  horas_totales?: string
  otorga_certificado?: boolean
  calificacion?: number
}

type EntregaData = {
  nombre: string
  curso_id: string
  fecha_entrega: string
  estado?: string
  prioridad?: number
}

export async function registrarCurso(usuarioId: string, data: CursoData) {
  const [curso] = await db
    .insert(prodigyCursos)
    .values({
      usuarioId,
      nombre: data.nombre,
      categoria: data.categoria,
      plataforma: data.plataforma,
      estado: data.estado ?? 'por_empezar',
      porcentajeCompletado: data.porcentaje_completado ?? 0,
      fechaInicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
      fechaLimite: data.fecha_limite ? new Date(data.fecha_limite) : null,
      horasTotales: data.horas_totales,
      otorgaCertificado: data.otorga_certificado ?? false,
      calificacion: data.calificacion,
    })
    .returning()
  return curso
}

export async function editarCurso(usuarioId: string, cursoId: string, data: Partial<CursoData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.categoria !== undefined) updates.categoria = data.categoria
  if (data.plataforma !== undefined) updates.plataforma = data.plataforma
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.porcentaje_completado !== undefined) updates.porcentajeCompletado = data.porcentaje_completado
  if (data.fecha_inicio !== undefined) updates.fechaInicio = new Date(data.fecha_inicio)
  if (data.fecha_limite !== undefined) updates.fechaLimite = new Date(data.fecha_limite)
  if (data.horas_totales !== undefined) updates.horasTotales = data.horas_totales
  if (data.otorga_certificado !== undefined) updates.otorgaCertificado = data.otorga_certificado
  if (data.calificacion !== undefined) updates.calificacion = data.calificacion
  const [curso] = await db
    .update(prodigyCursos)
    .set(updates)
    .where(and(eq(prodigyCursos.id, cursoId), eq(prodigyCursos.usuarioId, usuarioId), isNull(prodigyCursos.deletedAt)))
    .returning()
  return curso
}

export async function obtenerCursos(usuarioId: string, filtros: { estado?: string } = {}) {
  const conditions = [eq(prodigyCursos.usuarioId, usuarioId), isNull(prodigyCursos.deletedAt)]
  if (filtros.estado) conditions.push(eq(prodigyCursos.estado, filtros.estado))
  return db.select().from(prodigyCursos).where(and(...conditions)).orderBy(desc(prodigyCursos.createdAt))
}

export async function eliminarCurso(usuarioId: string, cursoId: string) {
  const [curso] = await db
    .update(prodigyCursos)
    .set({ deletedAt: new Date() })
    .where(and(eq(prodigyCursos.id, cursoId), eq(prodigyCursos.usuarioId, usuarioId), isNull(prodigyCursos.deletedAt)))
    .returning()
  return curso
}

export async function registrarEntrega(usuarioId: string, data: EntregaData) {
  const [entrega] = await db
    .insert(prodigyEntregas)
    .values({
      usuarioId,
      cursoId: data.curso_id,
      nombre: data.nombre,
      fechaEntrega: new Date(data.fecha_entrega),
      estado: data.estado ?? 'pendiente',
      prioridad: data.prioridad ?? 2,
    })
    .returning()
  return entrega
}

export async function editarEntrega(usuarioId: string, entregaId: string, data: Partial<EntregaData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.fecha_entrega !== undefined) updates.fechaEntrega = new Date(data.fecha_entrega)
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.prioridad !== undefined) updates.prioridad = data.prioridad
  const [entrega] = await db
    .update(prodigyEntregas)
    .set(updates)
    .where(and(eq(prodigyEntregas.id, entregaId), eq(prodigyEntregas.usuarioId, usuarioId), isNull(prodigyEntregas.deletedAt)))
    .returning()
  return entrega
}

export async function obtenerEntregas(usuarioId: string, filtros: { curso_id?: string } = {}) {
  const conditions = [eq(prodigyEntregas.usuarioId, usuarioId), isNull(prodigyEntregas.deletedAt)]
  if (filtros.curso_id) conditions.push(eq(prodigyEntregas.cursoId, filtros.curso_id))
  return db.select().from(prodigyEntregas).where(and(...conditions)).orderBy(desc(prodigyEntregas.fechaEntrega))
}

export async function generarHorario(usuarioId: string, cursoId: string) {
  const [curso] = await db
    .select()
    .from(prodigyCursos)
    .where(and(eq(prodigyCursos.id, cursoId), eq(prodigyCursos.usuarioId, usuarioId), isNull(prodigyCursos.deletedAt)))

  if (!curso || !curso.fechaLimite) return null

  const ahora = new Date()
  const deadline = new Date(curso.fechaLimite)
  const margenDias = 3
  const fechaLimiteBloques = new Date(deadline)
  fechaLimiteBloques.setDate(fechaLimiteBloques.getDate() - margenDias)

  const diasDisponibles = Math.max(0, Math.floor((fechaLimiteBloques.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)))
  const horasPendientes = curso.horasTotales
    ? Number(curso.horasTotales) * (1 - (curso.porcentajeCompletado ?? 0) / 100)
    : 0

  const bloques = []
  let horasRestantes = horasPendientes
  for (let i = 0; i < diasDisponibles && horasRestantes > 0; i++) {
    const fecha = new Date(ahora)
    fecha.setDate(fecha.getDate() + i + 1)
    fecha.setHours(9, 0, 0, 0)
    const horasBloque = Math.min(2, horasRestantes)
    const fin = new Date(fecha)
    fin.setHours(fin.getHours() + horasBloque)
    bloques.push({
      fecha: fecha.toISOString().split('T')[0],
      inicio: fecha,
      fin,
      horas: horasBloque,
    })
    horasRestantes -= horasBloque
  }

  return {
    curso_id: cursoId,
    deadline: deadline.toISOString().split('T')[0],
    fecha_limite_bloques: fechaLimiteBloques.toISOString().split('T')[0],
    horas_pendientes: horasPendientes,
    bloques_propuestos: bloques,
    instruccion: 'Llama a POST /prodigy/generar-horario/confirmar con los bloques seleccionados para crearlos en Cronos.',
  }
}

export async function confirmarHorario(usuarioId: string, cursoId: string, bloques: { inicio: string; fin: string; titulo?: string }[]) {
  const eventos = bloques.map((b) => ({
    usuarioId,
    titulo: b.titulo ?? 'Bloque de estudio',
    tipo: 'estudio',
    area: 'estudio',
    inicioAt: new Date(b.inicio),
    finAt: new Date(b.fin),
    seccionOrigen: 'prodigy',
    seccionRefId: cursoId,
  }))
  return db.insert(cronosEventos).values(eventos).returning()
}
