const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6381')

export const redisConnection = {
  host: url.hostname,
  port: parseInt(url.port || '6379'),
  password: url.password || undefined,
  db: url.pathname ? parseInt(url.pathname.slice(1)) || 0 : 0,
  maxRetriesPerRequest: null as null,
}
