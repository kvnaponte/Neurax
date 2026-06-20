import { and, eq, desc, sql, gte, isNull, count } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import {
  leonidas_sesiones,
  leonidas_ejercicios_sesion,
  leonidas_plan_semanal,
  leonidas_ejercicios_catalogo,
  actividades,
} from '../../db/schema'
import { DESCANSO_MINIMO, SECUENCIAS_PROHIBIDAS, makeLeonidasValidationService } from '../actividades/leonidas-validation.service'
import { makeActividadesService } from '../actividades/actividades.service'
import { makeCronosService } from '../cronos/cronos.service'
import { getIo } from '../../shared/io'

type DB = PostgresJsDatabase<typeof schema>

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

const TIPO_TO_ACTIVIDAD: Record<string, string> = {
  fuerza: 'ejercicio_fuerza',
  cardio: 'ejercicio_cardio',
  barras: 'barras',
  trote: 'trote',
}

export interface EjercicioInput {
  nombre: string
  grupo: string
  series: number
  reps: number
  peso_kg?: number
  notas?: string
}

export interface RegistrarSesionInput {
  tipo: 'fuerza' | 'cardio' | 'barras' | 'trote'
  grupos_trabajados: string[]
  duracion_minutos: number
  ejercicios?: EjercicioInput[]
  intensidad?: number
  notas?: string
  timestamp?: Date
}

export interface PlanDiaInput {
  dia: number // 0=Dom..6=Sab
  tipo: string
  grupos_planeados: string[]
}

function formatHorasRestantes(horasRestantes: number, ahora: Date): string {
  if (horasRestantes <= 0) return 'Disponible ahora'

  let horas = Math.floor(horasRestantes)
  let minutos = Math.round((horasRestantes - horas) * 60)
  if (minutos >= 60) { horas++; minutos = 0 }

  // < 24h → "Disponible en Xh Ymin"
  if (horasRestantes < 24) {
    return `Disponible en ${horas}h ${minutos}min`
  }

  // >= 24h → "Disponible mañana a las HH:MM" si es el día siguiente, si no "Disponible en Xh Ymin"
  const disponibleEn = new Date(ahora.getTime() + horasRestantes * 3600 * 1000)
  const mañana = new Date(ahora)
  mañana.setUTCDate(mañana.getUTCDate() + 1)
  const esMañana = disponibleEn.getUTCDate() === mañana.getUTCDate() &&
    disponibleEn.getUTCMonth() === mañana.getUTCMonth()

  if (esMañana) {
    const h = String(disponibleEn.getUTCHours()).padStart(2, '0')
    const m = String(disponibleEn.getUTCMinutes()).padStart(2, '0')
    return `Disponible mañana a las ${h}:${m}`
  }

  return `Disponible en ${horas}h ${minutos}min`
}

