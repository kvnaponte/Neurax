import { and, eq, isNull, desc, sql, count } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { actividades } from '../../db/schema'
import { calcularBonusRacha, calcularXPFinal } from '../../shared/xp.utils'
import { makeRachaService } from '../gamification/racha.service'
import { makeXpService } from '../gamification/xp.service'
import { makeLeonidasValidationService } from './leonidas-validation.service'
import { ACTIVIDADES_CATALOG, LIMITES_DIARIOS_XP } from './actividades.catalog'

type DB = PostgresJsDatabase<typeof schema>

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export interface RegistrarActividadInput {
  tipo: string
  duracion_minutos: number
  timestamp?: Date
  descripcion?: string
  metadata?: Record<string, unknown>
}

export function makeActividadesService(db: DB) {
  const rachaService = makeRachaService(db)
  const xpService = makeXpService(db)
  const leonidas = makeLeonidasValidationService(db)

  return {
    async registrarActividad(usuarioId: string, data: RegistrarActividadInput) {
      const def = ACTIVIDADES_CATALOG[data.tipo as keyof typeof ACTIVIDADES_CATALOG]
      if (!def) throw makeError('Tipo de actividad inválido', 400)

      const ts = data.timestamp ?? new Date()

      // Timestamp dentro de ±24h
      if (Math.abs(ts.getTime() - Date.now()) > 24 * 60 * 60 * 1000) {
        throw makeError('El timestamp debe estar dentro de ±24 horas', 422)
      }

      // musica_escucha: máx 2 por día
      if (def.maxPorDia !== undefined) {
        const fechaStr = ts.toISOString().slice(0, 10)
        const [countRow] = await db
          .select({ c: count() })
          .from(actividades)
          .where(and(
            eq(actividades.usuario_id, usuarioId),
            eq(actividades.tipo, data.tipo),
            sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') = ${fechaStr}::date`,
            isNull(actividades.deleted_at),
          ))
        if (Number(countRow.c) >= def.maxPorDia) {
          throw makeError(`Máximo ${def.maxPorDia} registros de ${data.tipo} por día`, 422)
        }
      }

      // Validaciones Leonidas para fisicas
      if (def.area === 'fisicas') {
        leonidas.validarDiaSemana(data.tipo, ts)
        const grupo = data.metadata?.grupo_muscular as string | undefined
        if (grupo) {
          await leonidas.validarSecuenciaMuscular(usuarioId, grupo, ts)
        }
      }

      // Cálculo XP multicapa
      const xpBase = def.xpBase(data.duracion_minutos)
      const bonusHorario = def.bonusHorario(ts)
      const diasRacha = await rachaService.calcularRachaActual(usuarioId)
      const bonusRacha = calcularBonusRacha(diasRacha)
      const xpFinalEstimado = calcularXPFinal(xpBase, bonusRacha, bonusHorario)

      // Verificar límite diario del área
      const fechaStr = ts.toISOString().slice(0, 10)
      const [sumaRow] = await db
        .select({ total: sql<number>`COALESCE(SUM(${actividades.xp_generado}), 0)` })
        .from(actividades)
        .where(and(
          eq(actividades.usuario_id, usuarioId),
          eq(actividades.area, def.area),
          sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') = ${fechaStr}::date`,
          isNull(actividades.deleted_at),
        ))

      const xpAcumulado = Number(sumaRow.total)
      const limiteArea = LIMITES_DIARIOS_XP[def.area] ?? 200
      const limiteExcedido = xpAcumulado + xpFinalEstimado > limiteArea

      // INSERT actividad
      const [actividad] = await db.insert(actividades).values({
        usuario_id: usuarioId,
        tipo: data.tipo,
        area: def.area,
        duracion_minutos: data.duracion_minutos,
        timestamp: ts,
        xp_base: xpBase,
        xp_generado: 0,
        bonus_racha: String(bonusRacha.toFixed(2)),
        bonus_horario: String(bonusHorario.toFixed(2)),
        limite_excedido: limiteExcedido,
        descripcion: data.descripcion,
        metadata: data.metadata ?? {},
      }).returning()

      let xpOtorgado = 0
      let nivelNuevo: number | undefined

      if (!limiteExcedido) {
        const resultado = await xpService.otorgarXP({
          usuarioId,
          xpBase,
          bonusHorario,
          fuente: data.tipo,
          fuenteId: actividad.id,
        })
        xpOtorgado = resultado.xp_otorgado
        if (resultado.subio_nivel) nivelNuevo = resultado.nivel_nuevo

        await db.update(actividades)
          .set({ xp_generado: xpOtorgado })
          .where(eq(actividades.id, actividad.id))
      }

      // Marcar actividad del día para racha
      await rachaService.marcarActividadDelDia(usuarioId, fechaStr)

      // Stub: leonidas.registrarSesion() — Issue #15
      // Stub: odin.verificarProgresoMisiones() — Issue #14

      const rachaActual = await rachaService.calcularRachaActual(usuarioId)

      return {
        actividad: { ...actividad, xp_generado: xpOtorgado },
        xp_otorgado: xpOtorgado,
        ...(nivelNuevo !== undefined ? { nivel_nuevo: nivelNuevo } : {}),
        racha_actual: rachaActual,
        limite_excedido: limiteExcedido,
      }
    },

    async listarActividades(usuarioId: string, opts: {
      area?: string
      tipo?: string
      fechaInicio?: string
      fechaFin?: string
      page?: number
      limit?: number
    }) {
      const p = Math.max(1, opts.page ?? 1)
      const l = Math.min(100, Math.max(1, opts.limit ?? 20))
      const offset = (p - 1) * l

      const conditions = [
        eq(actividades.usuario_id, usuarioId),
        isNull(actividades.deleted_at),
        ...(opts.area ? [eq(actividades.area, opts.area)] : []),
        ...(opts.tipo ? [eq(actividades.tipo, opts.tipo)] : []),
        ...(opts.fechaInicio ? [sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') >= ${opts.fechaInicio}::date`] : []),
        ...(opts.fechaFin ? [sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') <= ${opts.fechaFin}::date`] : []),
      ]

      const [rows, countRow] = await Promise.all([
        db.select().from(actividades).where(and(...conditions))
          .orderBy(desc(actividades.timestamp)).limit(l).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(actividades).where(and(...conditions)),
      ])

      return { data: rows, total: Number(countRow[0].total), page: p, limit: l }
    },

    async actividadesHoy(usuarioId: string) {
      const today = new Date().toISOString().slice(0, 10)
      const rows = await db.select().from(actividades)
        .where(and(
          eq(actividades.usuario_id, usuarioId),
          sql`date(${actividades.timestamp} AT TIME ZONE 'UTC') = ${today}::date`,
          isNull(actividades.deleted_at),
        ))
        .orderBy(desc(actividades.timestamp))

      const conteos: Record<string, number> = {}
      for (const r of rows) {
        conteos[r.area] = (conteos[r.area] ?? 0) + 1
      }

      return { data: rows, total: rows.length, conteos_por_area: conteos }
    },

    async stats(usuarioId: string, periodo: 'week' | 'month' | 'year') {
      const truncSql = periodo === 'week'
        ? sql`date_trunc('week', ${actividades.timestamp})`
        : periodo === 'month'
          ? sql`date_trunc('month', ${actividades.timestamp})`
          : sql`date_trunc('year', ${actividades.timestamp})`

      const rows = await db.select({
        periodo: truncSql.as('periodo'),
        xp_total: sql<number>`sum(${actividades.xp_generado})`.as('xp_total'),
        total_actividades: sql<number>`count(*)`.as('total_actividades'),
      })
        .from(actividades)
        .where(and(eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        .groupBy(truncSql)
        .orderBy(desc(truncSql))
        .limit(12)

      return { data: rows }
    },

    async obtenerActividad(usuarioId: string, id: string) {
      const [row] = await db.select().from(actividades)
        .where(and(eq(actividades.id, id), eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        .limit(1)
      return row ?? null
    },

    async softDelete(usuarioId: string, id: string) {
      const [row] = await db.select({ id: actividades.id })
        .from(actividades)
        .where(and(eq(actividades.id, id), eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        .limit(1)
      if (!row) throw makeError('Actividad no encontrada', 404)

      await db.update(actividades)
        .set({ deleted_at: new Date() })
        .where(eq(actividades.id, id))
    },
  }
}
