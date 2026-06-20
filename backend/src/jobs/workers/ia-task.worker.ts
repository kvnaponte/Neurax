import { Worker } from 'bullmq'
import { redisConnection } from '../connection'

export const iaTaskWorker = new Worker(
  'ai-task',
  async (_job) => {
    // TODO: procesar tareas IA async (clasificación Dionisio, sugerencias logros, etc.)
  },
  { connection: redisConnection, concurrency: 5 }
)

iaTaskWorker.on('error', (err) => console.error('[Worker] ai-task error', err))
console.log('[Worker] ai-task connected')
