import { Worker } from 'bullmq'
import { and, eq, isNull } from 'drizzle-orm'
import { redisConnection } from '../connection'
import { db } from '../../db/index'
import { usuarios, odin_misiones_catalogo, odin_misiones_usuario } from '../../db/schema'
import { getCatalogMap } from '../../modules/odin/odin.catalog'

export const odinMonthlyWorker = new Worker(
  'odin-monthly',
  async (_job) => {
    await getCatalogMap(db)

    const monthlyMissions = await db.select().from(odin_misiones_catalogo).where(and(
      eq(odin_misiones_catalogo.tipo, 'super_mensual'),
      eq(odin_misiones_catalogo.activa, true),
    ))

    if (monthlyMissions.length === 0) return

    const mission = monthlyMissions[Math.floor(Math.random() * monthlyMissions.length)]

    const now = new Date()
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth() + 1
    const periodoInicio = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getUTCDate()
    const periodoFin = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const existing = await db
      .select({ usuario_id: odin_misiones_usuario.usuario_id })
      .from(odin_misiones_usuario)
      .where(and(
        eq(odin_misiones_usuario.periodo_tipo, 'mensual'),
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
        periodo_tipo: 'mensual',
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        progreso: 0,
        total: mission.objetivo_valor,
        estado: 'activa',
      }))

    if (toInsert.length > 0) await db.insert(odin_misiones_usuario).values(toInsert)

    console.log(`[odin-monthly] Super misión "${mission.nombre}" asignada a ${toInsert.length} usuarios`)
  },
  { connection: redisConnection, concurrency: 1 }
)

odinMonthlyWorker.on('error', (err) => console.error('[Worker] odin-monthly error', err))
console.log('[Worker] odin-monthly connected')
