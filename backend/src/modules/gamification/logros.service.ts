import { eq, and, isNull, gte, lt, count, sum } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { usuario_achievements, actividades, usuarios, cronos_eventos } from '../../db/schema'
import { emitToUser, getIo } from '../../shared/io'
import { ACHIEVEMENTS_CATALOG, TIPOS_REQUERIDOS, getCatalogEntry } from './achievements.catalog'
import type { RachaService } from './racha.service'
import { crearNotificacion } from '../notifications/notifications.service'

type DB = PostgresJsDatabase<typeof schema>

export interface OtorgarXPInput {
  usuarioId: string
  xpBase: number
  bonusHorario: number
  fuente: string
  fuenteId?: string
}

type OtorgarXPFn = (params: OtorgarXPInput) => Promise<any>

/** Inicializar los 17 logros del sistema para un usuario nuevo */
export async function inicializarLogrosUsuario(db: DB, usuarioId: string): Promise<void> {
  await db.insert(usuario_achievements).values(
    ACHIEVEMENTS_CATALOG.map((a) => ({
      usuario_id: usuarioId,
      achievement_id: a.id,
      tipo: 'sistema' as const,
      progreso: 0,
      total: a.total,
      desbloqueado: false,
      xp_otorgado: 0,
      nombre: a.nombre,
      descripcion: a.descripcion,
    })),
  )
}

