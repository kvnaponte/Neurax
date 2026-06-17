import { Queue } from 'bullmq'
import { redisConnection } from './connection'

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1000 },
}

export const notificationsQueue    = new Queue('notifications',       { connection: redisConnection, defaultJobOptions })
export const odinDailyQueue        = new Queue('odin-daily',          { connection: redisConnection, defaultJobOptions })
export const odinWeeklyQueue       = new Queue('odin-weekly',         { connection: redisConnection, defaultJobOptions })
export const odinMonthlyQueue      = new Queue('odin-monthly',        { connection: redisConnection, defaultJobOptions })
export const streakCheckQueue      = new Queue('streak-check',        { connection: redisConnection, defaultJobOptions })
export const aiTaskQueue           = new Queue('ai-task',             { connection: redisConnection, defaultJobOptions })
export const dionisioPipelineQueue = new Queue('dionisio-pipeline',   { connection: redisConnection, defaultJobOptions })
