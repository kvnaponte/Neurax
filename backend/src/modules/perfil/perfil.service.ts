import { and, eq, gte, isNull, count } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { usuarios, actividades, usuario_achievements } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

export interface PerfilData {
  id: string
  nombre: string
  email: string
  avatar_url: string | null
  xp_por_semana: number[]
  logros_total: number
  logros_desbloqueados: number
  actividades_semana: number
}

/** Lunes 00:00 (local UTC) de la semana actual. */
function inicioSemana(now = new Date()): Date {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  const dow = d.getUTCDay() // 0=domingo
  const diff = dow === 0 ? 6 : dow - 1 // días desde el lunes
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

export async function obtenerPerfil(db: DB, usuarioId: string): Promise<PerfilData | null> {
  const [u] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      avatar_url: usuarios.avatar_url,
    })
    .from(usuarios)
    .where(eq(usuarios.id, usuarioId))
    .limit(1)

  if (!u) return null

  const lunes = inicioSemana()

  // XP por día (Lun..Dom) de la semana actual
  const actsSemana = await db
    .select({ ts: actividades.timestamp, xp: actividades.xp_generado })
    .from(actividades)
    .where(
      and(
        eq(actividades.usuario_id, usuarioId),
        gte(actividades.timestamp, lunes),
        isNull(actividades.deleted_at),
      ),
    )

  const xp_por_semana = [0, 0, 0, 0, 0, 0, 0]
  for (const a of actsSemana) {
    const dow = new Date(a.ts as Date).getUTCDay()
    const idx = dow === 0 ? 6 : dow - 1
    xp_por_semana[idx] += a.xp ?? 0
  }

  const [totalLogros] = await db
    .select({ c: count() })
    .from(usuario_achievements)
    .where(eq(usuario_achievements.usuario_id, usuarioId))

  const [desbloqueados] = await db
    .select({ c: count() })
    .from(usuario_achievements)
    .where(
      and(
        eq(usuario_achievements.usuario_id, usuarioId),
        eq(usuario_achievements.desbloqueado, true),
      ),
    )

  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    avatar_url: u.avatar_url,
    xp_por_semana,
    logros_total: Number(totalLogros?.c ?? 0),
    logros_desbloqueados: Number(desbloqueados?.c ?? 0),
    actividades_semana: actsSemana.length,
  }
}

export async function actualizarNombre(db: DB, usuarioId: string, nombre: string): Promise<void> {
  await db
    .update(usuarios)
    .set({ nombre, updated_at: new Date() })
    .where(eq(usuarios.id, usuarioId))
}

export async function actualizarAvatar(db: DB, usuarioId: string, avatarUrl: string): Promise<void> {
  await db
    .update(usuarios)
    .set({ avatar_url: avatarUrl, updated_at: new Date() })
    .where(eq(usuarios.id, usuarioId))
}
