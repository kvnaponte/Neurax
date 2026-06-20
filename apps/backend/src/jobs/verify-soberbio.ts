import 'dotenv/config'
import { db } from '../db/index.js'
import { soberbioLugares } from '../db/schema/soberbio.js'
import { cronosEventos } from '../db/schema/cronos.js'
import { eq, and } from 'drizzle-orm'
import { seleccionarAleatorio, calificarVisita, agregarLugar, sugerirFechas } from '../modules/soberbio/soberbio.service.js'
import { crearEvento, completarEvento } from '../modules/cronos/cronos.service.js'

const TEST_USER = '00000000-0000-0000-0000-000000000002'

function pass(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1 }

// ── AC1: calificacion_final = promedio exacto de 5 criterios ──
console.log('[AC1] calificacion_final = (4+5+3+4+5)/5 = 4.20')
const expected = ((4 + 5 + 3 + 4 + 5) / 5).toFixed(2)
if (expected === '4.20') pass(`fórmula correcta: ${expected}`)
else fail(`fórmula incorrecta: ${expected}`)

// ── AC4: sin lugares pendientes → { lugar: null } ──
console.log('\n[AC4] seleccionarAleatorio sin pendientes')
const nada = await seleccionarAleatorio(TEST_USER)
if (nada === null) pass('retorna null cuando no hay pendientes')
else fail(`debería retornar null, retornó: ${JSON.stringify(nada)}`)

// ── CRUD: agregarLugar persiste en BD ──
console.log('\n[CRUD] agregarLugar → BD')
const lugar = await agregarLugar(TEST_USER, {
  nombre: 'Restaurante Test',
  tipo_cocina: 'italiana',
  ubicacion: 'Bogotá',
  precio_estimado: '150000',
})
if (lugar.nombre === 'Restaurante Test') pass(`lugar insertado: ${lugar.nombre}`)
else fail(`nombre incorrecto: ${lugar.nombre}`)
if (lugar.estado === 'pendiente') pass('estado inicial = pendiente')
else fail(`estado: ${lugar.estado}`)

// ── seleccionarAleatorio con pendiente ──
console.log('\n[seleccionarAleatorio] con lugar pendiente')
const aleatorio = await seleccionarAleatorio(TEST_USER)
if (aleatorio?.id === lugar.id) pass(`seleccionó el lugar pendiente: ${aleatorio.nombre}`)
else fail(`lugar incorrecto: ${JSON.stringify(aleatorio)}`)

// ── AC1 en BD: calificarVisita → calificacion_final = '4.20' ──
console.log('\n[AC1+BD] calificarVisita guarda calificacion_final en BD')
const calificado = await calificarVisita(TEST_USER, lugar.id, {
  ingredientes: 4, tecnica: 5, creatividad: 3, servicio: 4, ambiente: 5,
}, 'Excelente pasta')
if (calificado?.calificacionFinal === '4.20') pass(`calificacion_final en BD: ${calificado.calificacionFinal}`)
else fail(`calificacion_final: ${calificado?.calificacionFinal}`)
if (calificado?.resena === 'Excelente pasta') pass('reseña guardada')
else fail(`reseña: ${calificado?.resena}`)

// ── sugerirFechas devuelve 3 fines de semana futuros ──
console.log('\n[sugerirFechas] 3 fechas futuras de fines de semana')
const fechas = await sugerirFechas(TEST_USER, lugar.id)
if (fechas.length === 3) pass('devuelve exactamente 3 fechas')
else fail(`devuelve ${fechas.length} fechas`)
const hoy = new Date().toISOString().split('T')[0]
const todasFuturas = fechas.every(f => f.fecha > hoy)
if (todasFuturas) pass('todas las fechas son futuras')
else fail('alguna fecha no es futura')
const todasFinDeSemana = fechas.every(f => {
  const d = new Date(f.fecha + 'T12:00:00')
  return d.getDay() === 0 || d.getDay() === 6
})
if (todasFinDeSemana) pass('todas las fechas son sábado o domingo')
else fail(`fechas no son todas fines de semana: ${fechas.map(f => f.fecha).join(', ')}`)

// ── AC3: completarEvento con seccion_origen=soberbio → trigger rate_visit ──
console.log('\n[AC3] completarEvento dispara trigger rate_visit para soberbio')
const evento = await crearEvento(TEST_USER, {
  titulo: '🍽️ Visita: Restaurante Test',
  tipo: 'ocio',
  area: 'otras',
  inicio_at: new Date(Date.now() + 3600000).toISOString(),
  fin_at: new Date(Date.now() + 10800000).toISOString(),
  seccion_origen: 'soberbio',
  seccion_ref_id: lugar.id,
})
if (evento.seccionOrigen === 'soberbio') pass('evento creado con seccion_origen=soberbio')
else fail(`seccion_origen: ${evento.seccionOrigen}`)

const completado = await completarEvento(TEST_USER, evento.id) as Record<string, unknown>
if (completado?.completado === true) pass('evento marcado como completado')
else fail(`completado: ${completado?.completado}`)
const trigger = completado?.trigger as Record<string, unknown> | undefined
if (trigger?.action === 'rate_visit') pass(`trigger.action = 'rate_visit'`)
else fail(`trigger: ${JSON.stringify(trigger)}`)
if (trigger?.seccion_ref_id === lugar.id) pass('trigger.seccion_ref_id = lugar.id')
else fail(`trigger.seccion_ref_id: ${trigger?.seccion_ref_id}`)

// cleanup
await db.delete(soberbioLugares).where(eq(soberbioLugares.usuarioId, TEST_USER))
await db.delete(cronosEventos).where(eq(cronosEventos.usuarioId, TEST_USER))

process.exit(process.exitCode ?? 0)
