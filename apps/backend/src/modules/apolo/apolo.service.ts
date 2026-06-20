import { db } from '../../db/index.js'
import { apoloPeliculas } from '../../db/schema/apolo.js'
import { eq, and, isNull, desc, ilike, or } from 'drizzle-orm'

type EstadoPelicula = 'pendiente' | 'vista'

type RegistrarPeliculaData = {
  year?: number
  movie: string
  director?: string
  country?: string
  producer?: string
  distributed?: string
  genre?: string
  estado?: EstadoPelicula
  fecha_visualizacion?: string
}

type FiltrosPeliculas = {
  estado?: string
  genero?: string
  categoria?: string
  search?: string
  page?: number
  limit?: number
}

function calcularCategory(rating: number): string {
  if (rating >= 4.5) return 'DIAMOND'
  if (rating >= 4.0) return 'GOLD'
  if (rating >= 3.5) return 'PLATINUM'
  if (rating >= 3.0) return 'GOOD'
  if (rating >= 2.0) return 'ACEPTABLE'
  return 'BAD'
}

export async function registrarPelicula(usuarioId: string, data: RegistrarPeliculaData) {
  const [pelicula] = await db
    .insert(apoloPeliculas)
    .values({
      usuarioId,
      year: data.year,
      movie: data.movie,
      director: data.director,
      country: data.country,
      producer: data.producer,
      distributed: data.distributed,
      genre: data.genre,
      estado: data.estado ?? 'pendiente',
      fechaVisualizacion: data.fecha_visualizacion ?? null,
    })
    .returning()

  return pelicula
}

export async function calificarPelicula(
  usuarioId: string,
  peliculaId: string,
  rating: number,
  fechaVisualizacion?: string
) {
  const category = calcularCategory(rating)
  const ratingStr = rating.toFixed(1)

  const [pelicula] = await db
    .update(apoloPeliculas)
    .set({
      rating: ratingStr,
      stars: ratingStr,
      category,
      estado: 'vista',
      fechaVisualizacion: fechaVisualizacion ?? new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(apoloPeliculas.id, peliculaId),
        eq(apoloPeliculas.usuarioId, usuarioId),
        isNull(apoloPeliculas.deletedAt)
      )
    )
    .returning()

  return pelicula
}

export async function obtenerNivelCinefilo(usuarioId: string) {
  const vistas = await db
    .select({ id: apoloPeliculas.id })
    .from(apoloPeliculas)
    .where(
      and(
        eq(apoloPeliculas.usuarioId, usuarioId),
        eq(apoloPeliculas.estado, 'vista'),
        isNull(apoloPeliculas.deletedAt)
      )
    )

  const cantidad = vistas.length

  type Nivel = {
    nombre: string
    min: number
    max: number | null
  }

  const niveles: Nivel[] = [
    { nombre: 'NOVATO', min: 0, max: 5 },
    { nombre: 'INTERESADO', min: 6, max: 20 },
    { nombre: 'EMPODERADO', min: 21, max: 60 },
    { nombre: 'SOBERBIO', min: 61, max: 150 },
    { nombre: 'ERUDITO', min: 151, max: 400 },
    { nombre: 'DESPIERTO', min: 401, max: 999 },
    { nombre: 'ILUMINADO', min: 1000, max: null },
  ]

  const nivelActual = niveles.findLast((n) => cantidad >= n.min) ?? niveles[0]
  const indiceActual = niveles.indexOf(nivelActual)
  const proximoNivel = niveles[indiceActual + 1] ?? null

  return {
    nivel: nivelActual.nombre,
    peliculas_vistas: cantidad,
    proximo_umbral: proximoNivel ? proximoNivel.min : null,
    proximo_nivel: proximoNivel ? proximoNivel.nombre : null,
  }
}

export async function obtenerTop5(usuarioId: string) {
  return db
    .select()
    .from(apoloPeliculas)
    .where(
      and(
        eq(apoloPeliculas.usuarioId, usuarioId),
        eq(apoloPeliculas.estado, 'vista'),
        isNull(apoloPeliculas.deletedAt)
      )
    )
    .orderBy(desc(apoloPeliculas.rating))
    .limit(5)
}

export async function obtenerPeliculas(usuarioId: string, filtros: FiltrosPeliculas = {}) {
  const { estado, genero, categoria, search, page = 1, limit = 20 } = filtros
  const offset = (page - 1) * limit

  const conditions = [
    eq(apoloPeliculas.usuarioId, usuarioId),
    isNull(apoloPeliculas.deletedAt),
  ]

  if (estado) conditions.push(eq(apoloPeliculas.estado, estado))
  if (genero) conditions.push(eq(apoloPeliculas.genre, genero))
  if (categoria) conditions.push(eq(apoloPeliculas.category, categoria))
  if (search) {
    conditions.push(
      or(
        ilike(apoloPeliculas.movie, `%${search}%`),
        ilike(apoloPeliculas.director, `%${search}%`)
      )!
    )
  }

  return db
    .select()
    .from(apoloPeliculas)
    .where(and(...conditions))
    .orderBy(desc(apoloPeliculas.createdAt))
    .limit(limit)
    .offset(offset)
}

export async function editarPelicula(
  usuarioId: string,
  peliculaId: string,
  data: Partial<RegistrarPeliculaData> & { rating?: number }
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (data.year !== undefined) updates.year = data.year
  if (data.movie !== undefined) updates.movie = data.movie
  if (data.director !== undefined) updates.director = data.director
  if (data.country !== undefined) updates.country = data.country
  if (data.producer !== undefined) updates.producer = data.producer
  if (data.distributed !== undefined) updates.distributed = data.distributed
  if (data.genre !== undefined) updates.genre = data.genre
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.fecha_visualizacion !== undefined) updates.fechaVisualizacion = data.fecha_visualizacion
  if (data.rating !== undefined) {
    const ratingStr = data.rating.toFixed(1)
    updates.rating = ratingStr
    updates.stars = ratingStr
    updates.category = calcularCategory(data.rating)
    updates.estado = 'vista'
  }

  const [pelicula] = await db
    .update(apoloPeliculas)
    .set(updates)
    .where(
      and(
        eq(apoloPeliculas.id, peliculaId),
        eq(apoloPeliculas.usuarioId, usuarioId),
        isNull(apoloPeliculas.deletedAt)
      )
    )
    .returning()

  return pelicula
}

export async function eliminarPelicula(usuarioId: string, peliculaId: string) {
  const [pelicula] = await db
    .update(apoloPeliculas)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(apoloPeliculas.id, peliculaId),
        eq(apoloPeliculas.usuarioId, usuarioId),
        isNull(apoloPeliculas.deletedAt)
      )
    )
    .returning()

  return pelicula
}
