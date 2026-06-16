import { Worker } from 'bullmq'
import { redisConnection } from '../connection'

export const dionisioPipelineWorker = new Worker(
  'dionisio-pipeline',
  async (_job) => {
    // TODO: procesar pipeline de videos TikTok (descarga, transcripción, clasificación IA)
  },
  { connection: redisConnection, concurrency: 5 }
)

dionisioPipelineWorker.on('error', (err) => console.error('[Worker] dionisio-pipeline error', err))
console.log('[Worker] dionisio-pipeline connected')
