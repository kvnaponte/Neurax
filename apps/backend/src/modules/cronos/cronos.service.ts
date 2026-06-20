import { db } from '../../db/index.js'
import { cronosEventos } from '../../db/schema/cronos.js'
import { eq, and, isNull } from 'drizzle-orm'

type EventoData = {
  titulo: string
  tipo?: string
  area?: string
  inicio_at: string
  fin_at: string
  prioridad?: string
  seccion_origen?: string
  seccion_ref_id?: string
  metadata?: Record<string, unknown>
}

export async function crearEvento(usuarioId: string, data: EventoData) {
  const [evento] = await db
    .insert(cronosEventos)
    .values({
      usuarioId,
      titulo: data.titulo,
      tipo: data.tipo,
      area: data.area,
      inicioAt: new Date(data.inicio_at),
      finAt: new Date(data.fin_at),
      prioridad: data.prioridad ?? '2',
      seccionOrigen: data.seccion_origen,
      seccionRefId: data.seccion_ref_id,
      metadata: data.metadata,
    })
    .returning()
  return evento
}

export async function completarEvento(usuarioId: string, eventoId: string) {
  const [evento] = await db
    .update(cronosEventos)
    .set({ completado: true })
    .where(and(eq(cronosEventos.id, eventoId), eq(cronosEventos.usuarioId, usuarioId), isNull(cronosEventos.deletedAt)))
    .returning()

  if (!evento) return null

  if (evento.seccionOrigen === 'soberbio') {
    return { ...evento, trigger: { action: 'rate_visit', seccion_ref_id: evento.seccionRefId } }
  }

  return evento
}
