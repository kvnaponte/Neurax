import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { usuarios, xp_events } from '../../db/schema'
import { emitToUser } from '../../shared/io'
import { calcularBonusRacha, calcularNivel, calcularXPFinal } from '../../shared/xp.utils'
import { makeRachaService } from './racha.service'
import { makeLogrosService } from './logros.service'
import { getNivelInfo } from './gamification.constants'

type DB = PostgresJsDatabase<typeof schema>

const MAX_XP_RECURSION_DEPTH = 3

export interface OtorgarXPInput {
  usuarioId: string
  xpBase: number
  bonusHorario: number
  bonusRacha?: number
  fuente: string
  fuenteId?: string
  _depth?: number  // internal recursion guard — callers should not set this
}

export function makeXpService(db: DB) {
  const rachaService = makeRachaService(db)

  async function grantXP({ usuarioId, xpBase, bonusHorario, bonusRacha: rachaOverride, fuente, fuenteId, _depth }: OtorgarXPInput) {
    let bonusRacha = rachaOverride
    if (bonusRacha === undefined) {
      const diasRacha = await rachaService.calcularRachaActual(usuarioId)
      bonusRacha = calcularBonusRacha(diasRacha)
    }
    const xpFinal = calcularXPFinal(xpBase, bonusRacha, bonusHorario)

    const [anteriorRow] = await db
      .select({ nivel: usuarios.nivel })
      .from(usuarios)
      .where(eq(usuarios.id, usuarioId))
      .limit(1)

    if (!anteriorRow) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 })
    const nivelAnterior = anteriorRow.nivel

    await db.insert(xp_events).values({
      usuario_id: usuarioId,
      fuente,
      fuente_id: fuenteId,
      xp_amount: xpFinal,
      xp_base: xpBase,
      bonus_racha: String(bonusRacha.toFixed(2)),
      bonus_horario: String(bonusHorario.toFixed(2)),
    })

    const [updated] = await db
      .update(usuarios)
      .set({ xp_total: sql`${usuarios.xp_total} + ${xpFinal}`, updated_at: sql`now()` })
      .where(eq(usuarios.id, usuarioId))
      .returning({ xp_total: usuarios.xp_total })

    const xpTotalNuevo = updated.xp_total
    const nivelNuevo = calcularNivel(xpTotalNuevo)
    const subioNivel = nivelNuevo > nivelAnterior

    if (subioNivel) {
      await db.update(usuarios).set({ nivel: nivelNuevo }).where(eq(usuarios.id, usuarioId))
      const nivelInfo = getNivelInfo(nivelNuevo)
      emitToUser(usuarioId, 'level:up', {
        nivel_anterior: nivelAnterior,
        nivel_nuevo: nivelNuevo,
        nombre_nivel: nivelInfo.nombre,
        color_nivel: nivelInfo.color,
      })
    }

    emitToUser(usuarioId, 'xp:updated', { xp_total: xpTotalNuevo, nivel: nivelNuevo, xp_delta: xpFinal })

    const depth = _depth ?? 0
    if (depth < MAX_XP_RECURSION_DEPTH) {
      await logrosService.verificarLogros(usuarioId, depth + 1)
    }

    return { xp_otorgado: xpFinal, nivel_nuevo: nivelNuevo, subio_nivel: subioNivel }
  }

  const logrosService = makeLogrosService(db, rachaService, grantXP)

  return {
    async otorgarXP(params: OtorgarXPInput) {
      return grantXP(params)
    },
    logrosService,
  }
}

export type XpService = ReturnType<typeof makeXpService>
