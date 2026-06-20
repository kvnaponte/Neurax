import { db } from '../../db/index.js'
import { soberbioLugares } from '../../db/schema/soberbio.js'
import { cronosEventos } from '../../db/schema/cronos.js'
import { eq, and, isNull, sql, gte, lte } from 'drizzle-orm'

type LugarData = {
  nombre: string
  tipo_cocina?: string
  ubicacion?: string
  estado?: string
  precio_estimado?: string
  fuente?: string
}

type Calificaciones = {
  ingredientes: number
  tecnica: number
  creatividad: number
  servicio: number
  ambiente: number
}

export async function agregarLugar(usuarioId: string, data: LugarData) {
  const [lugar] = await db
    .insert(soberbioLugares)
    .values({
      usuarioId,
      nombre: data.nombre,
      tipoCocina: data.tipo_cocina,
      ubicacion: data.ubicacion,
      estado: data.estado ?? 'pendiente',
      precioEstimado: data.precio_estimado,
      fuente: data.fuente ?? 'manual',
    })
    .returning()
  return lugar
}

export async function obtenerLugar(usuarioId: string, lugarId: string) {
  const [lugar] = await db
    .select()
    .from(soberbioLugares)
    .where(and(eq(soberbioLugares.id, lugarId), eq(soberbioLugares.usuarioId, usuarioId), isNull(soberbioLugares.deletedAt)))
  return lugar ?? null
}

export async function listarLugares(usuarioId: string, filtros: { estado?: string } = {}) {
  const conditions = [eq(soberbioLugares.usuarioId, usuarioId), isNull(soberbioLugares.deletedAt)]
  if (filtros.estado) conditions.push(eq(soberbioLugares.estado, filtros.estado))
  return db.select().from(soberbioLugares).where(and(...conditions))
}

export async function editarLugar(usuarioId: string, lugarId: string, data: Partial<LugarData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.tipo_cocina !== undefined) updates.tipoCocina = data.tipo_cocina
  if (data.ubicacion !== undefined) updates.ubicacion = data.ubicacion
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.precio_estimado !== undefined) updates.precioEstimado = data.precio_estimado
  if (data.fuente !== undefined) updates.fuente = data.fuente
  const [lugar] = await db
    .update(soberbioLugares)
    .set(updates)
    .where(and(eq(soberbioLugares.id, lugarId), eq(soberbioLugares.usuarioId, usuarioId), isNull(soberbioLugares.deletedAt)))
    .returning()
  return lugar
}

export async function eliminarLugar(usuarioId: string, lugarId: string) {
  const [lugar] = await db
    .update(soberbioLugares)
    .set({ deletedAt: new Date() })
    .where(and(eq(soberbioLugares.id, lugarId), eq(soberbioLugares.usuarioId, usuarioId), isNull(soberbioLugares.deletedAt)))
    .returning()
  return lugar
}

export async function seleccionarAleatorio(usuarioId: string) {
  const [lugar] = await db
    .select()
    .from(soberbioLugares)
    .where(and(eq(soberbioLugares.usuarioId, usuarioId), eq(soberbioLugares.estado, 'pendiente'), isNull(soberbioLugares.deletedAt)))
    .orderBy(sql`RANDOM()`)
    .limit(1)
  return lugar ?? null
}

export async function marcarVisitado(usuarioId: string, lugarId: string, fechaVisita?: string) {
  const [lugar] = await db
    .update(soberbioLugares)
    .set({
      estado: 'visitado',
      fechaVisita: fechaVisita ?? new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(and(eq(soberbioLugares.id, lugarId), eq(soberbioLugares.usuarioId, usuarioId), isNull(soberbioLugares.deletedAt)))
    .returning()
  return lugar
}

export async function calificarVisita(usuarioId: string, lugarId: string, cals: Calificaciones, resena?: string) {
  const calificacionFinal = ((cals.ingredientes + cals.tecnica + cals.creatividad + cals.servicio + cals.ambiente) / 5).toFixed(2)
  const [lugar] = await db
    .update(soberbioLugares)
    .set({
      calificaciones: cals,
      calificacionFinal,
      resena: resena ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(soberbioLugares.id, lugarId), eq(soberbioLugares.usuarioId, usuarioId), isNull(soberbioLugares.deletedAt)))
    .returning()
  return lugar
}

export async function sugerirFechas(usuarioId: string, _lugarId: string) {
  const fines: Date[] = []
  const hoy = new Date()
  let cursor = new Date(hoy)
  cursor.setHours(0, 0, 0, 0)

  while (fines.length < 6) {
    cursor = new Date(cursor.getTime() + 86400000)
    const dia = cursor.getDay()
    if (dia === 0 || dia === 6) fines.push(new Date(cursor))
  }

  const resultado: { fecha: string; energia_estimada: number; slots_disponibles: boolean }[] = []

  for (const fecha of fines) {
    const inicio = new Date(fecha)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(fecha)
    fin.setHours(23, 59, 59, 999)

    const eventos = await db
      .select()
      .from(cronosEventos)
      .where(
        and(
          eq(cronosEventos.usuarioId, usuarioId),
          gte(cronosEventos.inicioAt, inicio),
          lte(cronosEventos.finAt, fin),
          isNull(cronosEventos.deletedAt)
        )
      )

    const horasOcupadas = eventos.reduce((acc, e) => {
      return acc + (e.finAt.getTime() - e.inicioAt.getTime()) / 3600000
    }, 0)

    const energiaEstimada = Math.max(0, Math.round((1 - horasOcupadas / 12) * 100))
    const slotsDisponibles = horasOcupadas < 8

    resultado.push({
      fecha: fecha.toISOString().split('T')[0],
      energia_estimada: energiaEstimada,
      slots_disponibles: slotsDisponibles,
    })

    if (resultado.length === 3) break
  }

  return resultado
}