export function makeLeonidasService(db: DB) {
  const validation = makeLeonidasValidationService(db)
  const actividadesService = makeActividadesService(db)
  const cronosService = makeCronosService(db)

  async function obtenerMusculoAsignado(usuarioId: string, fecha: Date) {
    const diaSemana = fecha.getUTCDay()

    // Sábado: solo trote y barras
    if (diaSemana === 6) {
      const todosGrupos = Object.keys(DESCANSO_MINIMO)
      return {
        grupo_asignado: null as string | null,
        es_sabado: true,
        tipos_permitidos: ['trote', 'barras'],
        alternativas_disponibles: [] as string[],
        grupos_bloqueados: todosGrupos.map(g => ({ grupo: g, motivo: 'Sábado: solo trote o barras' })),
      }
    }

    const ahora = fecha
    const fechaStr = ahora.toISOString().slice(0, 10)
    const ayer = new Date(ahora)
    ayer.setUTCDate(ayer.getUTCDate() - 1)
    const ayerStr = ayer.toISOString().slice(0, 10)
    const hace14 = new Date(ahora)
    hace14.setUTCDate(hace14.getUTCDate() - 14)

    // Último grupo entrenado ayer (para secuencias)
    const [sesionAyer] = await db
      .select({ grupos_trabajados: leonidas_sesiones.grupos_trabajados })
      .from(leonidas_sesiones)
      .where(and(
        eq(leonidas_sesiones.usuario_id, usuarioId),
        sql`date(${leonidas_sesiones.timestamp} AT TIME ZONE 'UTC') = ${ayerStr}::date`,
      ))
      .orderBy(desc(leonidas_sesiones.timestamp))
      .limit(1)

    const gruposAyer = (sesionAyer?.grupos_trabajados as string[] | undefined) ?? []

    // Última sesión por grupo (para calcular descanso)
    const ultimasPorGrupo = await db
      .select({
        grupo: sql<string>`unnest(${leonidas_sesiones.grupos_trabajados})`.as('grupo'),
        ultima: sql<Date>`MAX(${leonidas_sesiones.timestamp})`.as('ultima'),
      })
      .from(leonidas_sesiones)
      .where(eq(leonidas_sesiones.usuario_id, usuarioId))
      .groupBy(sql`unnest(${leonidas_sesiones.grupos_trabajados})`)

    const ultimaTs: Record<string, Date> = {}
    for (const r of ultimasPorGrupo) {
      ultimaTs[r.grupo] = r.ultima
    }

    // Frecuencia de cada grupo en últimos 14 días
    const frecRows = await db
      .select({
        grupo: sql<string>`unnest(${leonidas_sesiones.grupos_trabajados})`.as('grupo'),
        c: count().as('c'),
      })
      .from(leonidas_sesiones)
      .where(and(
        eq(leonidas_sesiones.usuario_id, usuarioId),
        gte(leonidas_sesiones.timestamp, hace14),
      ))
      .groupBy(sql`unnest(${leonidas_sesiones.grupos_trabajados})`)

    const frecuencia: Record<string, number> = {}
    for (const r of frecRows) {
      frecuencia[r.grupo] = Number(r.c)
    }

    const disponibles: string[] = []
    const bloqueados: { grupo: string; motivo: string }[] = []

    for (const [grupo, descMin] of Object.entries(DESCANSO_MINIMO)) {
      const ultima = ultimaTs[grupo]
      if (ultima) {
        const horas = (ahora.getTime() - new Date(ultima).getTime()) / 3600000
        if (horas < descMin) {
          const restantes = Math.ceil(descMin - horas)
          bloqueados.push({ grupo, motivo: `Necesita ${restantes}h más de descanso` })
          continue
        }
      }

      // Filtrar por secuencias prohibidas con grupos de ayer
      const prohibido = gruposAyer.some(ga =>
        SECUENCIAS_PROHIBIDAS.some(([a, b]) => a === ga && b === grupo)
      )
      if (prohibido) {
        bloqueados.push({ grupo, motivo: `Secuencia prohibida después de ${gruposAyer.join(',')}` })
        continue
      }

      disponibles.push(grupo)
    }

    if (disponibles.length === 0) {
      return { grupo_asignado: null, es_sabado: false, tipos_permitidos: null, alternativas_disponibles: [], grupos_bloqueados: bloqueados }
    }

    // Priorizar el menos frecuente en últimos 14 días
    disponibles.sort((a, b) => (frecuencia[a] ?? 0) - (frecuencia[b] ?? 0))
    const [principal, ...alternativas] = disponibles

    return {
      grupo_asignado: principal,
      es_sabado: false,
      tipos_permitidos: null,
      alternativas_disponibles: alternativas,
      grupos_bloqueados: bloqueados,
    }
  }

  async function registrarSesion(usuarioId: string, data: RegistrarSesionInput) {
    const ts = data.timestamp ?? new Date()

    validation.validarDiaSemana(data.tipo, ts)

    for (const grupo of data.grupos_trabajados) {
      await validation.validarSecuenciaMuscular(usuarioId, grupo, ts)
    }

    const actividadTipo = TIPO_TO_ACTIVIDAD[data.tipo]
    if (!actividadTipo) throw makeError('Tipo de sesión inválido', 400)

    const fechaStr = ts.toISOString().slice(0, 10)

    // Buscar actividad existente del mismo tipo hoy
    const [actExistente] = await db
      .select({ id: actividades.id })
      .from(actividades)
      .where(and(
        eq(actividades.usuario_id, usuarioId),
        eq(actividades.tipo, actividadTipo),
        sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') = ${fechaStr}::date`,
        isNull(actividades.deleted_at),
      ))
      .limit(1)

    let actividadId: string
    if (actExistente) {
      actividadId = actExistente.id
    } else {
      const { actividad } = await actividadesService.registrarActividad(usuarioId, {
        tipo: actividadTipo,
        duracion_minutos: data.duracion_minutos,
        timestamp: ts,
      })
      actividadId = actividad.id
    }

    const [sesion] = await db.insert(leonidas_sesiones).values({
      usuario_id: usuarioId,
      actividad_id: actividadId,
      tipo: data.tipo,
      grupos_trabajados: data.grupos_trabajados,
      duracion_minutos: data.duracion_minutos,
      intensidad: data.intensidad ?? 3,
      notas: data.notas,
      timestamp: ts,
    }).returning()

    if (data.ejercicios && data.ejercicios.length > 0) {
      await db.insert(leonidas_ejercicios_sesion).values(
        data.ejercicios.map((e, i) => ({
          sesion_id: sesion.id,
          nombre: e.nombre,
          grupo_muscular: e.grupo,
          series: e.series,
          repeticiones: e.reps,
          peso_kg: e.peso_kg ? String(e.peso_kg) : null,
          notas: e.notas,
          orden: i + 1,
        }))
      )
    }

    return { sesion, actividad_id: actividadId }
  }

  async function obtenerDisponibilidadMuscular(usuarioId: string) {
    const ahora = new Date()

    const ultimasPorGrupo = await db
      .select({
        grupo: sql<string>`unnest(${leonidas_sesiones.grupos_trabajados})`.as('grupo'),
        ultima: sql<Date>`MAX(${leonidas_sesiones.timestamp})`.as('ultima'),
      })
      .from(leonidas_sesiones)
      .where(eq(leonidas_sesiones.usuario_id, usuarioId))
      .groupBy(sql`unnest(${leonidas_sesiones.grupos_trabajados})`)

    const ultimaTs: Record<string, Date> = {}
    for (const r of ultimasPorGrupo) {
      ultimaTs[r.grupo] = r.ultima
    }

    const result = Object.entries(DESCANSO_MINIMO).map(([grupo, descMin]) => {
      const ultima = ultimaTs[grupo]
      if (!ultima) {
        return { grupo, estado: 'disponible', horas_transcurridas: null, horas_restantes: 0, texto: 'Disponible ahora' }
      }

      const horasTranscurridas = (ahora.getTime() - new Date(ultima).getTime()) / 3600000
      const horasRestantes = Math.max(0, descMin - horasTranscurridas)

      if (horasRestantes <= 0) {
        return { grupo, estado: 'disponible', horas_transcurridas: horasTranscurridas, horas_restantes: 0, texto: 'Disponible ahora' }
      }

      return {
        grupo,
        estado: 'bloqueado',
        horas_transcurridas: horasTranscurridas,
        horas_restantes: horasRestantes,
        texto: formatHorasRestantes(horasRestantes, ahora),
      }
    })

    result.sort((a, b) => a.horas_restantes - b.horas_restantes)
    return result
  }

  async function actualizarPlanSemanal(usuarioId: string, plan: PlanDiaInput[]) {
    for (const item of plan) {
      await db.insert(leonidas_plan_semanal).values({
        usuario_id: usuarioId,
        dia_semana: item.dia,
        tipo: item.tipo,
        grupos_planeados: item.grupos_planeados,
        activo: true,
      }).onConflictDoUpdate({
        target: [leonidas_plan_semanal.usuario_id, leonidas_plan_semanal.dia_semana],
        set: {
          tipo: sql`excluded.tipo`,
          grupos_planeados: sql`excluded.grupos_planeados`,
          activo: true,
          updated_at: sql`now()`,
        },
      })
    }

    return db.select().from(leonidas_plan_semanal).where(eq(leonidas_plan_semanal.usuario_id, usuarioId))
  }

  async function sincronizarConCronos(usuarioId: string) {
    const plan = await db.select().from(leonidas_plan_semanal)
      .where(and(eq(leonidas_plan_semanal.usuario_id, usuarioId), eq(leonidas_plan_semanal.activo, true)))

    if (plan.length === 0) return { sincronizados: 0, conflictos: 0 }

    const planPorDia = new Map(plan.map(p => [p.dia_semana, p]))
    let sincronizados = 0
    let conflictos = 0

    const ahora = new Date()
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(ahora)
      fecha.setUTCDate(fecha.getUTCDate() + i)
      const dia = fecha.getUTCDay()

      const planDia = planPorDia.get(dia)
      if (!planDia || planDia.tipo === 'descanso') continue

      const slot1Inicio = new Date(fecha)
      slot1Inicio.setUTCHours(6, 0, 0, 0)
      const slot1Fin = new Date(fecha)
      slot1Fin.setUTCHours(8, 0, 0, 0)

      const slot2Inicio = new Date(fecha)
      slot2Inicio.setUTCHours(7, 0, 0, 0)
      const slot2Fin = new Date(fecha)
      slot2Fin.setUTCHours(9, 0, 0, 0)

      try {
        await cronosService.crearEvento(usuarioId, {
          titulo: `Entrenamiento ${planDia.tipo}`,
          tipo: planDia.tipo === 'cardio' ? 'ejercicio_cardio' : planDia.tipo === 'trote' ? 'trote' : planDia.tipo === 'barras' ? 'barras' : 'ejercicio_fuerza',
          area: 'fisicas',
          inicio_at: slot1Inicio,
          fin_at: slot1Fin,
        })
        sincronizados++
      } catch {
        // Intentar slot alternativo
        try {
          await cronosService.crearEvento(usuarioId, {
            titulo: `Entrenamiento ${planDia.tipo}`,
            tipo: planDia.tipo === 'cardio' ? 'ejercicio_cardio' : planDia.tipo === 'trote' ? 'trote' : planDia.tipo === 'barras' ? 'barras' : 'ejercicio_fuerza',
            area: 'fisicas',
            inicio_at: slot2Inicio,
            fin_at: slot2Fin,
          })
          sincronizados++
        } catch {
          conflictos++
          getIo()?.to(usuarioId).emit('cronos:conflict', { fecha: fecha.toISOString().slice(0, 10), dia, tipo: planDia.tipo })
        }
      }
    }

    return { sincronizados, conflictos }
  }

  async function obtenerEstadisticasSemana(usuarioId: string) {
    const ahora = new Date()
    const inicioSemana = new Date(ahora)
    const dia = ahora.getUTCDay()
    inicioSemana.setUTCDate(ahora.getUTCDate() - (dia === 0 ? 6 : dia - 1))
    inicioSemana.setUTCHours(0, 0, 0, 0)

    const sesiones = await db.select().from(leonidas_sesiones)
      .where(and(
        eq(leonidas_sesiones.usuario_id, usuarioId),
        gte(leonidas_sesiones.timestamp, inicioSemana),
      ))
      .orderBy(desc(leonidas_sesiones.timestamp))

    const sesionIds = sesiones.map(s => s.id)

    let ejercicios: typeof leonidas_ejercicios_sesion.$inferSelect[] = []
    if (sesionIds.length > 0) {
      ejercicios = await db.select().from(leonidas_ejercicios_sesion)
        .where(sql`${leonidas_ejercicios_sesion.sesion_id} = ANY(ARRAY[${sql.join(sesionIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
    }

    // Volumen por grupo: SUM(series × repeticiones × peso_kg)
    const volumenPorGrupo: Record<string, number> = {}
    const frecuenciaPorGrupo: Record<string, number> = {}

    for (const ej of ejercicios) {
      const g = ej.grupo_muscular
      const v = ej.series * ej.repeticiones * Number(ej.peso_kg ?? 0)
      volumenPorGrupo[g] = (volumenPorGrupo[g] ?? 0) + v
    }

    for (const s of sesiones) {
      for (const g of s.grupos_trabajados as string[]) {
        frecuenciaPorGrupo[g] = (frecuenciaPorGrupo[g] ?? 0) + 1
      }
    }

    // Racha Leonidas: días consecutivos con sesión física hasta hoy
    const diasConSesion = new Set(sesiones.map(s => new Date(s.timestamp as Date).toISOString().slice(0, 10)))
    let rachaLeonidas = 0
    for (let d = 0; d < 7; d++) {
      const fecha = new Date(ahora)
      fecha.setUTCDate(ahora.getUTCDate() - d)
      const f = fecha.toISOString().slice(0, 10)
      if (diasConSesion.has(f)) rachaLeonidas++
      else break
    }

    return {
      sesiones: sesiones.length,
      volumen_por_grupo: volumenPorGrupo,
      frecuencia_por_grupo: frecuenciaPorGrupo,
      racha_leonidas: rachaLeonidas,
    }
  }

  async function obtenerHistorialSesiones(usuarioId: string, limit = 20, offset = 0) {
    const rows = await db
      .select({
        id: leonidas_sesiones.id,
        tipo: leonidas_sesiones.tipo,
        grupos_trabajados: leonidas_sesiones.grupos_trabajados,
        duracion_minutos: leonidas_sesiones.duracion_minutos,
        intensidad: leonidas_sesiones.intensidad,
        notas: leonidas_sesiones.notas,
        timestamp: leonidas_sesiones.timestamp,
      })
      .from(leonidas_sesiones)
      .where(eq(leonidas_sesiones.usuario_id, usuarioId))
      .orderBy(desc(leonidas_sesiones.timestamp))
      .limit(limit)
      .offset(offset)
    return rows
  }

  async function obtenerPlanSemanal(usuarioId: string) {
    return db.select().from(leonidas_plan_semanal)
      .where(eq(leonidas_plan_semanal.usuario_id, usuarioId))
      .orderBy(leonidas_plan_semanal.dia_semana)
  }

  async function obtenerEjercicios(grupo?: string) {
    if (grupo) {
      return db.select().from(leonidas_ejercicios_catalogo)
        .where(sql`LOWER(${leonidas_ejercicios_catalogo.grupo_muscular}) = LOWER(${grupo})`)
    }
    return db.select().from(leonidas_ejercicios_catalogo)
  }

  return {
    obtenerMusculoAsignado,
    registrarSesion,
    obtenerDisponibilidadMuscular,
    actualizarPlanSemanal,
    sincronizarConCronos,
    obtenerEstadisticasSemana,
    obtenerHistorialSesiones,
    obtenerPlanSemanal,
    obtenerEjercicios,
  }
}

export type LeonidasService = ReturnType<typeof makeLeonidasService>
