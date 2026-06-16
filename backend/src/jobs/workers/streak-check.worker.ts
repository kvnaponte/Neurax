import { Worker } from 'bullmq'
import { redisConnection } from '../connection'

export const streakCheckWorker = new Worker(
  'streak-check',
  async (_job) => {
    // TODO: verificar y actualizar rachas de usuarios al final del día
  },
  { connection: redisConnection, concurrency: 5 }
)

streakCheckWorker.on('error', (err) => console.error('[Worker] streak-check error', err))
console.log('[Worker] streak-check connected')
