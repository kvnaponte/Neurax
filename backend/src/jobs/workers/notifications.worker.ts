import { Worker } from 'bullmq'
import { redisConnection } from '../connection'

export const notificationsWorker = new Worker(
  'notifications',
  async (_job) => {
    // TODO: implementar envío de notificaciones push
  },
  { connection: redisConnection, concurrency: 5 }
)

notificationsWorker.on('error', (err) => console.error('[Worker] notifications error', err))
console.log('[Worker] notifications connected')
