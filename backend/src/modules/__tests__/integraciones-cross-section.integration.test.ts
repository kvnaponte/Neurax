import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { buildApp } from '../../test-utils/build-app'
import { db } from '../../db/index'
import {
  usuarios,
  cronos_eventos,
  michelin_recetas,
  dionisio_videos,
  kubera_productos,
  leonidas_referencias,
} from '../../db/schema'

const EMAIL = `integraciones-${Date.now()}@neurax-test.com`
const PASSWORD = 'Test1234'

let app: FastifyInstance
let accessToken: string
let userId: string

function diasDesdeHoy(n: number): { fecha: Date; str: string } {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + n)
  return { fecha: d, str: d.toISOString().slice(0, 10) }
}

async function post(url: string, body: object, token = accessToken) {
  return app.inject({
    method: 'POST', url,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

async function put(url: string, body: object, token = accessToken) {
  return app.inject({
    method: 'PUT', url,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

async function patch(url: string, body: object, token = accessToken) {
  return app.inject({
    method: 'PATCH', url,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

async function get(url: string, token = accessToken) {
  return app.inject({ method: 'GET', url, headers: { Authorization: `Bearer ${token}` } })
}

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  const res = await post('/api/auth/register', {
    nombre: 'Integraciones User', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD,
  }, '')
  const body = res.json()
  accessToken = body.access_token
  userId = body.user.id
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await app.close()
})

// ─── Integración 1: Prodigy → Cronos ──────────────────────────────────────────
describe('Integración 1 — Prodigy → Cronos', () => {
  it('curso con deadline en 15 días → bloques de estudio no exceden el día 12 (margen 3 días)', async () => {
    const fechaFin = diasDesdeHoy(15)
    const cursoRes = await post('/api/prodigy/cursos', {
      titulo: 'Curso de Prueba', fecha_fin: fechaFin.str, total_horas: 2,
    })
    expect(cursoRes.statusCode).toBe(201)
    const curso = cursoRes.json()

    const horarioRes = await post(`/api/prodigy/cursos/${curso.id}/generar-horario`, {})
    expect(horarioRes.statusCode).toBe(200)
    expect(horarioRes.json().bloques_creados).toBeGreaterThan(0)

    const bloques = await db.select().from(cronos_eventos).where(and(
      eq(cronos_eventos.usuario_id, userId),
      eq(cronos_eventos.seccion_origen, 'prodigy'),
      eq(cronos_eventos.seccion_ref_id, curso.id),
    ))
    expect(bloques.length).toBeGreaterThan(0)

    const limite = diasDesdeHoy(12).fecha // fecha_fin - 3 días de margen
    for (const b of bloques) {
      expect(b.tipo).toBe('estudio')
      expect(new Date(b.inicio_at as Date).getTime()).toBeLessThan(limite.getTime())
    }
  })
})

// ─── Integración 2: Proeza → Cronos ───────────────────────────────────────────
describe('Integración 2 — Proeza → Cronos', () => {
  it('canción con fecha_objetivo en 10 días → GET /cronos/events muestra 4 recordatorios', async () => {
    const cancionRes = await post('/api/proeza/canciones', { titulo: 'Canción de Prueba' })
    expect(cancionRes.statusCode).toBe(201)
    const cancion = cancionRes.json()

    const lanzamiento = diasDesdeHoy(10)
    const fechaRes = await put(`/api/proeza/canciones/${cancion.id}/fecha-objetivo`, {
      fecha_objetivo_lanzamiento: lanzamiento.str,
    })
    expect(fechaRes.statusCode).toBe(200)
    expect(fechaRes.json().eventos_creados).toBe(4)

    const inicio = diasDesdeHoy(0).str
    const fin = diasDesdeHoy(11).str
    const eventsRes = await get(`/api/cronos/events?inicio=${inicio}&fin=${fin}`)
    expect(eventsRes.statusCode).toBe(200)
    const recordatorios = (eventsRes.json() as any[]).filter(
      (e) => e.seccion_origen === 'proeza' && e.tipo === 'recordatorio' && e.seccion_ref_id === cancion.id,
    )
    expect(recordatorios.length).toBe(4)
  })
})

// ─── Integración 4: Dionisio → Secciones ──────────────────────────────────────
describe('Integración 4 — Dionisio → Secciones', () => {
  it("video categoría 'receta' accionado a Michelin → url_referencia = url y nombre = titulo", async () => {
    const url = 'https://youtube.com/watch?v=receta123'
    const titulo = 'Pasta Carbonara Auténtica'
    const videoRes = await post('/api/dionisio/videos', { url, titulo, categoria: 'receta' })
    expect(videoRes.statusCode).toBe(201)
    const video = videoRes.json()

    const accionarRes = await post(`/api/dionisio/videos/${video.id}/accionar`, { seccion: 'michelin' })
    expect(accionarRes.statusCode).toBe(200)
    const { seccion_ref_id } = accionarRes.json()

    const [receta] = await db.select().from(michelin_recetas)
      .where(eq(michelin_recetas.id, seccion_ref_id))
    expect(receta.url_referencia).toBe(url)
    expect(receta.nombre).toBe(titulo)
  })

  it('pre-llenado crea un registro para los 8 destinos', async () => {
    const destinos = ['soberbio', 'michelin', 'odysseia', 'kubera', 'nemesis', 'prodigy', 'proeza', 'leonidas'] as const
    for (const seccion of destinos) {
      const videoRes = await post('/api/dionisio/videos', {
        url: `https://youtube.com/watch?v=${seccion}`, titulo: `Video ${seccion}`,
      })
      const video = videoRes.json()
      const res = await post(`/api/dionisio/videos/${video.id}/accionar`, { seccion })
      expect(res.statusCode).toBe(200)

      const [actualizado] = await db.select().from(dionisio_videos).where(eq(dionisio_videos.id, video.id))
      expect(actualizado.seccion_destino).toBe(seccion)
      expect(actualizado.estado).toBe('accionado')
      expect(actualizado.seccion_ref_id).not.toBeNull() // se creó un registro destino
    }
  })

  it("destino leonidas → crea leonidas_referencia con url y nombre del video", async () => {
    const url = 'https://youtube.com/watch?v=press-banca'
    const titulo = 'Press de banca técnica'
    const videoRes = await post('/api/dionisio/videos', { url, titulo })
    const video = videoRes.json()

    const accionarRes = await post(`/api/dionisio/videos/${video.id}/accionar`, { seccion: 'leonidas' })
    expect(accionarRes.statusCode).toBe(200)
    const { seccion_ref_id } = accionarRes.json()

    const [referencia] = await db.select().from(leonidas_referencias)
      .where(eq(leonidas_referencias.id, seccion_ref_id))
    expect(referencia.nombre).toBe(titulo)
    expect(referencia.url_referencia).toBe(url)
    expect(referencia.fuente).toBe('dionisio')
  })
})

// ─── Integración 5: Kubera → Demeter ──────────────────────────────────────────
describe('Integración 5 — Kubera → Demeter', () => {
  it('fondo Kubera alcanza el objetivo → producto pasa a listo_para_adquirir', async () => {
    const productoRes = await post('/api/kubera/productos', {
      nombre: 'Teclado Mecánico', precio_estimado: 100_000,
    })
    expect(productoRes.statusCode).toBe(201)
    const producto = productoRes.json()

    const fondoRes = await patch(`/api/kubera/productos/${producto.id}/fondo-demeter`, { activo: true })
    expect(fondoRes.statusCode).toBe(200)

    // POST /presupuesto usa el mes actual (igual que verificarFondosKubera)
    await post('/api/demeter/presupuesto', {
      ingreso_esperado: 2_000_000, gastos_fijos: 800_000,
      fondos_especiales: [{ nombre: 'Kubera', objetivo: 400_000, porcentaje_asignacion: 10 }],
    })

    // Movimiento en categoría Kubera acumula el fondo hasta el precio del producto
    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 100_000, categoria: 'Kubera' })

    const [actualizado] = await db.select().from(kubera_productos).where(eq(kubera_productos.id, producto.id))
    expect(actualizado.estado).toBe('listo_para_adquirir')
  })
})
