import { db } from '../../db/index.js'
import { michelinRecetas } from '../../db/schema/contenido.js'
import { eq, and, isNull, sql } from 'drizzle-orm'

type RecetaData = {
  nombre: string
  tipo?: string
  origen?: string
  dificultad?: number
  tiempo_minutos?: number
  ingredientes?: string[]
  instrucciones?: string
  estado?: string
  url_referencia?: string
  foto_url?: string
}

export async function registrarReceta(usuarioId: string, data: RecetaData) {
  const [receta] = await db
    .insert(michelinRecetas)
    .values({
      usuarioId,
      nombre: data.nombre,
      tipo: data.tipo,
      origen: data.origen,
      dificultad: data.dificultad,
      tiempoMinutos: data.tiempo_minutos,
      ingredientes: data.ingredientes,
      instrucciones: data.instrucciones,
      estado: data.estado ?? 'pendiente',
      urlReferencia: data.url_referencia,
      fotoUrl: data.foto_url,
    })
    .returning()
  return receta
}

export async function sugerirAleatoria(usuarioId: string, filtros: { dificultad?: number; tiempo_max?: number } = {}) {
  const conditions = [
    eq(michelinRecetas.usuarioId, usuarioId),
    eq(michelinRecetas.estado, 'pendiente'),
    isNull(michelinRecetas.deletedAt),
  ]
  if (filtros.dificultad !== undefined) conditions.push(eq(michelinRecetas.dificultad, filtros.dificultad))

  const pendientes = await db
    .select()
    .from(michelinRecetas)
    .where(and(...conditions))

  if (!pendientes.length) return null

  if (filtros.tiempo_max !== undefined) {
    const filtradas = pendientes.filter(
      (r) => r.tiempoMinutos !== null && r.tiempoMinutos !== undefined && Number(r.tiempoMinutos) <= filtros.tiempo_max!
    )
    if (!filtradas.length) return null
    return filtradas[Math.floor(Math.random() * filtradas.length)]
  }

  return pendientes[Math.floor(Math.random() * pendientes.length)]
}

export async function marcarCocinada(usuarioId: string, recetaId: string) {
  const [receta] = await db
    .update(michelinRecetas)
    .set({
      estado: 'cocinada',
      vecesCocinada: sql`${michelinRecetas.vecesCocinada} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(michelinRecetas.id, recetaId),
        eq(michelinRecetas.usuarioId, usuarioId),
        isNull(michelinRecetas.deletedAt)
      )
    )
    .returning()
  return receta
}

export async function obtenerRecetas(usuarioId: string, filtros: { tipo?: string; estado?: string } = {}) {
  const conditions = [eq(michelinRecetas.usuarioId, usuarioId), isNull(michelinRecetas.deletedAt)]
  if (filtros.tipo) conditions.push(eq(michelinRecetas.tipo, filtros.tipo))
  if (filtros.estado) conditions.push(eq(michelinRecetas.estado, filtros.estado))
  return db.select().from(michelinRecetas).where(and(...conditions))
}

export async function editarReceta(usuarioId: string, recetaId: string, data: Partial<RecetaData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.tipo !== undefined) updates.tipo = data.tipo
  if (data.origen !== undefined) updates.origen = data.origen
  if (data.dificultad !== undefined) updates.dificultad = data.dificultad
  if (data.tiempo_minutos !== undefined) updates.tiempoMinutos = data.tiempo_minutos
  if (data.ingredientes !== undefined) updates.ingredientes = data.ingredientes
  if (data.instrucciones !== undefined) updates.instrucciones = data.instrucciones
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.url_referencia !== undefined) updates.urlReferencia = data.url_referencia
  if (data.foto_url !== undefined) updates.fotoUrl = data.foto_url
  const [receta] = await db
    .update(michelinRecetas)
    .set(updates)
    .where(and(eq(michelinRecetas.id, recetaId), eq(michelinRecetas.usuarioId, usuarioId), isNull(michelinRecetas.deletedAt)))
    .returning()
  return receta
}

export async function eliminarReceta(usuarioId: string, recetaId: string) {
  const [receta] = await db
    .update(michelinRecetas)
    .set({ deletedAt: new Date() })
    .where(and(eq(michelinRecetas.id, recetaId), eq(michelinRecetas.usuarioId, usuarioId), isNull(michelinRecetas.deletedAt)))
    .returning()
  return receta
}
