import { Worker } from 'bullmq'
import { and, eq, isNull } from 'drizzle-orm'
import { redisConnection } from '../connection'
import { db } from '../../db/index'
import { usuarios } from '../../db/schema'
import { getCatalogMap } from '../../modules/odin/odin.catalog'
import { makeOdinService } from '../../modules/odin/odin.service'

export const odinDailyWorker = new Worker(
  'odin-daily',
  async (_job) => {
    await getCatalogMap(db)

    const allUsers = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.active, true), isNull(usuarios.deleted_at)))

    const service = makeOdinService(db)

    for (const user of allUsers) {
      try {
        await service.generarMisionesDelDia(user.id)
      } catch (err) {
        console.error(`[odin-daily] Error usuario ${user.id}:`, err)
      }
    }

    console.log(`[odin-daily] Misiones generadas para ${allUsers.length} usuarios`)
  },
  { connection: redisConnection, concurrency: 5 }
)

odinDailyWorker.on('error', (err) => console.error('[Worker] odin-daily error', err))
console.log('[Worker] odin-daily connected')
