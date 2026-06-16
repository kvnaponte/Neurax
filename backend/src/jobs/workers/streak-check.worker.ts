import { Worker } from 'bullmq'
import { redisConnection } from '../connection'
import { db } from '../../db/index'
import { eq } from 'drizzle-orm'
import { usuarios } from '../../db/schema'
import { makeRachaService } from '../../modules/gamification/racha.service'
import { getIo } from '../../shared/io'
import { notificationsQueue } from '../queues'

const rachaService = makeRachaService(db)

export const streakCheckWorker = new Worker(
  'streak-check',
  async (_job) => {
    const io = getIo()

    const activeUsers = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.active, true))

    for (const { id: usuarioId } of activeUsers) {
      const broke = await rachaService.verificarRupturaRacha(usuarioId)
      if (broke) {
        io?.to(usuarioId).emit('streak:updated', { racha: 0, usuarioId })
        await notificationsQueue.add('racha_rota', { usuarioId, tipo: 'racha_en_riesgo' })
      }
    }
  },
  { connection: redisConnection, concurrency: 1 },
)

streakCheckWorker.on('error', (err) => console.error('[Worker] streak-check error', err))
console.log('[Worker] streak-check connected')
