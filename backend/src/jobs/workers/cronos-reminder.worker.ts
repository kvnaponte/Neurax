import { Worker } from 'bullmq'
import { and, gte, lte, eq, isNull } from 'drizzle-orm'
import { redisConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { cronos_eventos } from '../../db/schema/index.js'
import { crearNotificacion } from '../../modules/notifications/notifications.service.js'
import { getIo } from '../../shared/io.js'

export const cronosReminderWorker = new Worker(
  'cronos-reminder',
  async (_job) => {
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    // 7-minute window around the 1h mark to avoid missing events between runs
    const windowStart = new Date(inOneHour.getTime() - 7 * 60 * 1000)
    const windowEnd = new Date(inOneHour.getTime() + 7 * 60 * 1000)

    const eventos = await db.select({
      id: cronos_eventos.id,
      usuario_id: cronos_eventos.usuario_id,
      titulo: cronos_eventos.titulo,
    }).from(cronos_eventos)
      .where(and(
        gte(cronos_eventos.inicio_at, windowStart),
        lte(cronos_eventos.inicio_at, windowEnd),
        eq(cronos_eventos.completado, false),
        isNull(cronos_eventos.deleted_at),
      ))

    for (const evento of eventos) {
      await crearNotificacion(db, getIo(), evento.usuario_id, {
        tipo: 'cronos_proximo',
        titulo: 'Evento próximo en Cronos',
        mensaje: `"${evento.titulo}" comienza en 1 hora.`,
        data: { evento_id: evento.id },
      })
    }
  },
  { connection: redisConnection, concurrency: 1 },
)

cronosReminderWorker.on('error', (err) => console.error('[Worker] cronos-reminder error', err))
console.log('[Worker] cronos-reminder connected')
