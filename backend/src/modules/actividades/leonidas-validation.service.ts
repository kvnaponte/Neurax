import { and, eq, desc, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { leonidas_sesiones } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

export const DESCANSO_MINIMO: Record<string, number> = {
  pecho: 48, espalda_alta: 48, espalda_baja: 72, hombros: 48,
  biceps: 48, triceps: 48, abdomen: 24, gluteos: 48,
  cuadriceps: 48, femorales: 48, pantorrillas: 24, cuerpo_completo: 72,
}

export const SECUENCIAS_PROHIBIDAS: [string, string][] = [
  ['triceps', 'espalda_alta'], ['espalda_alta', 'triceps'],
  ['pecho', 'hombros'], ['hombros', 'pecho'],
  ['biceps', 'espalda_alta'],
  ['cuadriceps', 'femorales'], ['femorales', 'cuadriceps'],
]

function makeError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export function makeLeonidasValidationService(db: DB) {
  return {
    async validarSecuenciaMuscular(usuarioId: string, grupo: string, timestamp: Date): Promise<void> {
      const descMin = DESCANSO_MINIMO[grupo]

      if (descMin !== undefined) {
        const [ultima] = await db
          .select({ timestamp: leonidas_sesiones.timestamp })
          .from(leonidas_sesiones)
          .where(and(
            eq(leonidas_sesiones.usuario_id, usuarioId),
            sql`${leonidas_sesiones.grupos_trabajados} @> ARRAY[${grupo}]::text[]`,
          ))
          .orderBy(desc(leonidas_sesiones.timestamp))
          .limit(1)

        if (ultima) {
          const horasTranscurridas = (timestamp.getTime() - new Date(ultima.timestamp as Date).getTime()) / (1000 * 3600)
          if (horasTranscurridas < descMin) {
            const horasRestantes = Math.ceil(descMin - horasTranscurridas)
            throw makeError(
              `${grupo} necesita ${descMin}h de descanso. Disponible en: ${horasRestantes}h`,
              422,
            )
          }
        }
      }

      const fechaStr = timestamp.toISOString().slice(0, 10)
      const [ultimaDia] = await db
        .select({ grupos_trabajados: leonidas_sesiones.grupos_trabajados })
        .from(leonidas_sesiones)
        .where(and(
          eq(leonidas_sesiones.usuario_id, usuarioId),
          sql`date(${leonidas_sesiones.timestamp} AT TIME ZONE 'UTC') = ${fechaStr}::date`,
        ))
        .orderBy(desc(leonidas_sesiones.timestamp))
        .limit(1)

      if (ultimaDia) {
        for (const grupoAnterior of ultimaDia.grupos_trabajados as string[]) {
          if (SECUENCIAS_PROHIBIDAS.some(([a, b]) => a === grupoAnterior && b === grupo)) {
            throw makeError(
              `No puedes entrenar ${grupo} después de ${grupoAnterior} el mismo día`,
              422,
            )
          }
        }
      }
    },

    validarDiaSemana(tipo: string, timestamp: Date): void {
      if (timestamp.getUTCDay() === 6 && tipo !== 'barras' && tipo !== 'trote') {
        throw makeError('Los sábados solo se permiten Trote y Barras', 422)
      }
    },
  }
}

export type LeonidasValidationService = ReturnType<typeof makeLeonidasValidationService>
