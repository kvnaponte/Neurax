import { Worker } from 'bullmq'
import { eq, and, isNull } from 'drizzle-orm'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { usuarios, rachas } from '../../db/schema/index.js'
import { crearNotificacion } from '../../modules/notifications/notifications.service.js'
import { getIo } from '../../shared/io.js'

export const streakAlertWorker = new Worker(
  'streak-alert',
  async (_job) => {
    const today = new Date().toISOString().slice(0, 10)

    const activeUsers = await db.select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.active, true), isNull(usuarios.deleted_at)))

    for (const { id: usuarioId } of activeUsers) {
      const [entry] = await db.select({ tiene_actividad: rachas.tiene_actividad })
        .from(rachas)
        .where(and(eq(rachas.usuario_id, usuarioId), eq(rachas.fecha, today)))
        .limit(1)

      if (!entry?.tiene_actividad) {
        await crearNotificacion(db, getIo(), usuarioId, {
          tipo: 'racha_en_riesgo',
          titulo: 'Tu racha está en riesgo',
          mensaje: 'No has registrado actividad hoy. ¡Registra algo antes de medianoche!',
        })
      }
    }
  },
  { connection: redisConnection, concurrency: 1 },
)

streakAlertWorker.on('error', (err) => console.error('[Worker] streak-alert error', err))
console.log('[Worker] streak-alert connected')
