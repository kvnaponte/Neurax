import { db } from '../../db/index.js'
import { dionisioVideos } from '../../db/schema/dionisio.js'
import { michelinRecetas } from '../../db/schema/contenido.js'
import { odysseiaDestinos } from '../../db/schema/contenido.js'
import { nemesisJuegos } from '../../db/schema/contenido.js'
import { kuberaProductos } from '../../db/schema/kubera.js'
import { proezaCanciones } from '../../db/schema/proeza.js'
import { prodigyCursos } from '../../db/schema/prodigy.js'
import { eq, and, isNull } from 'drizzle-orm'
import { Queue } from 'bullmq'
import { redisConnection } from '../../shared/redis.js'

const dionisioPipelineQueue = new Queue('queue:dionisio-pipeline', { connection: redisConnection })

export async function listarVideos(usuarioId: string, filtros: { categoria?: string; estado?: string } = {}) {
  const conditions = [eq(dionisioVideos.usuarioId, usuarioId), isNull(dionisioVideos.deletedAt)]
  if (filtros.categoria) conditions.push(eq(dionisioVideos.categoria, filtros.categoria))
  if (filtros.estado) conditions.push(eq(dionisioVideos.estado, filtros.estado))
  return db.select().from(dionisioVideos).where(and(...conditions))
}

export async function obtenerVideo(usuarioId: string, videoId: string) {
  const [video] = await db
    .select()
    .from(dionisioVideos)
    .where(and(eq(dionisioVideos.id, videoId), eq(dionisioVideos.usuarioId, usuarioId), isNull(dionisioVideos.deletedAt)))
  return video
}

export async function procesarVideo(videoId: string) {
  await dionisioPipelineQueue.add('procesar', { videoId })
  await db
    .update(dionisioVideos)
    .set({ pipelineEstado: 'pendiente', updatedAt: new Date() })
    .where(eq(dionisioVideos.id, videoId))
}

export async function agregarVideoManual(usuarioId: string, url: string) {
  const metadata = await extraerOpenGraph(url)
  const fuente = detectarFuente(url)

  const [video] = await db
    .insert(dionisioVideos)
    .values({
      usuarioId,
      url,
      titulo: metadata.titulo,
      thumbnailUrl: metadata.thumbnailUrl,
      fuente,
      estado: 'guardado',
      pipelineEstado: 'manual',
    })
    .returning()
  return video
}

export async function reclasificarVideo(usuarioId: string, videoId: string, nuevaCategoria: string) {
  const [video] = await db
    .update(dionisioVideos)
    .set({ categoria: nuevaCategoria, updatedAt: new Date() })
    .where(and(eq(dionisioVideos.id, videoId), eq(dionisioVideos.usuarioId, usuarioId), isNull(dionisioVideos.deletedAt)))
    .returning()
  return video
}

export async function accionarVideo(usuarioId: string, videoId: string, seccion: string, data: Record<string, unknown>) {
  const video = await obtenerVideo(usuarioId, videoId)
  if (!video) return null

  const nombre = (data.nombre as string) ?? video.titulo ?? 'Sin título'
  const urlReferencia = video.url
  const fotoUrl = video.thumbnailUrl ?? undefined

  let refId: string | undefined

  switch (seccion) {
    case 'michelin_receta': {
      const [r] = await db
        .insert(michelinRecetas)
        .values({ usuarioId, nombre, urlReferencia, fotoUrl, estado: 'pendiente' })
        .returning()
      refId = r.id
      break
    }
    case 'odysseia_destino': {
      const [r] = await db
        .insert(odysseiaDestinos)
        .values({ usuarioId, nombre, estado: 'pendiente' })
        .returning()
      refId = r.id
      break
    }
    case 'nemesis_juego': {
      const [r] = await db
        .insert(nemesisJuegos)
        .values({ usuarioId, nombre, estado: 'por_comprar' })
        .returning()
      refId = r.id
      break
    }
    case 'kubera_producto': {
      const [r] = await db
        .insert(kuberaProductos)
        .values({ usuarioId, nombre, enlace: urlReferencia, fotoUrl, estado: 'deseado' })
        .returning()
      refId = r.id
      break
    }
    case 'proeza_cancion': {
      const [r] = await db
        .insert(proezaCanciones)
        .values({ usuarioId, nombre, estadoPipeline: 'idea' })
        .returning()
      refId = r.id
      break
    }
    case 'prodigy_curso': {
      const [r] = await db
        .insert(prodigyCursos)
        .values({ usuarioId, nombre, estado: 'por_empezar' })
        .returning()
      refId = r.id
      break
    }
    case 'soberbio_lugar':
    case 'leonidas_nota':
      break
    case 'otro':
      return video
    default:
      break
  }

  const [updated] = await db
    .update(dionisioVideos)
    .set({ estado: 'accionado', seccionDestino: seccion, seccionRefId: refId, updatedAt: new Date() })
    .where(and(eq(dionisioVideos.id, videoId), eq(dionisioVideos.usuarioId, usuarioId)))
    .returning()
  return updated
}

export async function eliminarVideo(usuarioId: string, videoId: string) {
  const [video] = await db
    .update(dionisioVideos)
    .set({ deletedAt: new Date() })
    .where(and(eq(dionisioVideos.id, videoId), eq(dionisioVideos.usuarioId, usuarioId), isNull(dionisioVideos.deletedAt)))
    .returning()
  return video
}

async function extraerOpenGraph(url: string): Promise<{ titulo?: string; thumbnailUrl?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuraxBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const titulo = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    const thumbnailUrl = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    return { titulo, thumbnailUrl }
  } catch {
    return {}
  }
}

function detectarFuente(url: string): string {
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('fb.com') || url.includes('facebook.com')) return 'facebook'
  return 'otro'
}
