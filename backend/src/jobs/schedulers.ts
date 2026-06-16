import { odinDailyQueue, streakCheckQueue } from './queues'

export async function setupSchedulers() {
  // Generar misiones Odin diarias a medianoche
  await odinDailyQueue.upsertJobScheduler(
    'odin-daily-cron',
    { pattern: '0 0 * * *' },
    { name: 'odin-daily', data: {} },
  )

  // Verificar rachas de usuarios a las 23:55 para detectar breaks
  await streakCheckQueue.upsertJobScheduler(
    'streak-check-cron',
    { pattern: '55 23 * * *' },
    { name: 'streak-check', data: {} },
  )
}
