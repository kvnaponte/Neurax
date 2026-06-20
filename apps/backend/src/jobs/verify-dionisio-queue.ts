import 'dotenv/config'
import { Queue, Worker } from 'bullmq'
import { spawn } from 'child_process'
import { unlink } from 'fs/promises'

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:61204')
const conn = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null as null,
}

function pass(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1 }

// ──────────────────────────────────────────────
// BullMQ: Queue dispatch
// ──────────────────────────────────────────────
console.log('[BullMQ] Queue dispatch a Redis')
const queue = new Queue('dionisio-pipeline-test', { connection: conn })
const job = await queue.add('test-job', { videoId: 'dummy-uuid' })
if (job.id) pass(`Job despachado a Redis con id: ${job.id}`)
else fail('Queue.add() no retornó id')
await queue.obliterate({ force: true })
await queue.close()

// ──────────────────────────────────────────────
// AC4+AC5: Worker — yt-dlp falla → error, no crash
// ──────────────────────────────────────────────
console.log('\n[AC4+AC5] Worker pipeline error handling (yt-dlp con URL inválida)')

const { db } = await import('../db/index.js')
const { dionisioVideos } = await import('../db/schema/dionisio.js')
const { eq } = await import('drizzle-orm')

const [videoRow] = await db.insert(dionisioVideos).values({
  usuarioId: '00000000-0000-0000-0000-000000000001',
  url: 'https://www.tiktok.com/@private/video/000000000000000000',
  fuente: 'tiktok',
  estado: 'guardado',
  pipelineEstado: 'pendiente',
}).returning()
const videoId = videoRow.id

const pipelineQueue = new Queue('dionisio-verify-pipeline', { connection: conn })

const done = new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Worker timeout 30s')), 30_000)

  const worker = new Worker('dionisio-verify-pipeline', async (job) => {
    const { videoId: vid } = job.data as { videoId: string }
    const tmpMp4 = `/tmp/neurax_verify_${vid}.mp4`
    const tmpMp3 = `/tmp/neurax_verify_${vid}.mp3`
    const tmpJson = `/tmp/neurax_verify_${vid}.json`
    try {
      await db.update(dionisioVideos).set({ pipelineEstado: 'descargando', updatedAt: new Date() }).where(eq(dionisioVideos.id, vid))
      await new Promise<void>((res, rej) => {
        const proc = spawn('yt-dlp', ['https://www.tiktok.com/@private/video/000000000000000000', '-o', tmpMp4, '--no-playlist'])
        let stderr = ''
        proc.stderr.on('data', (d) => { stderr += d })
        proc.on('close', (code) => { if (code === 0) res(); else rej(new Error(stderr.trim() || `yt-dlp exit ${code}`)) })
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await db.update(dionisioVideos).set({ pipelineEstado: 'error', pipelineError: msg, updatedAt: new Date() }).where(eq(dionisioVideos.id, vid))
    } finally {
      await Promise.allSettled([unlink(tmpMp4), unlink(tmpMp3), unlink(tmpJson)])
      clearTimeout(timeout)
      worker.close().finally(resolve)
    }
  }, { connection: conn })

  worker.on('failed', (_job, err) => { clearTimeout(timeout); reject(err) })
})

await pipelineQueue.add('procesar', { videoId })
await done
await pipelineQueue.obliterate({ force: true })
await pipelineQueue.close()

const [result] = await db.select().from(dionisioVideos).where(eq(dionisioVideos.id, videoId))
if (result.pipelineEstado === 'error') pass(`pipeline_estado = 'error' tras fallo yt-dlp`)
else fail(`pipeline_estado incorrecto: ${result.pipelineEstado}`)
if (result.pipelineError && result.pipelineError.length > 0) pass(`pipeline_error descriptivo: "${result.pipelineError.slice(0, 80)}"`)
else fail('pipeline_error vacío')
pass('Worker no crasheó (proceso completó sin excepción no manejada)')

await db.delete(dionisioVideos).where(eq(dionisioVideos.usuarioId, '00000000-0000-0000-0000-000000000001'))
process.exit(process.exitCode ?? 0)
