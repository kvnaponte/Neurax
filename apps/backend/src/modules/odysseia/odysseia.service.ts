import { db } from '../../db/index.js'
import { odysseiaDestinos } from '../../db/schema/contenido.js'
import { eq, and, isNull, desc } from 'drizzle-orm'

type DestinoData = {
  nombre: string
  pais?: string
  categorias?: string[]
  estado?: string
  fecha_visita?: string
  duracion_dias?: number
  fotos_urls?: string[]
  calificacion?: number
  costo_estimado?: string
}

export async function registrarDestino(usuarioId: string, data: DestinoData) {
  const [destino] = await db
    .insert(odysseiaDestinos)
    .values({
      usuarioId,
      nombre: data.nombre,
      pais: data.pais,
      categorias: data.categorias,
      estado: data.estado ?? 'pendiente',
      fechaVisita: data.fecha_visita ?? null,
      duracionDias: data.duracion_dias,
      fotosUrls: data.fotos_urls,
      calificacion: data.calificacion,
      costoEstimado: data.costo_estimado,
    })
    .returning()
  return destino
}

export async function marcarVisitado(usuarioId: string, destinoId: string, fotosUrls?: string[]) {
  const [destino] = await db
    .update(odysseiaDestinos)
    .set({
      estado: 'visitado',
      fechaVisita: new Date().toISOString().split('T')[0],
      ...(fotosUrls ? { fotosUrls } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(odysseiaDestinos.id, destinoId),
        eq(odysseiaDestinos.usuarioId, usuarioId),
        isNull(odysseiaDestinos.deletedAt)
      )
    )
    .returning()
  return destino
}

export async function obtenerDestinos(usuarioId: string, filtros: { estado?: string; pais?: string } = {}) {
  const conditions = [eq(odysseiaDestinos.usuarioId, usuarioId), isNull(odysseiaDestinos.deletedAt)]
  if (filtros.estado) conditions.push(eq(odysseiaDestinos.estado, filtros.estado))
  if (filtros.pais) conditions.push(eq(odysseiaDestinos.pais, filtros.pais))
  return db.select().from(odysseiaDestinos).where(and(...conditions)).orderBy(desc(odysseiaDestinos.createdAt))
}

export async function editarDestino(usuarioId: string, destinoId: string, data: Partial<DestinoData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.pais !== undefined) updates.pais = data.pais
  if (data.categorias !== undefined) updates.categorias = data.categorias
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.fecha_visita !== undefined) updates.fechaVisita = data.fecha_visita
  if (data.duracion_dias !== undefined) updates.duracionDias = data.duracion_dias
  if (data.fotos_urls !== undefined) updates.fotosUrls = data.fotos_urls
  if (data.calificacion !== undefined) updates.calificacion = data.calificacion
  if (data.costo_estimado !== undefined) updates.costoEstimado = data.costo_estimado
  const [destino] = await db
    .update(odysseiaDestinos)
    .set(updates)
    .where(and(eq(odysseiaDestinos.id, destinoId), eq(odysseiaDestinos.usuarioId, usuarioId), isNull(odysseiaDestinos.deletedAt)))
    .returning()
  return destino
}

export async function eliminarDestino(usuarioId: string, destinoId: string) {
  const [destino] = await db
    .update(odysseiaDestinos)
    .set({ deletedAt: new Date() })
    .where(and(eq(odysseiaDestinos.id, destinoId), eq(odysseiaDestinos.usuarioId, usuarioId), isNull(odysseiaDestinos.deletedAt)))
    .returning()
  return destino
}
