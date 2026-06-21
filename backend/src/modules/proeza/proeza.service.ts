import { and, eq, isNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { proeza_canciones } from '../../db/schema'
import { makeCronosService } from '../cronos/cronos.service'

type DB = PostgresJsDatabase<typeof schema>

export function makeProezaService(db: DB) {
  const cronosService = makeCronosService(db)

  return {
    async registrarFechaObjetivo(
      usuarioId: string,
      cancionId: string,
      fechaLanzamiento: string,
    ): Promise<{ eventos_creados: number }> {
      const [cancion] = await db.select().from(proeza_canciones)
        .where(and(
          eq(proeza_canciones.id, cancionId),
          eq(proeza_canciones.usuario_id, usuarioId),
          isNull(proeza_canciones.deleted_at),
        ))
        .limit(1)

      if (!cancion) throw Object.assign(new Error('Canción no encontrada'), { statusCode: 404 })

      await db.update(proeza_canciones)
        .set({ fecha_objetivo_lanzamiento: fechaLanzamiento })
        .where(eq(proeza_canciones.id, cancionId))

      const base = new Date(fechaLanzamiento + 'T12:00:00Z')
      const hoy = new Date()
      hoy.setUTCHours(0, 0, 0, 0)

      // 4 reminder dates: day, -1, -3, -7
      const offsets = [0, -1, -3, -7]
      let eventos_creados = 0

      for (const offset of offsets) {
        const fecha = new Date(base)
        fecha.setUTCDate(fecha.getUTCDate() + offset)

        if (fecha < hoy) continue  // skip past dates

        const inicio = new Date(fecha)
        inicio.setUTCHours(9, 0, 0, 0)
        const fin = new Date(inicio.getTime() + 30 * 60_000)

        try {
          await cronosService.crearEvento(usuarioId, {
            titulo: `[Proeza] Fecha: ${cancion.titulo}`,
            tipo: 'recordatorio',
            inicio_at: inicio,
            fin_at: fin,
            prioridad: 2,
            seccion_origen: 'proeza',
            seccion_ref_id: cancionId,
          })
          eventos_creados++
        } catch {
          // Skip on slot conflict
        }
      }

      await db.update(proeza_canciones)
        .set({ cronos_sincronizado: true })
        .where(eq(proeza_canciones.id, cancionId))

      return { eventos_creados }
    },
  }
}

export type ProezaService = ReturnType<typeof makeProezaService>
