import { and, eq, isNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { prodigy_cursos } from '../../db/schema'
import { makeCronosService } from '../cronos/cronos.service'

type DB = PostgresJsDatabase<typeof schema>

const BLOCK_MINUTES = 50

export function makeProdigyService(db: DB) {
  const cronosService = makeCronosService(db)

  return {
    async generarHorario(usuarioId: string, cursoId: string): Promise<{ bloques_creados: number }> {
      const [curso] = await db.select().from(prodigy_cursos)
        .where(and(
          eq(prodigy_cursos.id, cursoId),
          eq(prodigy_cursos.usuario_id, usuarioId),
          isNull(prodigy_cursos.deleted_at),
        ))
        .limit(1)

      if (!curso) throw Object.assign(new Error('Curso no encontrado'), { statusCode: 404 })
      if (!curso.fecha_fin) throw Object.assign(new Error('El curso no tiene fecha de finalización'), { statusCode: 400 })
      if (!curso.total_horas) throw Object.assign(new Error('El curso no tiene total de horas definido'), { statusCode: 400 })

      const hoy = new Date()
      hoy.setUTCHours(0, 0, 0, 0)

      // fecha_limite = fecha_fin - 3 days margin
      const fechaLimite = new Date(curso.fecha_fin + 'T00:00:00Z')
      fechaLimite.setUTCDate(fechaLimite.getUTCDate() - 3)

      if (fechaLimite <= hoy) throw Object.assign(new Error('Fecha límite ya pasó o es demasiado cercana'), { statusCode: 400 })

      const totalHoras = Number(curso.total_horas)
      const horasPendientes = totalHoras * (1 - (curso.progreso ?? 0) / 100)
      let minutosRestantes = Math.ceil(horasPendientes * 60)

      let bloques_creados = 0
      const cursor = new Date(hoy)

      while (cursor < fechaLimite && minutosRestantes > 0) {
        const fechaStr = cursor.toISOString().slice(0, 10)
        const slots = await cronosService.obtenerDisponibilidad(usuarioId, fechaStr)

        // Merge consecutive 30-min slots into windows long enough for a 50-min block
        let i = 0
        while (i < slots.length && minutosRestantes > 0) {
          const windowStart = new Date(slots[i].inicio)

          // Find how many consecutive slots follow
          let windowEnd = new Date(slots[i].fin)
          let j = i + 1
          while (j < slots.length) {
            const nextStart = new Date(slots[j].inicio)
            if (nextStart.getTime() === windowEnd.getTime()) {
              windowEnd = new Date(slots[j].fin)
              j++
            } else break
          }

          const windowMinutes = (windowEnd.getTime() - windowStart.getTime()) / 60_000
          if (windowMinutes >= BLOCK_MINUTES) {
            const fin = new Date(windowStart.getTime() + BLOCK_MINUTES * 60_000)
            try {
              await cronosService.crearEvento(usuarioId, {
                titulo: `Estudio: ${curso.titulo}`,
                tipo: 'estudio',
                inicio_at: windowStart,
                fin_at: fin,
                prioridad: 2,
                seccion_origen: 'prodigy',
                seccion_ref_id: cursoId,
              })
              bloques_creados++
              minutosRestantes -= BLOCK_MINUTES
            } catch { /* skip conflicting slot */ }
          }

          i = j  // advance past this window
        }

        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }

      return { bloques_creados }
    },
  }
}

export type ProdigyService = ReturnType<typeof makeProdigyService>
