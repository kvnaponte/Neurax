import { Worker } from 'bullmq'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { eq } from 'drizzle-orm'
import { usuarios } from '../../db/schema/index.js'
import { makeRachaService } from '../../modules/gamification/racha.service.js'
import { emitToUser } from '../../shared/io.js'
import { notificationsQueue } from '../queues.js'

const rachaService = makeRachaService(db)

export const streakCheckWorker = new Worker(
  'streak-check',
  async (_job) => {
    const activeUsers = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.active, true))

    for (const { id: usuarioId } of activeUsers) {
      const broke = await rachaService.verificarRupturaRacha(usuarioId)
      if (broke) {
        emitToUser(usuarioId, 'streak:updated', { racha_actual: 0, mejor_racha: await rachaService.calcularMejorRacha(usuarioId) })
        await notificationsQueue.add('racha_rota', { usuarioId, tipo: 'racha_en_riesgo' })
      }
    }
  },
  { connection: redisConnection, concurrency: 1 },
)

streakCheckWorker.on('error', (err) => console.error('[Worker] streak-check error', err))
console.log('[Worker] streak-check connected')
