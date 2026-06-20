import { and, eq, gte, lte, lt, isNull, notInArray, sql, desc, asc, count } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { odin_misiones_catalogo, odin_misiones_usuario, odin_cofres, actividades, usuarios } from '../../db/schema'
import { getIo } from '../../shared/io'
import { makeXpService } from '../gamification/xp.service'
import { getCatalogMap } from './odin.catalog'
import { crearNotificacion } from '../notifications/notifications.service'

type DB = PostgresJsDatabase<typeof schema>

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export interface ActividadInput {
  tipo: string
  area: string
  duracion_minutos: number
  timestamp: Date
}

function actividadMatches(act: ActividadInput, filtro: Record<string, unknown>): boolean {
  if (filtro.tipo && act.tipo !== filtro.tipo) return false
  if (filtro.area && act.area !== filtro.area) return false
  if (filtro.tipos && !(filtro.tipos as string[]).includes(act.tipo)) return false
  if (filtro.before_hour !== undefined && act.timestamp.getUTCHours() >= (filtro.before_hour as number)) return false
  if (filtro.max_min !== undefined && act.duracion_minutos > (filtro.max_min as number)) return false
  return true
}

function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getUTCDate() / 7)
}

export function makeOdinService(db: DB) {
  const xpService = makeXpService(db)

  async function generarMisionesDelDia(usuarioId: string) {
    const today = new Date().toISOString().slice(0, 10)

    const [existing] = await db.select({ id: odin_misiones_usuario.id })
      .from(odin_misiones_usuario)
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.periodo_tipo, 'diario'),
        eq(odin_misiones_usuario.periodo_inicio, today),
      ))
      .limit(1)

    if (existing) return { skipped: true }

    // Expirar misiones diarias anteriores
    await db.update(odin_misiones_usuario)
      .set({ estado: 'expirada', updated_at: new Date() })
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.estado, 'activa'),
        eq(odin_misiones_usuario.periodo_tipo, 'diario'),
        lt(odin_misiones_usuario.periodo_fin, today),
      ))

    await getCatalogMap(db) // Asegura que el catálogo esté sembrado

    // Principales usadas en últimos 7 días
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

    const usedRows = await db
      .select({ catalogo_id: odin_misiones_usuario.catalogo_id })
      .from(odin_misiones_usuario)
      .innerJoin(odin_misiones_catalogo, eq(odin_misiones_usuario.catalogo_id, odin_misiones_catalogo.id))
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_catalogo.tipo, 'principal'),
        gte(odin_misiones_usuario.periodo_inicio, sevenDaysAgoStr),
      ))

    const usedIds = usedRows.map(r => r.catalogo_id)

    let availablePrincipals = usedIds.length > 0
      ? await db.select().from(odin_misiones_catalogo).where(and(
          eq(odin_misiones_catalogo.tipo, 'principal'),
          eq(odin_misiones_catalogo.activa, true),
          notInArray(odin_misiones_catalogo.id, usedIds),
        ))
      : await db.select().from(odin_misiones_catalogo).where(and(
          eq(odin_misiones_catalogo.tipo, 'principal'),
          eq(odin_misiones_catalogo.activa, true),
        ))

    if (availablePrincipals.length === 0) {
      availablePrincipals = await db.select().from(odin_misiones_catalogo).where(and(
        eq(odin_misiones_catalogo.tipo, 'principal'),
        eq(odin_misiones_catalogo.activa, true),
      ))
    }

    const principal = availablePrincipals[Math.floor(Math.random() * availablePrincipals.length)]

    // Secundarias: priorizar áreas menos activas del usuario en 7 días
    const actsByArea = await db
      .select({ area: actividades.area, c: count() })
      .from(actividades)
      .where(and(
        eq(actividades.usuario_id, usuarioId),
        gte(actividades.timestamp, sevenDaysAgo),
        isNull(actividades.deleted_at),
      ))
      .groupBy(actividades.area)

    const areaCount = new Map(actsByArea.map(r => [r.area, Number(r.c)]))

    const allSecondary = await db.select().from(odin_misiones_catalogo).where(and(
      eq(odin_misiones_catalogo.tipo, 'secundaria'),
      eq(odin_misiones_catalogo.activa, true),
    ))

    allSecondary.sort((a, b) => {
      const fa = (a.objetivo_filtro as Record<string, unknown>) ?? {}
      const fb = (b.objetivo_filtro as Record<string, unknown>) ?? {}
      const ca = fa.area ? (areaCount.get(fa.area as string) ?? 0) : 999
      const cb = fb.area ? (areaCount.get(fb.area as string) ?? 0) : 999
      return ca - cb
    })

    const numSecondary = Math.random() > 0.5 ? 4 : 3
    const secondaries = allSecondary.slice(0, numSecondary)

    const toInsert = [principal, ...secondaries].map(m => ({
      usuario_id: usuarioId,
      catalogo_id: m.id,
      periodo_tipo: 'diario',
      periodo_inicio: today,
      periodo_fin: today,
      progreso: 0,
      total: m.objetivo_valor,
      estado: 'activa',
    }))

    await db.insert(odin_misiones_usuario).values(toInsert)

    return { created: toInsert.length, principal: principal.nombre }
  }

  async function verificarProgresoMisiones(usuarioId: string, actividad: ActividadInput) {
    const today = actividad.timestamp.toISOString().slice(0, 10)

    const misiones = await db
      .select({
        id: odin_misiones_usuario.id,
        objetivo_tipo: odin_misiones_catalogo.objetivo_tipo,
        objetivo_filtro: odin_misiones_catalogo.objetivo_filtro,
        xp_reward: odin_misiones_catalogo.xp_reward,
        progreso: odin_misiones_usuario.progreso,
        total: odin_misiones_usuario.total,
        nombre: odin_misiones_catalogo.nombre,
      })
      .from(odin_misiones_usuario)
      .innerJoin(odin_misiones_catalogo, eq(odin_misiones_usuario.catalogo_id, odin_misiones_catalogo.id))
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.estado, 'activa'),
        eq(odin_misiones_usuario.periodo_tipo, 'diario'),
        eq(odin_misiones_usuario.periodo_inicio, today),
      ))

    for (const mision of misiones) {
      const filtro = (mision.objetivo_filtro as Record<string, unknown>) ?? {}
      let nuevoProg = mision.progreso

      if (mision.objetivo_tipo === 'actividades_count') {
        if (actividadMatches(actividad, filtro)) nuevoProg += 1
      } else if (mision.objetivo_tipo === 'minutos_tipo') {
        if (actividadMatches(actividad, filtro)) nuevoProg += actividad.duracion_minutos
      } else if (mision.objetivo_tipo === 'areas_count') {
        const [{ c }] = await db
          .select({ c: sql<number>`count(distinct ${actividades.area})` })
          .from(actividades)
          .where(and(
            eq(actividades.usuario_id, usuarioId),
            sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') = ${today}::date`,
            isNull(actividades.deleted_at),
          ))
        nuevoProg = Number(c)
      } else {
        continue // cronos_puntual y otros: actualizados por sus propios módulos
      }

      if (nuevoProg === mision.progreso) continue

      const seCompleta = nuevoProg >= mision.total && mision.progreso < mision.total
      const updateData: Record<string, unknown> = { progreso: nuevoProg, updated_at: new Date() }
      if (seCompleta) {
        updateData.estado = 'completada'
        updateData.completada_at = new Date()
        updateData.xp_otorgado = mision.xp_reward
      }

      await db.update(odin_misiones_usuario).set(updateData as any).where(eq(odin_misiones_usuario.id, mision.id))

      if (seCompleta) {
        await xpService.otorgarXP({ usuarioId, xpBase: mision.xp_reward, bonusHorario: 1.0, bonusRacha: 1.0, fuente: 'odin_mision', fuenteId: mision.id })
        getIo()?.to(usuarioId).emit('mission:completed', { mision_id: mision.id, nombre: mision.nombre, xp: mision.xp_reward })
      }
    }

    // Verificar si TODAS las misiones del día están completas
    const [{ c: restantes }] = await db
      .select({ c: count() })
      .from(odin_misiones_usuario)
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.periodo_tipo, 'diario'),
        eq(odin_misiones_usuario.periodo_inicio, today),
        sql`${odin_misiones_usuario.estado} != 'completada'`,
      ))

    if (Number(restantes) === 0 && misiones.length > 0) {
      const [{ c: yaAbierto }] = await db
        .select({ c: count() })
        .from(odin_cofres)
        .where(and(
          eq(odin_cofres.usuario_id, usuarioId),
          sql`date(${odin_cofres.abierto_at} AT TIME ZONE 'UTC') = ${today}::date`,
        ))

      if (Number(yaAbierto) === 0) await abrirCofreEpico(usuarioId)
    }
  }

  async function abrirCofreEpico(usuarioId: string) {
    const now = new Date()
    const semana = getWeekOfMonth(now)
    const xpCofre = semana <= 2 ? 300 : 350
    const tipo = semana === 1 ? 'bronce' : semana === 2 ? 'plata' : semana === 3 ? 'dorado' : 'epico'

    await db.insert(odin_cofres).values({ usuario_id: usuarioId, tipo, semana_numero: semana, xp_otorgado: xpCofre })
    await xpService.otorgarXP({ usuarioId, xpBase: xpCofre, bonusHorario: 1.0, bonusRacha: 1.0, fuente: 'odin_cofre' })
    getIo()?.to(usuarioId).emit('cofre:unlocked', { tipo, xp: xpCofre, semana })
    await crearNotificacion(db, getIo(), usuarioId, {
      tipo: 'cofre_epico',
      titulo: `¡Cofre ${tipo} desbloqueado!`,
      mensaje: `Completaste todas las misiones del día. Ganaste ${xpCofre} XP.`,
      data: { cofre_tipo: tipo, xp: xpCofre },
    })
  }

  async function crearMisionPersonalizada(usuarioId: string, data: {
    nombre: string
    descripcion?: string
    objetivo_tipo: string
    objetivo_valor: number
    xp_reward: number
    frecuencia: 'diaria' | 'semanal' | 'una_vez'
  }) {
    const [catalogEntry] = await db.insert(odin_misiones_catalogo).values({
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: 'personalizada',
      objetivo_tipo: data.objetivo_tipo,
      objetivo_valor: data.objetivo_valor,
      xp_reward: Math.min(300, Math.max(1, data.xp_reward)),
      activa: true,
    }).returning()

    const today = new Date().toISOString().slice(0, 10)
    let periodoFin = today
    let periodoTipo = 'diario'

    if (data.frecuencia === 'semanal') {
      const endOfWeek = new Date()
      endOfWeek.setUTCDate(endOfWeek.getUTCDate() + (6 - endOfWeek.getUTCDay()))
      periodoFin = endOfWeek.toISOString().slice(0, 10)
      periodoTipo = 'semanal'
    }

    const [mision] = await db.insert(odin_misiones_usuario).values({
      usuario_id: usuarioId,
      catalogo_id: catalogEntry.id,
      periodo_tipo: periodoTipo,
      periodo_inicio: today,
      periodo_fin: periodoFin,
      progreso: 0,
      total: data.objetivo_valor,
      estado: 'activa',
    }).returning()

    return { catalogo: catalogEntry, mision }
  }

  async function actualizarProgresoManual(usuarioId: string, misionId: string, delta: number) {
    const [mision] = await db
      .select({
        id: odin_misiones_usuario.id,
        progreso: odin_misiones_usuario.progreso,
        total: odin_misiones_usuario.total,
        estado: odin_misiones_usuario.estado,
        xp_reward: odin_misiones_catalogo.xp_reward,
        nombre: odin_misiones_catalogo.nombre,
      })
      .from(odin_misiones_usuario)
      .innerJoin(odin_misiones_catalogo, eq(odin_misiones_usuario.catalogo_id, odin_misiones_catalogo.id))
      .where(and(eq(odin_misiones_usuario.id, misionId), eq(odin_misiones_usuario.usuario_id, usuarioId)))
      .limit(1)

    if (!mision) throw makeError('Misión no encontrada', 404)
    if (mision.estado === 'completada') throw makeError('La misión ya está completada', 400)

    const nuevoProg = Math.min(mision.total, mision.progreso + delta)
    const seCompleta = nuevoProg >= mision.total

    const updateData: Record<string, unknown> = { progreso: nuevoProg, updated_at: new Date() }
    if (seCompleta) {
      updateData.estado = 'completada'
      updateData.completada_at = new Date()
      updateData.xp_otorgado = mision.xp_reward
    }

    await db.update(odin_misiones_usuario).set(updateData as any).where(eq(odin_misiones_usuario.id, misionId))

    if (seCompleta) {
      await xpService.otorgarXP({ usuarioId, xpBase: mision.xp_reward, bonusHorario: 1.0, bonusRacha: 1.0, fuente: 'odin_mision', fuenteId: misionId })
      getIo()?.to(usuarioId).emit('mission:completed', { mision_id: misionId, nombre: mision.nombre, xp: mision.xp_reward })
    }

    return { progreso: nuevoProg, completada: seCompleta }
  }

  async function obtenerMisionesDelDia(usuarioId: string) {
    const today = new Date().toISOString().slice(0, 10)
    return db
      .select({
        id: odin_misiones_usuario.id,
        nombre: odin_misiones_catalogo.nombre,
        descripcion: odin_misiones_catalogo.descripcion,
        tipo: odin_misiones_catalogo.tipo,
        objetivo_tipo: odin_misiones_catalogo.objetivo_tipo,
        xp_reward: odin_misiones_catalogo.xp_reward,
        progreso: odin_misiones_usuario.progreso,
        total: odin_misiones_usuario.total,
        estado: odin_misiones_usuario.estado,
        completada_at: odin_misiones_usuario.completada_at,
      })
      .from(odin_misiones_usuario)
      .innerJoin(odin_misiones_catalogo, eq(odin_misiones_usuario.catalogo_id, odin_misiones_catalogo.id))
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.periodo_tipo, 'diario'),
        eq(odin_misiones_usuario.periodo_inicio, today),
      ))
  }

  async function obtenerMisionSemana(usuarioId: string) {
    const today = new Date().toISOString().slice(0, 10)
    const [result] = await db
      .select({
        id: odin_misiones_usuario.id,
        nombre: odin_misiones_catalogo.nombre,
        descripcion: odin_misiones_catalogo.descripcion,
        xp_reward: odin_misiones_catalogo.xp_reward,
        progreso: odin_misiones_usuario.progreso,
        total: odin_misiones_usuario.total,
        estado: odin_misiones_usuario.estado,
        periodo_fin: odin_misiones_usuario.periodo_fin,
      })
      .from(odin_misiones_usuario)
      .innerJoin(odin_misiones_catalogo, eq(odin_misiones_usuario.catalogo_id, odin_misiones_catalogo.id))
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.periodo_tipo, 'semanal'),
        lte(odin_misiones_usuario.periodo_inicio, today),
        gte(odin_misiones_usuario.periodo_fin, today),
      ))
      .limit(1)
    return result ?? null
  }

  async function obtenerMisionMes(usuarioId: string) {
    const today = new Date().toISOString().slice(0, 10)
    const [result] = await db
      .select({
        id: odin_misiones_usuario.id,
        nombre: odin_misiones_catalogo.nombre,
        descripcion: odin_misiones_catalogo.descripcion,
        xp_reward: odin_misiones_catalogo.xp_reward,
        progreso: odin_misiones_usuario.progreso,
        total: odin_misiones_usuario.total,
        estado: odin_misiones_usuario.estado,
        periodo_fin: odin_misiones_usuario.periodo_fin,
      })
      .from(odin_misiones_usuario)
      .innerJoin(odin_misiones_catalogo, eq(odin_misiones_usuario.catalogo_id, odin_misiones_catalogo.id))
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.periodo_tipo, 'mensual'),
        lte(odin_misiones_usuario.periodo_inicio, today),
        gte(odin_misiones_usuario.periodo_fin, today),
      ))
      .limit(1)
    return result ?? null
  }

  async function obtenerCalendario(usuarioId: string, year: number, month: number) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getUTCDate()
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const today = new Date().toISOString().slice(0, 10)

    const rows = await db
      .select({ periodo_inicio: odin_misiones_usuario.periodo_inicio, estado: odin_misiones_usuario.estado })
      .from(odin_misiones_usuario)
      .where(and(
        eq(odin_misiones_usuario.usuario_id, usuarioId),
        eq(odin_misiones_usuario.periodo_tipo, 'diario'),
        gte(odin_misiones_usuario.periodo_inicio, firstDay),
        lte(odin_misiones_usuario.periodo_inicio, lastDay),
      ))

    const byDay = new Map<string, { total: number; completadas: number }>()
    for (const r of rows) {
      const key = r.periodo_inicio
      const cur = byDay.get(key) ?? { total: 0, completadas: 0 }
      cur.total++
      if (r.estado === 'completada') cur.completadas++
      byDay.set(key, cur)
    }

    return Array.from({ length: daysInMonth }, (_, i) => {
      const fecha = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      if (fecha > today) return { fecha, status: '○' }
      const data = byDay.get(fecha)
      if (!data) return { fecha, status: '✗' }
      return { fecha, status: data.completadas === data.total ? '✓' : '~' }
    })
  }

  async function obtenerCofres(usuarioId: string) {
    return db.select().from(odin_cofres).where(eq(odin_cofres.usuario_id, usuarioId)).orderBy(desc(odin_cofres.abierto_at))
  }

  return {
    generarMisionesDelDia,
    verificarProgresoMisiones,
    abrirCofreEpico,
    crearMisionPersonalizada,
    actualizarProgresoManual,
    obtenerMisionesDelDia,
    obtenerMisionSemana,
    obtenerMisionMes,
    obtenerCalendario,
    obtenerCofres,
  }
}

export type OdinService = ReturnType<typeof makeOdinService>
