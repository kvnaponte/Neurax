import { Worker } from 'bullmq'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { enviarPush } from '../../modules/notifications/notifications.service.js'

export const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    const { usuarioId, notificacionId, tipo } = job.data
    await enviarPush(db, usuarioId, notificacionId, tipo)
  },
  { connection: redisConnection, concurrency: 5 },
)

notificationsWorker.on('error', (err) => console.error('[Worker] notifications error', err))
console.log('[Worker] notifications connected')
