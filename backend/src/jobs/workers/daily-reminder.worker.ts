import { Worker } from 'bullmq'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { notificaciones_config } from '../../db/schema/index.js'
import { crearNotificacion } from '../../modules/notifications/notifications.service.js'
import { getIo } from '../../shared/io.js'

export const dailyReminderWorker = new Worker(
  'daily-reminder',
  async (_job) => {
    const now = new Date()
    const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`

    const configs = await db.select({
      usuario_id: notificaciones_config.usuario_id,
      hora_recordatorio: notificaciones_config.hora_recordatorio,
    }).from(notificaciones_config)

    for (const config of configs) {
      const hora = (config.hora_recordatorio as string | null)?.substring(0, 5) ?? '07:00'
      if (hora === currentTime) {
        await crearNotificacion(db, getIo(), config.usuario_id, {
          tipo: 'recordatorio_diario',
          titulo: '¡Buenos días, guerrero!',
          mensaje: 'Registra tu actividad de hoy para mantener tu racha.',
        })
      }
    }
  },
  { connection: redisConnection, concurrency: 1 },
)

dailyReminderWorker.on('error', (err) => console.error('[Worker] daily-reminder error', err))
console.log('[Worker] daily-reminder connected')
