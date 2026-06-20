import { db } from '../../db/index.js'
import { nemesisJuegos } from '../../db/schema/contenido.js'
import { eq, and, isNull, desc, sql, sum, max } from 'drizzle-orm'

type JuegoData = {
  nombre: string
  plataforma?: string
  genero?: string
  estado?: string
  fecha_inicio?: string
  fecha_completado?: string
  horas_jugadas?: string
  precio?: string
  cover_url?: string
}

type Criterios = {
  historia: number
  jugabilidad: number
  graficos: number
  musica: number
  rejugabilidad: number
  dificultad: number
}

export async function registrarJuego(usuarioId: string, data: JuegoData) {
  const [juego] = await db
    .insert(nemesisJuegos)
    .values({
      usuarioId,
      nombre: data.nombre,
      plataforma: data.plataforma,
      genero: data.genero,
      estado: data.estado ?? 'por_jugar',
      fechaInicio: data.fecha_inicio ?? null,
      fechaCompletado: data.fecha_completado ?? null,
      horasJugadas: data.horas_jugadas,
      precio: data.precio,
      coverUrl: data.cover_url,
    })
    .returning()
  return juego
}

export async function calificarJuego(usuarioId: string, juegoId: string, criterios: Criterios) {
  const { historia, jugabilidad, graficos, musica, rejugabilidad, dificultad } = criterios
  const suma = historia + jugabilidad + graficos + musica + rejugabilidad + dificultad
  const calificacionFinal = (suma / 6).toFixed(2)

  const [juego] = await db
    .update(nemesisJuegos)
    .set({
      criterioHistoria: historia,
      criterioJugabilidad: jugabilidad,
      criterioGraficos: graficos,
      criterioMusica: musica,
      criterioRejugabilidad: rejugabilidad,
      criterioDificultad: dificultad,
      calificacionFinal,
      estado: 'calificado',
      updatedAt: new Date(),
    })
    .where(and(eq(nemesisJuegos.id, juegoId), eq(nemesisJuegos.usuarioId, usuarioId), isNull(nemesisJuegos.deletedAt)))
    .returning()
  return juego
}

export async function obtenerEstadisticas(usuarioId: string) {
  const juegos = await db
    .select()
    .from(nemesisJuegos)
    .where(and(eq(nemesisJuegos.usuarioId, usuarioId), isNull(nemesisJuegos.deletedAt)))

  const totalPorEstado: Record<string, number> = {}
  let horasLifetime = 0
  let gastoTotal = 0
  let mejorCalificado = null as typeof juegos[0] | null
  const plataformaConteo: Record<string, number> = {}

  for (const j of juegos) {
    totalPorEstado[j.estado] = (totalPorEstado[j.estado] ?? 0) + 1
    horasLifetime += j.horasJugadas ? Number(j.horasJugadas) : 0
    gastoTotal += j.precio ? Number(j.precio) : 0
    if (j.plataforma) plataformaConteo[j.plataforma] = (plataformaConteo[j.plataforma] ?? 0) + 1
    if (j.calificacionFinal && (!mejorCalificado || Number(j.calificacionFinal) > Number(mejorCalificado.calificacionFinal))) {
      mejorCalificado = j
    }
  }

  const plataformaFavorita = Object.entries(plataformaConteo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    total_por_estado: totalPorEstado,
    horas_lifetime: horasLifetime,
    mejor_calificado: mejorCalificado,
    gasto_total: gastoTotal,
    plataforma_favorita: plataformaFavorita,
  }
}

export async function obtenerJuegos(usuarioId: string, filtros: { estado?: string; plataforma?: string } = {}) {
  const conditions = [eq(nemesisJuegos.usuarioId, usuarioId), isNull(nemesisJuegos.deletedAt)]
  if (filtros.estado) conditions.push(eq(nemesisJuegos.estado, filtros.estado))
  if (filtros.plataforma) conditions.push(eq(nemesisJuegos.plataforma, filtros.plataforma))
  return db.select().from(nemesisJuegos).where(and(...conditions)).orderBy(desc(nemesisJuegos.createdAt))
}

export async function editarJuego(usuarioId: string, juegoId: string, data: Partial<JuegoData> & { criterios?: Criterios }) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.plataforma !== undefined) updates.plataforma = data.plataforma
  if (data.genero !== undefined) updates.genero = data.genero
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.fecha_inicio !== undefined) updates.fechaInicio = data.fecha_inicio
  if (data.fecha_completado !== undefined) updates.fechaCompletado = data.fecha_completado
  if (data.horas_jugadas !== undefined) updates.horasJugadas = data.horas_jugadas
  if (data.precio !== undefined) updates.precio = data.precio
  if (data.cover_url !== undefined) updates.coverUrl = data.cover_url
  if (data.criterios) {
    const { historia, jugabilidad, graficos, musica, rejugabilidad, dificultad } = data.criterios
    updates.criterioHistoria = historia
    updates.criterioJugabilidad = jugabilidad
    updates.criterioGraficos = graficos
    updates.criterioMusica = musica
    updates.criterioRejugabilidad = rejugabilidad
    updates.criterioDificultad = dificultad
    updates.calificacionFinal = ((historia + jugabilidad + graficos + musica + rejugabilidad + dificultad) / 6).toFixed(2)
    updates.estado = 'calificado'
  }
  const [juego] = await db
    .update(nemesisJuegos)
    .set(updates)
    .where(and(eq(nemesisJuegos.id, juegoId), eq(nemesisJuegos.usuarioId, usuarioId), isNull(nemesisJuegos.deletedAt)))
    .returning()
  return juego
}

export async function eliminarJuego(usuarioId: string, juegoId: string) {
  const [juego] = await db
    .update(nemesisJuegos)
    .set({ deletedAt: new Date() })
    .where(and(eq(nemesisJuegos.id, juegoId), eq(nemesisJuegos.usuarioId, usuarioId), isNull(nemesisJuegos.deletedAt)))
    .returning()
  return juego
}
