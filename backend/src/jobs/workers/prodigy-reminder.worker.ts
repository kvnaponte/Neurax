import { Worker } from 'bullmq'
import { and, eq } from 'drizzle-orm'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { prodigy_entregas } from '../../db/schema/index.js'
import { crearNotificacion, puedeNotificarCron } from '../../modules/notifications/notifications.service.js'
import { getIo } from '../../shared/io.js'

export const prodigyReminderWorker = new Worker(
  'prodigy-reminder',
  async (_job) => {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const entregas = await db.select({
      id: prodigy_entregas.id,
      usuario_id: prodigy_entregas.usuario_id,
      titulo: prodigy_entregas.titulo,
    }).from(prodigy_entregas)
      .where(and(
        eq(prodigy_entregas.fecha_limite, tomorrowStr),
        eq(prodigy_entregas.completado, false),
      ))

    for (const entrega of entregas) {
      if (!await puedeNotificarCron(db, entrega.usuario_id, 'entrega_prodigy')) continue

      await crearNotificacion(db, getIo(), entrega.usuario_id, {
        tipo: 'entrega_prodigy',
        titulo: 'Entrega académica mañana',
        mensaje: `"${entrega.titulo}" vence mañana. ¡No olvides completarla!`,
        data: { entrega_id: entrega.id },
      })
    }
  },
  { connection: redisConnection, concurrency: 1 },
)

prodigyReminderWorker.on('error', (err) => console.error('[Worker] prodigy-reminder error', err))
console.log('[Worker] prodigy-reminder connected')
