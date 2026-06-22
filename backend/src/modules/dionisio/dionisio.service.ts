import { and, eq, isNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import {
  dionisio_videos,
  soberbio_lugares,
  michelin_recetas,
  odysseia_destinos,
  kubera_productos,
  nemesis_juegos,
  prodigy_cursos,
  proeza_canciones,
  leonidas_referencias,
} from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

type SeccionDestino =
  | 'soberbio' | 'michelin' | 'odysseia' | 'kubera'
  | 'nemesis' | 'prodigy' | 'proeza' | 'leonidas'

interface AccionarData {
  precio?: string
  pais?: string
  plataforma?: string
  beatmaker?: string
}

export function makeDionisioService(db: DB) {
  return {
    async accionarVideo(
      usuarioId: string,
      videoId: string,
      seccion: SeccionDestino,
      data: AccionarData = {},
    ): Promise<{ seccion_ref_id: string }> {
      const [video] = await db.select().from(dionisio_videos)
        .where(and(
          eq(dionisio_videos.id, videoId),
          eq(dionisio_videos.usuario_id, usuarioId),
          isNull(dionisio_videos.deleted_at),
        ))
        .limit(1)

      if (!video) throw Object.assign(new Error('Video no encontrado'), { statusCode: 404 })

      const titulo = video.titulo ?? 'Sin título'
      let refId: string

      switch (seccion) {
        case 'soberbio': {
          const [row] = await db.insert(soberbio_lugares).values({
            usuario_id: usuarioId,
            nombre: titulo,
            fuente: 'dionisio',
            precio_estimado: data.precio ?? null,
          }).returning({ id: soberbio_lugares.id })
          refId = row.id
          break
        }
        case 'michelin': {
          const [row] = await db.insert(michelin_recetas).values({
            usuario_id: usuarioId,
            nombre: titulo,
            url_referencia: video.url ?? null,
            foto_url: video.thumbnail_url ?? null,
          }).returning({ id: michelin_recetas.id })
          refId = row.id
          break
        }
        case 'odysseia': {
          const [row] = await db.insert(odysseia_destinos).values({
            usuario_id: usuarioId,
            nombre: titulo,
            pais: data.pais ?? null,
          }).returning({ id: odysseia_destinos.id })
          refId = row.id
          break
        }
        case 'kubera': {
          const [row] = await db.insert(kubera_productos).values({
            usuario_id: usuarioId,
            nombre: titulo,
            url: video.url ?? null,
          }).returning({ id: kubera_productos.id })
          refId = row.id
          break
        }
        case 'nemesis': {
          const [row] = await db.insert(nemesis_juegos).values({
            usuario_id: usuarioId,
            titulo,
            cover_url: video.thumbnail_url ?? null,
          }).returning({ id: nemesis_juegos.id })
          refId = row.id
          break
        }
        case 'prodigy': {
          const [row] = await db.insert(prodigy_cursos).values({
            usuario_id: usuarioId,
            titulo,
            plataforma: data.plataforma ?? null,
          }).returning({ id: prodigy_cursos.id })
          refId = row.id
          break
        }
        case 'proeza': {
          const [row] = await db.insert(proeza_canciones).values({
            usuario_id: usuarioId,
            titulo,
            beatmaker: data.beatmaker ?? null,
          }).returning({ id: proeza_canciones.id })
          refId = row.id
          break
        }
        case 'leonidas': {
          const [row] = await db.insert(leonidas_referencias).values({
            usuario_id: usuarioId,
            nombre: titulo,
            url_referencia: video.url ?? null,
            thumbnail_url: video.thumbnail_url ?? null,
            fuente: 'dionisio',
          }).returning({ id: leonidas_referencias.id })
          refId = row.id
          break
        }
        default:
          throw Object.assign(new Error(`Sección desconocida: ${seccion}`), { statusCode: 400 })
      }

      await db.update(dionisio_videos)
        .set({
          seccion_destino: seccion,
          seccion_ref_id: refId !== videoId ? refId : null,
          estado: 'accionado',
        })
        .where(eq(dionisio_videos.id, videoId))

      return { seccion_ref_id: refId }
    },
  }
}

export type DionisioService = ReturnType<typeof makeDionisioService>
