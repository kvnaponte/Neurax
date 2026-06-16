import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { usuarios, xp_events } from '../../db/schema'
import { getIo } from '../../shared/io'
import { calcularBonusRacha, calcularNivel, calcularXPFinal } from '../../shared/xp.utils'
import { makeRachaService } from './racha.service'

type DB = PostgresJsDatabase<typeof schema>

interface OtorgarXPInput {
  usuarioId: string
  xpBase: number
  bonusHorario: number
  fuente: string
  fuenteId?: string
}

export function makeXpService(db: DB) {
  const rachaService = makeRachaService(db)

  return {
    async otorgarXP({ usuarioId, xpBase, bonusHorario, fuente, fuenteId }: OtorgarXPInput) {
      const diasRacha = await rachaService.calcularRachaActual(usuarioId)
      const bonusRacha = calcularBonusRacha(diasRacha)
      const xpFinal = calcularXPFinal(xpBase, bonusRacha, bonusHorario)

      const nivelAnteriorRow = await db
        .select({ nivel: usuarios.nivel, xp_total: usuarios.xp_total })
        .from(usuarios)
        .where(eq(usuarios.id, usuarioId))
        .limit(1)

      if (!nivelAnteriorRow.length) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 })
      const nivelAnterior = nivelAnteriorRow[0].nivel

      await db.insert(xp_events).values({
        usuario_id: usuarioId,
        fuente,
        fuente_id: fuenteId,
        xp_amount: xpFinal,
        xp_base: xpBase,
        bonus_racha: String(bonusRacha.toFixed(2)),
        bonus_horario: String(bonusHorario.toFixed(2)),
      })

      const updated = await db
        .update(usuarios)
        .set({ xp_total: sql`${usuarios.xp_total} + ${xpFinal}`, updated_at: sql`now()` })
        .where(eq(usuarios.id, usuarioId))
        .returning({ xp_total: usuarios.xp_total })

      const xpTotalNuevo = updated[0].xp_total
      const nivelNuevo = calcularNivel(xpTotalNuevo)
      const subioNivel = nivelNuevo > nivelAnterior

      if (subioNivel) {
        await db.update(usuarios)
          .set({ nivel: nivelNuevo })
          .where(eq(usuarios.id, usuarioId))

        getIo()?.to(usuarioId).emit('level:up', { nivel: nivelNuevo, xp_total: xpTotalNuevo })
      }

      getIo()?.to(usuarioId).emit('xp:updated', { xp_total: xpTotalNuevo, nivel: nivelNuevo, xp_delta: xpFinal })

      // logros.service.verificarLogros — stub hasta implementación de issue #logros
      return { xp_otorgado: xpFinal, nivel_nuevo: nivelNuevo, subio_nivel: subioNivel }
    },
  }
}

export type XpService = ReturnType<typeof makeXpService>
