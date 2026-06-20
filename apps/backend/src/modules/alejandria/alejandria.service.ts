import { db } from '../../db/index.js'
import { alejandriLibros } from '../../db/schema/contenido.js'
import { eq, and, isNull, desc } from 'drizzle-orm'

type LibroData = {
  titulo: string
  autor?: string
  genero?: string
  estado?: string
  paginas_totales?: number
  paginas_leidas?: number
  fecha_inicio?: string
  fecha_fin?: string
  cover_url?: string
  resena?: string
}

type Criterios = {
  escritura: number
  trama: number
  personajes: number
  ritmo: number
  impacto_personal: number
}

export async function registrarLibro(usuarioId: string, data: LibroData) {
  const [libro] = await db
    .insert(alejandriLibros)
    .values({
      usuarioId,
      titulo: data.titulo,
      autor: data.autor,
      genero: data.genero,
      estado: data.estado ?? 'pendiente',
      paginasTotales: data.paginas_totales,
      paginasLeidas: data.paginas_leidas ?? 0,
      fechaInicio: data.fecha_inicio ?? null,
      fechaFin: data.fecha_fin ?? null,
      coverUrl: data.cover_url,
      resena: data.resena,
    })
    .returning()
  return libro
}

export async function calificarLibro(usuarioId: string, libroId: string, criterios: Criterios, resena?: string) {
  const { escritura, trama, personajes, ritmo, impacto_personal } = criterios
  const calificacionFinal = ((escritura + trama + personajes + ritmo + impacto_personal) / 5).toFixed(2)

  const [libro] = await db
    .update(alejandriLibros)
    .set({
      criterioEscritura: escritura,
      criterioTrama: trama,
      criterioPersonajes: personajes,
      criterioRitmo: ritmo,
      criterioImpactoPersonal: impacto_personal,
      calificacionFinal,
      resena: resena,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(alejandriLibros.id, libroId),
        eq(alejandriLibros.usuarioId, usuarioId),
        isNull(alejandriLibros.deletedAt)
      )
    )
    .returning()
  return libro
}

export async function obtenerLibros(usuarioId: string, filtros: { estado?: string; genero?: string } = {}) {
  const conditions = [eq(alejandriLibros.usuarioId, usuarioId), isNull(alejandriLibros.deletedAt)]
  if (filtros.estado) conditions.push(eq(alejandriLibros.estado, filtros.estado))
  if (filtros.genero) conditions.push(eq(alejandriLibros.genero, filtros.genero))
  return db.select().from(alejandriLibros).where(and(...conditions)).orderBy(desc(alejandriLibros.createdAt))
}

export async function editarLibro(usuarioId: string, libroId: string, data: Partial<LibroData> & { criterios?: Criterios }) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.titulo !== undefined) updates.titulo = data.titulo
  if (data.autor !== undefined) updates.autor = data.autor
  if (data.genero !== undefined) updates.genero = data.genero
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.paginas_totales !== undefined) updates.paginasTotales = data.paginas_totales
  if (data.paginas_leidas !== undefined) updates.paginasLeidas = data.paginas_leidas
  if (data.fecha_inicio !== undefined) updates.fechaInicio = data.fecha_inicio
  if (data.fecha_fin !== undefined) updates.fechaFin = data.fecha_fin
  if (data.cover_url !== undefined) updates.coverUrl = data.cover_url
  if (data.resena !== undefined) updates.resena = data.resena
  if (data.criterios) {
    const { escritura, trama, personajes, ritmo, impacto_personal } = data.criterios
    updates.criterioEscritura = escritura
    updates.criterioTrama = trama
    updates.criterioPersonajes = personajes
    updates.criterioRitmo = ritmo
    updates.criterioImpactoPersonal = impacto_personal
    updates.calificacionFinal = ((escritura + trama + personajes + ritmo + impacto_personal) / 5).toFixed(2)
  }
  const [libro] = await db
    .update(alejandriLibros)
    .set(updates)
    .where(and(eq(alejandriLibros.id, libroId), eq(alejandriLibros.usuarioId, usuarioId), isNull(alejandriLibros.deletedAt)))
    .returning()
  return libro
}

export async function eliminarLibro(usuarioId: string, libroId: string) {
  const [libro] = await db
    .update(alejandriLibros)
    .set({ deletedAt: new Date() })
    .where(and(eq(alejandriLibros.id, libroId), eq(alejandriLibros.usuarioId, usuarioId), isNull(alejandriLibros.deletedAt)))
    .returning()
  return libro
}
