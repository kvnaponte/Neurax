import { db } from '../../db/index.js'
import { iaConfig } from '../../db/schema/ia.js'
import { michelinRecetas } from '../../db/schema/contenido.js'
import { alejandriLibros } from '../../db/schema/contenido.js'
import { nemesisJuegos } from '../../db/schema/contenido.js'
import { kuberaProductos } from '../../db/schema/kubera.js'
import { prodigyCursos } from '../../db/schema/prodigy.js'
import { eq, gte, isNull, and, count } from 'drizzle-orm'
import { spawn } from 'child_process'
import { mkdir, readFile, writeFile, appendFile, access, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

const MEMORY_BASE = './ai-memory'

async function fileExists(path: string): Promise<boolean> {
  try { await access(path); return true } catch { return false }
}

async function readMemoryFile(memoryDir: string, filename: string): Promise<string> {
  const path = join(memoryDir, filename)
  if (!await fileExists(path)) return ''
  return readFile(path, 'utf-8')
}

export async function actualizarMemoriaUsuario(
  usuarioId: string,
  tipo: 'perfil' | 'habitos' | 'patrones' | 'historial_resumen',
  contenido: string,
  modo: 'append' | 'replace' = 'replace'
) {
  const memoryDir = join(MEMORY_BASE, usuarioId)
  await mkdir(memoryDir, { recursive: true })
  const filePath = join(memoryDir, `${tipo}.md`)
  if (modo === 'append') await appendFile(filePath, '\n' + contenido)
  else await writeFile(filePath, contenido, 'utf-8')
}

async function ensureMemoryDir(usuarioId: string): Promise<string> {
  const memoryDir = join(MEMORY_BASE, usuarioId)
  await mkdir(memoryDir, { recursive: true })
  if (!await fileExists(join(memoryDir, 'perfil.md')))
    await writeFile(join(memoryDir, 'perfil.md'), `# Perfil\nusuario_id: ${usuarioId}\nfecha_inicio: ${new Date().toISOString().split('T')[0]}\n`)
  if (!await fileExists(join(memoryDir, 'habitos.md')))
    await writeFile(join(memoryDir, 'habitos.md'), '# Hábitos\n')
  if (!await fileExists(join(memoryDir, 'patrones.md')))
    await writeFile(join(memoryDir, 'patrones.md'), '# Patrones\n')
  if (!await fileExists(join(memoryDir, 'historial_resumen.md')))
    await writeFile(join(memoryDir, 'historial_resumen.md'), '# Historial de Sesiones IA\n')
  return memoryDir
}

export async function invokeCLI(prompt: string, memoryDir: string): Promise<unknown> {
  const perfil = await readMemoryFile(memoryDir, 'perfil.md')
  const habitos = await readMemoryFile(memoryDir, 'habitos.md')
  const patrones = await readMemoryFile(memoryDir, 'patrones.md')
  const historial = await readMemoryFile(memoryDir, 'historial_resumen.md')

  const fullPrompt = [
    perfil && `<memoria_perfil>\n${perfil}\n</memoria_perfil>`,
    habitos && `<memoria_habitos>\n${habitos}\n</memoria_habitos>`,
    patrones && `<memoria_patrones>\n${patrones}\n</memoria_patrones>`,
    historial && `<memoria_historial>\n${historial}\n</memoria_historial>`,
    prompt,
  ].filter(Boolean).join('\n\n')

  const tmpFile = join(tmpdir(), `neurax-ia-${randomUUID()}.txt`)
  await writeFile(tmpFile, fullPrompt, 'utf-8')

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const proc = spawn('claude', ['--print', '--output-format', 'text'], { stdio: ['pipe', 'pipe', 'pipe'] })
      proc.stdin.write(fullPrompt)
      proc.stdin.end()
      let out = ''
      let err = ''
      proc.stdout.on('data', (d: Buffer) => { out += d })
      proc.stderr.on('data', (d: Buffer) => { err += d })
      proc.on('close', (code) => {
        if (code === 0) resolve(out)
        else reject(new Error(`claude CLI exited ${code}: ${err.trim()}`))
      })
    })

    const jsonMatch = stdout.match(/```json\s*([\s\S]*?)```/) ?? stdout.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
    const raw = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]).trim() : stdout.trim()
    return JSON.parse(raw)
  } finally {
    unlink(tmpFile).catch(() => {})
  }
}

async function getToggle(usuarioId: string, campo: 'sugerenciasLogros' | 'sugerenciasMisiones' | 'clasificacionDionisio'): Promise<boolean> {
  const [config] = await db.select().from(iaConfig).where(eq(iaConfig.usuarioId, usuarioId))
  return config ? config[campo] : true
}

