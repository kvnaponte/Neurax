import { Worker } from 'bullmq'
import { spawn } from 'child_process'
import { unlink } from 'fs/promises'
import { db } from '../db/index.js'
import { dionisioVideos } from '../db/schema/dionisio.js'
import { eq } from 'drizzle-orm'
import { redisConnection } from '../shared/redis.js'

type ClasificacionResult = {
  categoria: string
  subcategoria: string
  destino_sugerido: string
}

async function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => { stdout += d })
    proc.stderr.on('data', (d) => { stderr += d })
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim() || `${cmd} exited with code ${code}`))
    })
  })
}

async function setPipelineEstado(videoId: string, estado: string) {
  await db.update(dionisioVideos).set({ pipelineEstado: estado, updatedAt: new Date() }).where(eq(dionisioVideos.id, videoId))
}

async function clasificarVideo(_usuarioId: string, transcripcion: string): Promise<ClasificacionResult> {
  // Stub until issue #21 (IA CLI) is implemented
  const lower = transcripcion.toLowerCase()
  if (lower.includes('receta') || lower.includes('ingredientes')) return { categoria: 'receta', subcategoria: 'cocina', destino_sugerido: 'michelin_receta' }
  if (lower.includes('restaurante') || lower.includes('comida')) return { categoria: 'lugares_restaurante', subcategoria: 'gastronomia', destino_sugerido: 'soberbio_lugar' }
  if (lower.includes('viaje') || lower.includes('turismo') || lower.includes('ciudad')) return { categoria: 'turismo', subcategoria: 'destino', destino_sugerido: 'odysseia_destino' }
  if (lower.includes('juego') || lower.includes('videojuego') || lower.includes('game')) return { categoria: 'juego', subcategoria: 'gaming', destino_sugerido: 'nemesis_juego' }
  if (lower.includes('comprar') || lower.includes('producto') || lower.includes('tienda')) return { categoria: 'producto', subcategoria: 'compra', destino_sugerido: 'kubera_producto' }
  if (lower.includes('cancion') || lower.includes('música') || lower.includes('beat')) return { categoria: 'musica', subcategoria: 'cancion', destino_sugerido: 'proeza_cancion' }
  if (lower.includes('ejercicio') || lower.includes('entrena') || lower.includes('gym')) return { categoria: 'ejercicio', subcategoria: 'fitness', destino_sugerido: 'leonidas_nota' }
  if (lower.includes('curso') || lower.includes('aprende') || lower.includes('tutorial')) return { categoria: 'aprende', subcategoria: 'educacion', destino_sugerido: 'prodigy_curso' }
  return { categoria: 'otro', subcategoria: 'sin_clasificar', destino_sugerido: 'revision_manual' }
}

export const dionisioPipelineWorker = new Worker(
  'queue:dionisio-pipeline',
  async (job) => {
    const { videoId } = job.data as { videoId: string }

    const [video] = await db.select().from(dionisioVideos).where(eq(dionisioVideos.id, videoId))
    if (!video) throw new Error(`Video ${videoId} not found`)

    const tmpMp4 = `/tmp/neurax_${videoId}.mp4`
    const tmpMp3 = `/tmp/neurax_${videoId}.mp3`
    const tmpJson = `/tmp/neurax_${videoId}.json`

    try {
      await setPipelineEstado(videoId, 'descargando')
      await run('yt-dlp', [video.url, '-o', tmpMp4])

      await setPipelineEstado(videoId, 'convirtiendo')
      await run('ffmpeg', ['-i', tmpMp4, '-vn', '-acodec', 'mp3', tmpMp3, '-y'])

      await setPipelineEstado(videoId, 'transcribiendo')
      let transcripcion = ''
      try {
        await run('whisper', [tmpMp3, '--model', 'base', '--output_format', 'json', '--language', 'es', '--output_dir', '/tmp'])
        const raw = await import('fs').then((m) => m.readFileSync(tmpJson, 'utf-8'))
        const parsed = JSON.parse(raw) as { text?: string }
        transcripcion = parsed.text ?? ''
      } catch {
        await db
          .update(dionisioVideos)
          .set({ estado: 'descartado', pipelineEstado: 'completado', updatedAt: new Date() })
          .where(eq(dionisioVideos.id, videoId))
        return
      }

      if (!transcripcion.trim()) {
        await db
          .update(dionisioVideos)
          .set({ estado: 'descartado', pipelineEstado: 'completado', updatedAt: new Date() })
          .where(eq(dionisioVideos.id, videoId))
        return
      }

      await setPipelineEstado(videoId, 'clasificando')
      const clasificacion = await clasificarVideo(video.usuarioId, transcripcion)

      await db
        .update(dionisioVideos)
        .set({
          categoria: clasificacion.categoria,
          subcategoria: clasificacion.subcategoria,
          destinoSugerido: clasificacion.destino_sugerido,
          pipelineEstado: 'completado',
          updatedAt: new Date(),
        })
        .where(eq(dionisioVideos.id, videoId))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await db
        .update(dionisioVideos)
        .set({ pipelineEstado: 'error', pipelineError: msg, updatedAt: new Date() })
        .where(eq(dionisioVideos.id, videoId))
    } finally {
      await Promise.allSettled([unlink(tmpMp4), unlink(tmpMp3), unlink(tmpJson)])
    }
  },
  { connection: redisConnection }
)
