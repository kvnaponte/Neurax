import { and, eq, gte, lte, lt, gt, isNull, asc, sql, ne } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { cronos_eventos, usuarios, xp_events } from '../../db/schema'
import { emitToUser } from '../../shared/io'
import { makeEnergiaService } from './energia.service'

type DB = PostgresJsDatabase<typeof schema>

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export interface CrearEventoInput {
  titulo: string
  tipo: string
  area?: string
  inicio_at: Date
  fin_at: Date
  prioridad?: number
  seccion_origen?: string
  seccion_ref_id?: string
  metadata?: Record<string, unknown>
}

export type MoverOpcion = 'reemplazar' | 'deslizar' | 'intercambiar'

export function makeCronosService(db: DB) {
  const energiaService = makeEnergiaService(db)

  function fechaStr(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  async function verificarSolapamiento(usuarioId: string, inicio: Date, fin: Date, excludeId?: string) {
    const conditions = [
      eq(cronos_eventos.usuario_id, usuarioId),
      isNull(cronos_eventos.deleted_at),
      lt(cronos_eventos.inicio_at, fin),
      gt(cronos_eventos.fin_at, inicio),
    ]
    if (excludeId) conditions.push(ne(cronos_eventos.id, excludeId))

    return db.select({ id: cronos_eventos.id }).from(cronos_eventos).where(and(...conditions))
  }

  async function crearEvento(usuarioId: string, data: CrearEventoInput) {
    if (data.inicio_at >= data.fin_at) throw makeError('inicio_at debe ser antes que fin_at', 400)

    const conflictos = await verificarSolapamiento(usuarioId, data.inicio_at, data.fin_at)
    if (conflictos.length > 0) throw makeError('El evento se solapa con otro evento existente', 409)

    const [evento] = await db.insert(cronos_eventos).values({
      usuario_id: usuarioId,
      titulo: data.titulo,
      tipo: data.tipo,
      area: data.area,
      inicio_at: data.inicio_at,
      fin_at: data.fin_at,
      prioridad: data.prioridad ?? 2,
      seccion_origen: data.seccion_origen,
      seccion_ref_id: data.seccion_ref_id,
      metadata: data.metadata,
    }).returning()

    await energiaService.propagarEnergiaDelDia(usuarioId, fechaStr(data.inicio_at))
    emitToUser(usuarioId, 'cronos:event_updated',{ action: 'created', evento_id: evento.id })

    return evento
  }

  async function moverEvento(usuarioId: string, eventoId: string, nuevoInicio: Date, opcion: MoverOpcion) {
    const [origen] = await db
      .select()
      .from(cronos_eventos)
      .where(and(eq(cronos_eventos.id, eventoId), eq(cronos_eventos.usuario_id, usuarioId), isNull(cronos_eventos.deleted_at)))
      .limit(1)

    if (!origen) throw makeError('Evento no encontrado', 404)

    const duracionMs = origen.fin_at.getTime() - origen.inicio_at.getTime()
    const nuevoFin = new Date(nuevoInicio.getTime() + duracionMs)

    if (opcion === 'reemplazar') {
      await db.update(cronos_eventos)
        .set({ deleted_at: new Date() })
        .where(and(
          eq(cronos_eventos.usuario_id, usuarioId),
          isNull(cronos_eventos.deleted_at),
          ne(cronos_eventos.id, eventoId),
          lt(cronos_eventos.inicio_at, nuevoFin),
          gt(cronos_eventos.fin_at, nuevoInicio),
        ))

      await db.update(cronos_eventos)
        .set({ inicio_at: nuevoInicio, fin_at: nuevoFin, updated_at: new Date() })
        .where(eq(cronos_eventos.id, eventoId))

    } else if (opcion === 'deslizar') {
      const siguientes = await db
        .select()
        .from(cronos_eventos)
        .where(and(
          eq(cronos_eventos.usuario_id, usuarioId),
          isNull(cronos_eventos.deleted_at),
          ne(cronos_eventos.id, eventoId),
          gte(cronos_eventos.inicio_at, nuevoInicio),
        ))
        .orderBy(asc(cronos_eventos.inicio_at))

      for (const ev of siguientes) {
        const evDurMs = ev.fin_at.getTime() - ev.inicio_at.getTime()
        const nuevoInicioEv = new Date(ev.inicio_at.getTime() + duracionMs)
        await db.update(cronos_eventos)
          .set({ inicio_at: nuevoInicioEv, fin_at: new Date(nuevoInicioEv.getTime() + evDurMs), updated_at: new Date() })
          .where(eq(cronos_eventos.id, ev.id))
      }

      await db.update(cronos_eventos)
        .set({ inicio_at: nuevoInicio, fin_at: nuevoFin, updated_at: new Date() })
        .where(eq(cronos_eventos.id, eventoId))

    } else if (opcion === 'intercambiar') {
      const [destino] = await db
        .select()
        .from(cronos_eventos)
        .where(and(
          eq(cronos_eventos.usuario_id, usuarioId),
          isNull(cronos_eventos.deleted_at),
          ne(cronos_eventos.id, eventoId),
          lt(cronos_eventos.inicio_at, nuevoFin),
          gt(cronos_eventos.fin_at, nuevoInicio),
        ))
        .limit(1)

      if (!destino) throw makeError('No hay evento en el destino para intercambiar', 409)

      await db.update(cronos_eventos)
        .set({ inicio_at: destino.inicio_at, fin_at: destino.fin_at, updated_at: new Date() })
        .where(eq(cronos_eventos.id, eventoId))

      await db.update(cronos_eventos)
        .set({ inicio_at: origen.inicio_at, fin_at: origen.fin_at, updated_at: new Date() })
        .where(eq(cronos_eventos.id, destino.id))
    }

    await energiaService.propagarEnergiaDelDia(usuarioId, fechaStr(nuevoInicio))
    emitToUser(usuarioId, 'cronos:event_updated',{ action: 'moved', evento_id: eventoId })
  }

  async function completarEvento(usuarioId: string, eventoId: string) {
    const [evento] = await db
      .select()
      .from(cronos_eventos)
      .where(and(eq(cronos_eventos.id, eventoId), eq(cronos_eventos.usuario_id, usuarioId), isNull(cronos_eventos.deleted_at)))
      .limit(1)

    if (!evento) throw makeError('Evento no encontrado', 404)

    const now = new Date()
    const diffMin = Math.abs(now.getTime() - evento.fin_at.getTime()) / 60000
    const impuntual = diffMin > 15

    await db.update(cronos_eventos)
      .set({ completado: true, completado_at: now, xp_penalizacion_impuntualidad: impuntual, updated_at: now })
      .where(eq(cronos_eventos.id, eventoId))

    let xpDelta = 0
    if (impuntual && evento.seccion_ref_id) {
      const [lastXp] = await db
        .select({ xp_base: xp_events.xp_base })
        .from(xp_events)
        .where(eq(xp_events.fuente_id, evento.seccion_ref_id))
        .orderBy(sql`${xp_events.created_at} desc`)
        .limit(1)

      if (lastXp) {
        const penalizacion = -Math.round(lastXp.xp_base * 0.15)
        await db.insert(xp_events).values({
          usuario_id: usuarioId,
          fuente: 'cronos_impuntualidad',
          fuente_id: eventoId,
          xp_amount: penalizacion,
          xp_base: lastXp.xp_base,
          bonus_racha: '1.00',
          bonus_horario: '1.00',
        })
        await db.update(usuarios)
          .set({ xp_total: sql`${usuarios.xp_total} + ${penalizacion}`, updated_at: now })
          .where(eq(usuarios.id, usuarioId))

        xpDelta = penalizacion
        emitToUser(usuarioId, 'xp:updated', { xp_delta: penalizacion })
      }
    }

    if (evento.tipo === 'leonidas') {
      return { completado: true, impuntual, xp_delta: xpDelta, action: 'register_leonidas_session' }
    }
    if (evento.tipo === 'soberbio') {
      return { completado: true, impuntual, xp_delta: xpDelta, action: 'trigger_calificacion_post_visita' }
    }

    return { completado: true, impuntual, xp_delta: xpDelta }
  }

  async function obtenerEventosDelDia(usuarioId: string, fecha: string) {
    return db
      .select()
      .from(cronos_eventos)
      .where(and(
        eq(cronos_eventos.usuario_id, usuarioId),
        gte(cronos_eventos.inicio_at, new Date(`${fecha}T00:00:00.000Z`)),
        lte(cronos_eventos.inicio_at, new Date(`${fecha}T23:59:59.999Z`)),
        isNull(cronos_eventos.deleted_at),
      ))
      .orderBy(asc(cronos_eventos.inicio_at))
  }

  async function obtenerDisponibilidad(usuarioId: string, fecha: string) {
    const eventos = await obtenerEventosDelDia(usuarioId, fecha)
    const slots: { inicio: string; fin: string }[] = []

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const slotInicio = new Date(`${fecha}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`)
        const slotFin = new Date(slotInicio.getTime() + 30 * 60000)
        const solapado = eventos.some(ev => ev.inicio_at < slotFin && ev.fin_at > slotInicio)
        if (!solapado) slots.push({ inicio: slotInicio.toISOString(), fin: slotFin.toISOString() })
      }
    }

    return slots
  }

  async function obtenerEventosPorRango(usuarioId: string, inicio: Date, fin: Date) {
    return db
      .select()
      .from(cronos_eventos)
      .where(and(
        eq(cronos_eventos.usuario_id, usuarioId),
        gte(cronos_eventos.inicio_at, inicio),
        lte(cronos_eventos.inicio_at, fin),
        isNull(cronos_eventos.deleted_at),
      ))
      .orderBy(asc(cronos_eventos.inicio_at))
  }

  async function actualizarEvento(usuarioId: string, eventoId: string, data: Partial<CrearEventoInput>) {
    const [existing] = await db
      .select()
      .from(cronos_eventos)
      .where(and(eq(cronos_eventos.id, eventoId), eq(cronos_eventos.usuario_id, usuarioId), isNull(cronos_eventos.deleted_at)))
      .limit(1)

    if (!existing) throw makeError('Evento no encontrado', 404)

    const inicio = data.inicio_at ?? existing.inicio_at
    const fin = data.fin_at ?? existing.fin_at

    if (inicio >= fin) throw makeError('inicio_at debe ser antes que fin_at', 400)

    if (data.inicio_at || data.fin_at) {
      const conflictos = await verificarSolapamiento(usuarioId, inicio, fin, eventoId)
      if (conflictos.length > 0) throw makeError('El evento se solapa con otro evento existente', 409)
    }

    const [updated] = await db.update(cronos_eventos)
      .set({ ...data, updated_at: new Date() })
      .where(eq(cronos_eventos.id, eventoId))
      .returning()

    await energiaService.propagarEnergiaDelDia(usuarioId, fechaStr(inicio))
    emitToUser(usuarioId, 'cronos:event_updated',{ action: 'updated', evento_id: eventoId })

    return updated
  }

  async function eliminarEvento(usuarioId: string, eventoId: string) {
    const [existing] = await db
      .select()
      .from(cronos_eventos)
      .where(and(eq(cronos_eventos.id, eventoId), eq(cronos_eventos.usuario_id, usuarioId), isNull(cronos_eventos.deleted_at)))
      .limit(1)

    if (!existing) throw makeError('Evento no encontrado', 404)

    await db.update(cronos_eventos)
      .set({ deleted_at: new Date() })
      .where(eq(cronos_eventos.id, eventoId))

    await energiaService.propagarEnergiaDelDia(usuarioId, fechaStr(existing.inicio_at))
    emitToUser(usuarioId, 'cronos:event_updated',{ action: 'deleted', evento_id: eventoId })
  }

  return {
    crearEvento,
    moverEvento,
    completarEvento,
    obtenerEventosDelDia,
    obtenerDisponibilidad,
    obtenerEventosPorRango,
    actualizarEvento,
    eliminarEvento,
    energiaService,
  }
}

export type CronosService = ReturnType<typeof makeCronosService>