export function makeLogrosService(db: DB, rachaService: RachaService, otorgarXP: OtorgarXPFn) {
  async function evaluarProgreso(usuarioId: string, criterio_tipo: string): Promise<number> {
    switch (criterio_tipo) {
      case 'actividades_total': {
        const [r] = await db.select({ c: count() }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        return Number(r?.c ?? 0)
      }
      case 'racha_minima':
        return rachaService.calcularRachaActual(usuarioId)

      case 'nivel_minimo': {
        const [u] = await db.select({ nivel: usuarios.nivel }).from(usuarios)
          .where(eq(usuarios.id, usuarioId)).limit(1)
        return u?.nivel ?? 0
      }
      case 'sesiones_fisicas': {
        const [r] = await db.select({ c: count() }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), eq(actividades.area, 'fisicas'), isNull(actividades.deleted_at)))
        return Number(r?.c ?? 0)
      }
      case 'horas_estudio': {
        const [r] = await db.select({ total: sum(actividades.duracion_minutos) }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), eq(actividades.tipo, 'estudio'), isNull(actividades.deleted_at)))
        return Number(r?.total ?? 0)
      }
      case 'dias_sueno': {
        const [r] = await db.select({ c: count() }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), eq(actividades.tipo, 'sueno'), gte(actividades.duracion_minutos, 420), isNull(actividades.deleted_at)))
        return Number(r?.c ?? 0)
      }
      case 'hora_temprana': {
        const rows = await db.select({ ts: actividades.timestamp }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        return rows.some((r) => new Date(r.ts as Date).getUTCHours() < 7) ? 1 : 0
      }
      case 'hora_nocturna': {
        const rows = await db.select({ ts: actividades.timestamp }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        return rows.some((r) => new Date(r.ts as Date).getUTCHours() >= 23) ? 1 : 0
      }
      case 'actividades_tipo': {
        const rows = await db.selectDistinct({ tipo: actividades.tipo }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), isNull(actividades.deleted_at)))
        const tipos = new Set(rows.map((r) => r.tipo))
        const cumple = TIPOS_REQUERIDOS.every((t) => tipos.has(t))
        return cumple ? 1 : 0
      }
      case 'cronos_100': {
        const hoy = new Date()
        hoy.setUTCHours(0, 0, 0, 0)
        const manana = new Date(hoy)
        manana.setUTCDate(manana.getUTCDate() + 1)
        const eventos = await db.select({ completado: cronos_eventos.completado }).from(cronos_eventos)
          .where(and(eq(cronos_eventos.usuario_id, usuarioId), gte(cronos_eventos.inicio_at, hoy), lt(cronos_eventos.inicio_at, manana), isNull(cronos_eventos.deleted_at)))
        if (eventos.length === 0) return 0
        return eventos.every((e) => e.completado) ? 1 : 0
      }
      case 'sesiones_fisicas_mes': {
        const inicio = new Date()
        inicio.setUTCDate(1)
        inicio.setUTCHours(0, 0, 0, 0)
        const [r] = await db.select({ c: count() }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), eq(actividades.area, 'fisicas'), gte(actividades.timestamp, inicio), isNull(actividades.deleted_at)))
        return Number(r?.c ?? 0)
      }
      case 'registros_demeter': {
        const [r] = await db.select({ c: count() }).from(actividades)
          .where(and(eq(actividades.usuario_id, usuarioId), eq(actividades.area, 'economicas'), isNull(actividades.deleted_at)))
        return Number(r?.c ?? 0)
      }
      default:
        return 0
    }
  }

  return {
    async verificarLogros(usuarioId: string): Promise<void> {
      const pendientes = await db.select().from(usuario_achievements)
        .where(and(eq(usuario_achievements.usuario_id, usuarioId), eq(usuario_achievements.desbloqueado, false), eq(usuario_achievements.tipo, 'sistema')))

      for (const logro of pendientes) {
        const catalogEntry = getCatalogEntry(logro.achievement_id)
        if (!catalogEntry) continue

        const progreso = await evaluarProgreso(usuarioId, catalogEntry.criterio_tipo)

        await db.update(usuario_achievements)
          .set({ progreso })
          .where(eq(usuario_achievements.id, logro.id))

        if (progreso >= logro.total) {
          await db.update(usuario_achievements)
            .set({ desbloqueado: true, desbloqueado_at: new Date(), xp_otorgado: catalogEntry.xp })
            .where(eq(usuario_achievements.id, logro.id))

          await otorgarXP({ usuarioId, xpBase: catalogEntry.xp, bonusHorario: 1, fuente: 'achievement', fuenteId: logro.id })

          emitToUser(usuarioId, 'achievement:unlocked', {
            achievement_id: catalogEntry.id,
            nombre: catalogEntry.nombre,
            xp: catalogEntry.xp,
            tipo: 'sistema',
          })

          await crearNotificacion(db, getIo(), usuarioId, {
            tipo: 'logro_desbloqueado',
            titulo: `¡Logro desbloqueado: ${catalogEntry.nombre}!`,
            mensaje: `Has ganado ${catalogEntry.xp} XP. ${catalogEntry.descripcion ?? ''}`.trim(),
            data: { achievement_id: catalogEntry.id, xp: catalogEntry.xp },
          })
        }
      }
    },

    async crearHitoManual(usuarioId: string, opts: { nombre: string; descripcion?: string; xp: number; icono?: string }) {
      const xp = Math.min(500, Math.max(1, opts.xp))
      const [row] = await db.insert(usuario_achievements).values({
        usuario_id: usuarioId,
        achievement_id: `manual_${Date.now()}`,
        tipo: 'manual' as const,
        progreso: 0,
        total: 1,
        desbloqueado: false,
        xp_otorgado: xp,
        nombre: opts.nombre,
        descripcion: opts.descripcion,
        icono: opts.icono,
      }).returning()
      return row
    },

    async completarHito(usuarioId: string, achievementId: string) {
      const [logro] = await db.select().from(usuario_achievements)
        .where(and(eq(usuario_achievements.id, achievementId), eq(usuario_achievements.usuario_id, usuarioId), eq(usuario_achievements.tipo, 'manual')))
        .limit(1)

      if (!logro) throw Object.assign(new Error('Hito no encontrado'), { statusCode: 404 })
      if (logro.desbloqueado) throw Object.assign(new Error('Hito ya completado'), { statusCode: 409 })

      await db.update(usuario_achievements)
        .set({ desbloqueado: true, desbloqueado_at: new Date(), progreso: 1 })
        .where(eq(usuario_achievements.id, achievementId))

      await otorgarXP({ usuarioId, xpBase: logro.xp_otorgado, bonusHorario: 1, fuente: 'achievement', fuenteId: achievementId })

      emitToUser(usuarioId, 'achievement:unlocked', {
        achievement_id: logro.achievement_id,
        nombre: logro.nombre,
        xp: logro.xp_otorgado,
        tipo: 'manual',
      })
    },
  }
}

export type LogrosService = ReturnType<typeof makeLogrosService>
