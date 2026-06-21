import { eq, and, asc, desc } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { rachas } from '../../db/schema'
import { emitToUser } from '../../shared/io'

type DB = PostgresJsDatabase<typeof schema>

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function prevDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function nextDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function makeRachaService(db: DB) {
  const service = {
    async marcarActividadDelDia(usuarioId: string, fecha: string): Promise<void> {
      await db.insert(rachas)
        .values({ usuario_id: usuarioId, fecha, tiene_actividad: true })
        .onConflictDoUpdate({
          target: [rachas.usuario_id, rachas.fecha],
          set: { tiene_actividad: true },
        })
      const [racha_actual, mejor_racha] = await Promise.all([
        service.calcularRachaActual(usuarioId),
        service.calcularMejorRacha(usuarioId),
      ])
      emitToUser(usuarioId, 'streak:updated', { racha_actual, mejor_racha })
    },

    async calcularRachaActual(usuarioId: string): Promise<number> {
      const registros = await db
        .select({ fecha: rachas.fecha })
        .from(rachas)
        .where(and(eq(rachas.usuario_id, usuarioId), eq(rachas.tiene_actividad, true)))
        .orderBy(desc(rachas.fecha))

      if (registros.length === 0) return 0

      const fechas = registros.map((r) => r.fecha as string)
      const today = todayUTC()
      const yesterday = prevDate(today)

      // La racha solo continúa si la actividad más reciente fue hoy o ayer
      if (fechas[0] !== today && fechas[0] !== yesterday) return 0

      let streak = 1
      for (let i = 1; i < fechas.length; i++) {
        if (fechas[i] === prevDate(fechas[i - 1])) {
          streak++
        } else {
          break
        }
      }
      return streak
    },

    async calcularMejorRacha(usuarioId: string): Promise<number> {
      const registros = await db
        .select({ fecha: rachas.fecha })
        .from(rachas)
        .where(and(eq(rachas.usuario_id, usuarioId), eq(rachas.tiene_actividad, true)))
        .orderBy(asc(rachas.fecha))

      if (registros.length === 0) return 0

      const fechas = registros.map((r) => r.fecha as string)
      let best = 1
      let current = 1

      for (let i = 1; i < fechas.length; i++) {
        if (fechas[i] === nextDate(fechas[i - 1])) {
          current++
          if (current > best) best = current
        } else {
          current = 1
        }
      }
      return best
    },

    async verificarRupturaRacha(usuarioId: string): Promise<boolean> {
      const today = todayUTC()
      const result = await db
        .select({ tiene_actividad: rachas.tiene_actividad })
        .from(rachas)
        .where(and(eq(rachas.usuario_id, usuarioId), eq(rachas.fecha, today)))
        .limit(1)

      return result.length === 0 || !result[0].tiene_actividad
    },
  }
  return service
}

export type RachaService = ReturnType<typeof makeRachaService>
