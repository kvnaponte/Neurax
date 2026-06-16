import { Worker } from 'bullmq'
import { redisConnection } from '../connection'

export const odinDailyWorker = new Worker(
  'odin-daily',
  async (_job) => {
    // TODO: generar misiones diarias Odin para todos los usuarios activos
  },
  { connection: redisConnection, concurrency: 5 }
)

odinDailyWorker.on('error', (err) => console.error('[Worker] odin-daily error', err))
console.log('[Worker] odin-daily connected')
