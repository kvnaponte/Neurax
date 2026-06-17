import { odinDailyQueue, odinWeeklyQueue, odinMonthlyQueue, streakCheckQueue } from './queues'

export async function setupSchedulers() {
  await odinDailyQueue.upsertJobScheduler(
    'odin-daily-cron',
    { pattern: '0 0 * * *' },
    { name: 'odin-daily', data: {} },
  )

  await odinWeeklyQueue.upsertJobScheduler(
    'odin-weekly-cron',
    { pattern: '0 0 * * 1' },
    { name: 'odin-weekly', data: {} },
  )

  await odinMonthlyQueue.upsertJobScheduler(
    'odin-monthly-cron',
    { pattern: '0 0 1 * *' },
    { name: 'odin-monthly', data: {} },
  )

  await streakCheckQueue.upsertJobScheduler(
    'streak-check-cron',
    { pattern: '55 23 * * *' },
    { name: 'streak-check', data: {} },
  )
}