async function compilarResumen7Dias(usuarioId: string): Promise<string> {
  const hace7dias = new Date(Date.now() - 7 * 86400000)

  const [c1, c2, c3, c4, c5] = await Promise.all([
    db.select({ total: count() }).from(michelinRecetas).where(and(eq(michelinRecetas.usuarioId, usuarioId), gte(michelinRecetas.createdAt, hace7dias), isNull(michelinRecetas.deletedAt))),
    db.select({ total: count() }).from(alejandriLibros).where(and(eq(alejandriLibros.usuarioId, usuarioId), gte(alejandriLibros.createdAt, hace7dias), isNull(alejandriLibros.deletedAt))),
    db.select({ total: count() }).from(nemesisJuegos).where(and(eq(nemesisJuegos.usuarioId, usuarioId), gte(nemesisJuegos.createdAt, hace7dias), isNull(nemesisJuegos.deletedAt))),
    db.select({ total: count() }).from(kuberaProductos).where(and(eq(kuberaProductos.usuarioId, usuarioId), gte(kuberaProductos.createdAt, hace7dias), isNull(kuberaProductos.deletedAt))),
    db.select({ total: count() }).from(prodigyCursos).where(and(eq(prodigyCursos.usuarioId, usuarioId), gte(prodigyCursos.createdAt, hace7dias), isNull(prodigyCursos.deletedAt))),
  ])

  return `Actividad últimos 7 días:
- Gastronomía (Michelin): ${c1[0]?.total ?? 0} registros
- Lectura (Alejandría): ${c2[0]?.total ?? 0} registros
- Videojuegos (Némesis): ${c3[0]?.total ?? 0} registros
- Compras (Kubera): ${c4[0]?.total ?? 0} registros
- Aprendizaje (Prodigy): ${c5[0]?.total ?? 0} registros`
}

export async function sugerirLogros(usuarioId: string) {
  if (!await getToggle(usuarioId, 'sugerenciasLogros')) return null

  const memoryDir = await ensureMemoryDir(usuarioId)
  const resumen = await compilarResumen7Dias(usuarioId)

  const prompt = `Eres el motor de logros de NEURAX, un sistema de vida gamificado.

Contexto del usuario (últimos 7 días):
${resumen}

Sugiere exactamente 3 logros desbloqueables para este usuario. Responde ÚNICAMENTE con JSON válido, sin texto adicional:
[
  { "nombre": "...", "descripcion": "...", "criterio_medible": "...", "xp_sugerido": 50 },
  { "nombre": "...", "descripcion": "...", "criterio_medible": "...", "xp_sugerido": 75 },
  { "nombre": "...", "descripcion": "...", "criterio_medible": "...", "xp_sugerido": 100 }
]`

  const sugerencias = await invokeCLI(prompt, memoryDir) as Array<Record<string, unknown>>

  const entrada = `\n## Sesión ${new Date().toISOString()}\nResumen: ${resumen.split('\n')[0]}\nLogros sugeridos: ${Array.isArray(sugerencias) ? sugerencias.map(s => s.nombre).join(', ') : 'N/A'}`
  await actualizarMemoriaUsuario(usuarioId, 'historial_resumen', entrada, 'append')

  return Array.isArray(sugerencias) ? sugerencias.slice(0, 3) : []
}

export async function sugerirMisiones(usuarioId: string) {
  if (!await getToggle(usuarioId, 'sugerenciasMisiones')) return null

  const memoryDir = await ensureMemoryDir(usuarioId)
  const resumen = await compilarResumen7Dias(usuarioId)

  const prompt = `Eres el motor de misiones de NEURAX, un sistema de vida gamificado.

Contexto del usuario:
${resumen}

Sugiere exactamente 3 misiones semanales para motivar al usuario. Responde ÚNICAMENTE con JSON válido:
[
  { "nombre": "...", "descripcion": "...", "objetivo_tipo": "conteo", "objetivo_valor": 3, "xp": 50 },
  { "nombre": "...", "descripcion": "...", "objetivo_tipo": "conteo", "objetivo_valor": 5, "xp": 75 },
  { "nombre": "...", "descripcion": "...", "objetivo_tipo": "conteo", "objetivo_valor": 1, "xp": 100 }
]`

  const sugerencias = await invokeCLI(prompt, memoryDir) as Array<Record<string, unknown>>

  const entrada = `\n## Sesión ${new Date().toISOString()}\nMisiones sugeridas: ${Array.isArray(sugerencias) ? sugerencias.map(s => s.nombre).join(', ') : 'N/A'}`
  await actualizarMemoriaUsuario(usuarioId, 'historial_resumen', entrada, 'append')

  return Array.isArray(sugerencias) ? sugerencias.slice(0, 3) : []
}

export async function clasificarVideo(usuarioId: string, transcripcion: string) {
  if (!await getToggle(usuarioId, 'clasificacionDionisio'))
    return { categoria: 'otro', subcategoria: 'ia_desactivada', destino_sugerido: 'revision_manual', confianza: 0 }

  const memoryDir = await ensureMemoryDir(usuarioId)

  const prompt = `Clasifica el siguiente video de TikTok según su transcripción.

Categorías válidas: lugares_restaurante, turismo, receta, juego, producto, musica, ejercicio, aprende, otro

Transcripción: "${transcripcion}"

Responde ÚNICAMENTE con JSON válido (sin texto adicional):
{ "categoria": "...", "subcategoria": "...", "destino_sugerido": "...", "confianza": 0.95 }

Si no estás seguro (confianza < 0.7), usa categoria="otro".`

  const result = await invokeCLI(prompt, memoryDir) as { categoria: string; subcategoria: string; destino_sugerido: string; confianza: number }

  if (typeof result?.confianza === 'number' && result.confianza < 0.7)
    return { ...result, categoria: 'otro' }

  return result
}

export async function generarResumenProgreso(usuarioId: string): Promise<string> {
  const resumen = await compilarResumen7Dias(usuarioId)
  return `# Resumen de Progreso NEURAX\n**Fecha:** ${new Date().toISOString().split('T')[0]}\n**Usuario:** ${usuarioId}\n\n## Actividad Semanal\n${resumen}\n\n---\n*Generado automáticamente por NEURAX*`
}
