import { Worker } from 'bullmq'
import { and, eq, isNull, gte } from 'drizzle-orm'
import { redisConnection } from '../connection'
import { db } from '../../db/index'
import { usuarios, odin_misiones_catalogo, odin_misiones_usuario } from '../../db/schema'
import { getCatalogMap } from '../../modules/odin/odin.catalog'

export const odinWeeklyWorker = new Worker(
  'odin-weekly',
  async (_job) => {
    await getCatalogMap(db)

    const weeklyMissions = await db.select().from(odin_misiones_catalogo).where(and(
      eq(odin_misiones_catalogo.tipo, 'super_semanal'),
      eq(odin_misiones_catalogo.activa, true),
    ))

    if (weeklyMissions.length === 0) return

    const mission = weeklyMissions[Math.floor(Math.random() * weeklyMissions.length)]

    const now = new Date()
    const day = now.getUTCDay()
    const monday = new Date(now)
    monday.setUTCDate(now.getUTCDate() - (day === 0 ? 6 : day - 1))
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    const periodoInicio = monday.toISOString().slice(0, 10)
    const periodoFin = sunday.toISOString().slice(0, 10)

    const existing = await db
      .select({ usuario_id: odin_misiones_usuario.usuario_id })
      .from(odin_misiones_usuario)
      .where(and(
        eq(odin_misiones_usuario.periodo_tipo, 'semanal'),
        eq(odin_misiones_usuario.periodo_inicio, periodoInicio),
      ))

    const existingSet = new Set(existing.map(r => r.usuario_id))

    const allUsers = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.active, true), isNull(usuarios.deleted_at)))

    const toInsert = allUsers
      .filter(u => !existingSet.has(u.id))
      .map(u => ({
        usuario_id: u.id,
        catalogo_id: mission.id,
        periodo_tipo: 'semanal',
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        progreso: 0,
        total: mission.objetivo_valor,
        estado: 'activa',
      }))

    if (toInsert.length > 0) await db.insert(odin_misiones_usuario).values(toInsert)

    console.log(`[odin-weekly] Super misión "${mission.nombre}" asignada a ${toInsert.length} usuarios`)
  },
  { connection: redisConnection, concurrency: 1 }
)

odinWeeklyWorker.on('error', (err) => console.error('[Worker] odin-weekly error', err))
console.log('[Worker] odin-weekly connected')
