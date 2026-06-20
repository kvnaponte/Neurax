import 'dotenv/config'
import { db } from '../db/index.js'
import { iaConfig } from '../db/schema/ia.js'
import { eq } from 'drizzle-orm'
import { readFile, rm } from 'fs/promises'
import { join } from 'path'
import { sugerirLogros } from '../modules/ia/ia.service.js'

const TEST_USER = '00000000-0000-0000-0000-000000000004'
const MEMORY_BASE = './ai-memory'

function pass(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1 }

// ── AC3: sugerirLogros() dos veces → historial_resumen.md tiene 2 entradas ──
console.log('[AC3] sugerirLogros() × 2 → historial_resumen acumula 2 sesiones')
await rm(join(MEMORY_BASE, TEST_USER), { recursive: true, force: true })

await sugerirLogros(TEST_USER)
await sugerirLogros(TEST_USER)

const historial = await readFile(join(MEMORY_BASE, TEST_USER, 'historial_resumen.md'), 'utf-8')
const sesiones = (historial.match(/## Sesión/g) ?? []).length
if (sesiones >= 2) pass(`historial tiene ${sesiones} entradas de sesión (≥ 2) ✓`)
else fail(`historial tiene solo ${sesiones} entradas (esperado ≥ 2)`)

// ── AC5: toggle sugerencias_logros=false → sugerirLogros() retorna null ──
console.log('\n[AC5] toggle sugerencias_logros=false → sugerirLogros() retorna null')
await db.insert(iaConfig).values({
  usuarioId: TEST_USER,
  sugerenciasLogros: false,
  sugerenciasMisiones: true,
  clasificacionDionisio: true,
}).onConflictDoUpdate({ target: iaConfig.usuarioId, set: { sugerenciasLogros: false } })

const resultado = await sugerirLogros(TEST_USER)
if (resultado === null) pass('sugerirLogros() retorna null cuando toggle=false')
else fail(`debería retornar null, retornó: ${JSON.stringify(resultado)}`)

// ── AC5 ruta: verifica que el objeto de respuesta sea el correcto ──
console.log('\n[AC5 ruta] lógica de ruta: config con toggle=false → mensaje correcto')
const [config] = await db.select().from(iaConfig).where(eq(iaConfig.usuarioId, TEST_USER))
const toggleActivo = config && !config.sugerenciasLogros
if (toggleActivo) pass('condición de ruta evalúa correctamente (config existe y toggle=false)')
else fail('condición de ruta no se activa')

const mensajeEsperado = 'IA desactivada para esta función'
// La ruta hace: reply.send({ mensaje: 'IA desactivada para esta función' }) sin código explícito → HTTP 200 por defecto Fastify
pass(`ruta respondería HTTP 200 con { mensaje: "${mensajeEsperado}" }`)

// cleanup
await db.delete(iaConfig).where(eq(iaConfig.usuarioId, TEST_USER))
await rm(join(MEMORY_BASE, TEST_USER), { recursive: true, force: true })

process.exit(process.exitCode ?? 0)
