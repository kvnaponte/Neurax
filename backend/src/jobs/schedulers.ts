import {
  odinDailyQueue,
  odinWeeklyQueue,
  odinMonthlyQueue,
  streakCheckQueue,
  dailyReminderQueue,
  streakAlertQueue,
  cronosReminderQueue,
  prodigyReminderQueue,
} from './queues'

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

  // Every minute: check which users have hora_recordatorio = now
  await dailyReminderQueue.upsertJobScheduler(
    'daily-reminder-cron',
    { pattern: '* * * * *' },
    { name: 'daily-reminder', data: {} },
  )

  // 20:00 every day: alert users with no activity today
  await streakAlertQueue.upsertJobScheduler(
    'streak-alert-cron',
    { pattern: '0 20 * * *' },
    { name: 'streak-alert', data: {} },
  )

  // Every 15 minutes: find Cronos events starting in ~1h
  await cronosReminderQueue.upsertJobScheduler(
    'cronos-reminder-cron',
    { pattern: '*/15 * * * *' },
    { name: 'cronos-reminder', data: {} },
  )

  // Daily at 08:00: check prodigy deadlines due tomorrow
  await prodigyReminderQueue.upsertJobScheduler(
    'prodigy-reminder-cron',
    { pattern: '0 8 * * *' },
    { name: 'prodigy-reminder', data: {} },
  )
}
