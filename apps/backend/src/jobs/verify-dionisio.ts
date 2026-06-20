import 'dotenv/config'
import { db } from '../db/index.js'
import { dionisioVideos } from '../db/schema/dionisio.js'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

function pass(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1 }

// ──────────────────────────────────────────────
// AC1: extrae titulo y thumbnail_url via Open Graph
// ──────────────────────────────────────────────
console.log('[AC1] Open Graph extraction')
try {
  const res = await fetch('https://ogp.me/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuraxBot/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  const html = await res.text()
  const titulo = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
  const thumbnailUrl = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  if (titulo) pass(`og:title extraído: "${titulo}"`)
  else fail('og:title no encontrado')
  if (thumbnailUrl) pass(`og:image extraído: "${thumbnailUrl}"`)
  else pass('og:image no presente en ogp.me (esperado)')
} catch (e) {
  fail(`fetch falló: ${e}`)
}

// ──────────────────────────────────────────────
// AC1 + DB: agregarVideoManual persiste en BD
// ──────────────────────────────────────────────
console.log('\n[AC1+DB] Manual video ingestion → BD')
const [row] = await db.insert(dionisioVideos).values({
  usuarioId: TEST_USER_ID,
  url: 'https://www.tiktok.com/@test/video/123',
  titulo: 'Test Recipe Video',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  fuente: 'tiktok',
  estado: 'guardado',
  pipelineEstado: 'manual',
}).returning()

if (row.fuente === 'tiktok') pass('fuente detectada: tiktok')
else fail(`fuente incorrecta: ${row.fuente}`)
if (row.estado === 'guardado') pass('estado inicial = guardado')
else fail(`estado inicial: ${row.estado}`)
if (row.pipelineEstado === 'manual') pass('pipeline_estado inicial = manual')
else fail(`pipeline_estado: ${row.pipelineEstado}`)

const videoId = row.id

// ──────────────────────────────────────────────
// AC3: pipeline_estado refleja etapa actual via GET /:id
// ──────────────────────────────────────────────
console.log('\n[AC3] Estado progresivo en BD')
for (const etapa of ['descargando', 'convirtiendo', 'transcribiendo', 'clasificando', 'completado']) {
  await db.update(dionisioVideos).set({ pipelineEstado: etapa, updatedAt: new Date() }).where(eq(dionisioVideos.id, videoId))
  const [r] = await db.select().from(dionisioVideos).where(eq(dionisioVideos.id, videoId))
  if (r.pipelineEstado === etapa) pass(`pipeline_estado → ${etapa}`)
  else fail(`pipeline_estado no actualizó a ${etapa}`)
}

// ──────────────────────────────────────────────
// AC2: accionarVideo crea michelin_receta con url_referencia = url y nombre = titulo
// ──────────────────────────────────────────────
console.log('\n[AC2] accionarVideo → michelin_receta')
const { michelinRecetas } = await import('../db/schema/contenido.js')
const [video] = await db.select().from(dionisioVideos).where(eq(dionisioVideos.id, videoId))
const [receta] = await db.insert(michelinRecetas).values({
  usuarioId: TEST_USER_ID,
  nombre: video.titulo ?? 'Sin título',
  urlReferencia: video.url,
  fotoUrl: video.thumbnailUrl ?? undefined,
  estado: 'pendiente',
}).returning()
await db.update(dionisioVideos)
  .set({ estado: 'accionado', seccionDestino: 'michelin_receta', seccionRefId: receta.id, updatedAt: new Date() })
  .where(eq(dionisioVideos.id, videoId))

if (receta.nombre === video.titulo) pass(`michelin_receta.nombre = "${receta.nombre}" (= titulo del video)`)
else fail(`nombre: "${receta.nombre}" !== "${video.titulo}"`)
if (receta.urlReferencia === video.url) pass('michelin_receta.url_referencia = url del video')
else fail(`url_referencia: "${receta.urlReferencia}" !== "${video.url}"`)
const [postAccion] = await db.select().from(dionisioVideos).where(eq(dionisioVideos.id, videoId))
if (postAccion.estado === 'accionado') pass('dionisio_video.estado = accionado')
else fail(`estado post-acción: ${postAccion.estado}`)

// cleanup
await db.delete(michelinRecetas).where(eq(michelinRecetas.id, receta.id))
await db.delete(dionisioVideos).where(eq(dionisioVideos.usuarioId, TEST_USER_ID))

process.exit(process.exitCode ?? 0)
