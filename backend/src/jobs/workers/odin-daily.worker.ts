import { Worker } from 'bullmq'
import { and, eq, isNull } from 'drizzle-orm'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { usuarios } from '../../db/schema/index.js'
import { getCatalogMap } from '../../modules/odin/odin.catalog.js'
import { makeOdinService } from '../../modules/odin/odin.service.js'
import { crearNotificacion, puedeNotificarCron } from '../../modules/notifications/notifications.service.js'
import { getIo } from '../../shared/io.js'

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
        const result = await service.generarMisionesDelDia(user.id)
        if (!result.skipped && await puedeNotificarCron(db, user.id, 'odin_disponible')) {
          await crearNotificacion(db, getIo(), user.id, {
            tipo: 'odin_disponible',
            titulo: 'Misiones Odin disponibles',
            mensaje: 'Tus misiones del día están listas. ¡Completa todas para abrir el cofre épico!',
          })
        }
      } catch (err) {
        console.error(`[odin-daily] Error usuario ${user.id}:`, err)
      }
    }

    console.log(`[odin-daily] Misiones generadas para ${allUsers.length} usuarios`)
  },
  { connection: redisConnection, concurrency: 5 },
)

odinDailyWorker.on('error', (err) => console.error('[Worker] odin-daily error', err))
console.log('[Worker] odin-daily connected')
