import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { redisConnection } from '../shared/redis.js'
import { sugerirLogros, sugerirMisiones, clasificarVideo } from '../modules/ia/ia.service.js'

const redis = new Redis({ ...redisConnection, lazyConnect: false })

export const iaTaskWorker = new Worker(
  'ai-task',
  async (job) => {
    const { tipo, usuarioId, ...payload } = job.data as { tipo: string; usuarioId: string; [key: string]: unknown }

    let result: unknown
    switch (tipo) {
      case 'suggest_logros':
        result = await sugerirLogros(usuarioId)
        break
      case 'suggest_misiones':
        result = await sugerirMisiones(usuarioId)
        break
      case 'clasificar_video':
        result = await clasificarVideo(usuarioId, payload.transcripcion as string)
        break
      default:
        throw new Error(`Tipo de job desconocido: ${tipo}`)
    }

    await redis.set(`ai:job:${job.id}`, JSON.stringify({ status: 'done', result }), 'EX', 3600)
    return result
  },
  { connection: redisConnection }
)

iaTaskWorker.on('failed', async (job, err) => {
  if (job?.id) {
    await redis.set(`ai:job:${job.id}`, JSON.stringify({ status: 'error', error: err.message }), 'EX', 3600)
  }
})
