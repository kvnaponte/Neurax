import 'dotenv/config'
import { mkdir, readFile, access } from 'fs/promises'
import { join } from 'path'
import { invokeCLI, clasificarVideo, actualizarMemoriaUsuario, generarResumenProgreso } from '../modules/ia/ia.service.js'

const TEST_USER = '00000000-0000-0000-0000-000000000003'
const MEMORY_BASE = './ai-memory'

function pass(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1 }
async function fileExists(p: string) { try { await access(p); return true } catch { return false } }

// ── AC2: directorio y archivos base creados en primera invocación de sugerirLogros ──
console.log('[AC2] Directorio de memoria creado en primera invocación de sugerirLogros()')
const memDir = join(MEMORY_BASE, TEST_USER)
const perfilPath = join(memDir, 'perfil.md')
const habitosPath = join(memDir, 'habitos.md')
const historialPath = join(memDir, 'historial_resumen.md')

await import('fs/promises').then(fs => fs.rm(memDir, { recursive: true, force: true }))

// sugerirLogros calls ensureMemoryDir which creates all base files
const { sugerirLogros } = await import('../modules/ia/ia.service.js')
await sugerirLogros(TEST_USER).catch(() => {})  // may fail on DB/CLI but dir should be created

if (await fileExists(perfilPath)) pass('perfil.md creado automáticamente')
else fail('perfil.md no fue creado')
if (await fileExists(habitosPath)) pass('habitos.md creado automáticamente')
else fail('habitos.md no fue creado')
if (await fileExists(historialPath)) pass('historial_resumen.md creado automáticamente')
else fail('historial_resumen.md no fue creado')

// ── AC1: invokeCLI parsea JSON correctamente ──
console.log('\n[AC1] invokeCLI parsea JSON correctamente')
const jsonResult = await invokeCLI('Responde ÚNICAMENTE con JSON válido, sin markdown: {"ok": true, "valor": 42}', memDir)
if (typeof jsonResult === 'object' && jsonResult !== null && (jsonResult as Record<string, unknown>)['ok'] === true) pass(`JSON parseado correctamente: ${JSON.stringify(jsonResult)}`)
else fail(`JSON no parseado: ${JSON.stringify(jsonResult)}`)

// ── AC3: historial_resumen se acumula entre sesiones ──
console.log('\n[AC3] historial_resumen.md se acumula entre sesiones')
await actualizarMemoriaUsuario(TEST_USER, 'historial_resumen', '\n## Sesión 1\nTest entry 1', 'append')
await actualizarMemoriaUsuario(TEST_USER, 'historial_resumen', '\n## Sesión 2\nTest entry 2', 'append')
const historial = await readFile(historialPath, 'utf-8')
const sesion1 = historial.includes('Sesión 1')
const sesion2 = historial.includes('Sesión 2')
if (sesion1 && sesion2) pass('historial tiene ambas sesiones (se acumula)')
else fail(`historial no acumula: sesion1=${sesion1}, sesion2=${sesion2}`)

// ── AC4: clasificarVideo devuelve categoria='receta' para carbonara ──
console.log('\n[AC4] clasificarVideo: "pasta carbonara" → categoria=receta')
const clasificacion = await clasificarVideo(TEST_USER, 'Voy a hacer pasta carbonara con huevos y panceta')
if (clasificacion?.categoria === 'receta') pass(`categoria='receta' ✓ (confianza: ${clasificacion.confianza})`)
else fail(`categoria='${clasificacion?.categoria}' (esperado: receta)`)
if (clasificacion?.confianza !== undefined) pass(`JSON válido con campo confianza: ${clasificacion.confianza}`)
else fail('falta campo confianza')

// ── generarResumenProgreso sin CLI ──
console.log('\n[generarResumenProgreso] sin invocar CLI')
const resumen = await generarResumenProgreso(TEST_USER)
if (resumen.includes('# Resumen de Progreso NEURAX')) pass('resumen markdown generado sin CLI')
else fail('resumen no tiene formato esperado')
if (resumen.includes('Actividad')) pass('resumen contiene sección de actividad')
else fail('resumen no tiene sección de actividad')

// cleanup
await import('fs/promises').then(fs => fs.rm(memDir, { recursive: true, force: true }))

process.exit(process.exitCode ?? 0)
