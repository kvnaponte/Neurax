# Fase 5 — Dionisio (Pipeline TikTok) y Módulo de IA CLI

**Prerequisito:** Fase 4 completada (todas las secciones de contenido con CRUD).
**Resultado:** Pipeline automatizado de TikTok funcionando (descarga → transcripción → clasificación → guardado). Módulo de IA vía CLI de Claude Code con memoria por usuario. Los 4 features de IA del spec 14 están operativos.
**Specs de referencia:** `13-soberbio-dionisio.md` (Dionisio), `14-notifications-ai.md` (IA), `02-tech-stack.md` (estrategia IA CLI)

---

## BLOQUE A — Módulo de IA CLI

Este módulo es la base de todo el sistema de IA. Se implementa primero porque Dionisio depende de él.

### Paso 5.1 — Módulo CLI de IA

**Archivo:** `backend/src/modules/ia/ia-cli.service.ts`

La estrategia: el backend genera un archivo de prompt, invoca `claude` (Claude Code CLI) como subprocess, lee la respuesta JSON del stdout.

```typescript
import { spawn } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'

const AI_MEMORY_DIR = process.env.AI_MEMORY_DIR ?? './ai-memory'
const CLAUDE_CLI = process.env.CLAUDE_CLI_PATH ?? 'claude'

export async function invocarIA(params: {
  usuarioId: string
  tarea: string
  prompt: string
  contextExtra?: Record<string, unknown>
}): Promise<{ success: boolean; resultado?: unknown; error?: string }> {
  const memoriaPath = path.join(AI_MEMORY_DIR, params.usuarioId, 'memoria.md')
  const promptPath  = path.join(AI_MEMORY_DIR, params.usuarioId, `${params.tarea}-${Date.now()}.txt`)

  // Leer memoria del usuario si existe
  let memoriaActual = ''
  try { memoriaActual = await fs.readFile(memoriaPath, 'utf8') } catch {}

  // Construir prompt completo
  const promptCompleto = `
=== MEMORIA DEL USUARIO ===
${memoriaActual || '(sin memoria previa)'}

=== TAREA: ${params.tarea} ===
${params.prompt}

=== INSTRUCCIÓN ===
Responde ÚNICAMENTE con un JSON válido, sin markdown, sin explicaciones.
Formato: { "resultado": <datos>, "actualizacion_memoria": "<texto a agregar a la memoria del usuario, o null>" }
`.trim()

  await fs.mkdir(path.dirname(promptPath), { recursive: true })
  await fs.writeFile(promptPath, promptCompleto, 'utf8')

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    const proc = spawn(CLAUDE_CLI, ['--print', '--output-format', 'text', promptPath], {
      timeout: 60_000,
      env: { ...process.env }
    })

    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('close', async (code) => {
      await fs.unlink(promptPath).catch(() => {})

      if (code !== 0) {
        resolve({ success: false, error: `CLI exit ${code}: ${stderr.slice(0, 500)}` })
        return
      }

      try {
        const parsed = JSON.parse(stdout.trim())
        // Actualizar memoria si el modelo lo indica
        if (parsed.actualizacion_memoria) {
          const nuevaMemoria = memoriaActual + '\n' + parsed.actualizacion_memoria
          await fs.writeFile(memoriaPath, nuevaMemoria.trim(), 'utf8')
        }
        resolve({ success: true, resultado: parsed.resultado })
      } catch {
        resolve({ success: false, error: `JSON parse failed: ${stdout.slice(0, 300)}` })
      }
    })

    proc.on('error', (err) => resolve({ success: false, error: err.message }))
  })
}
```

**Nota de seguridad:** El directorio `./ai-memory/` debe estar fuera del VCS (`.gitignore`) y nunca debe ser accesible vía HTTP. Las memorias contienen datos personales.

---

### Paso 5.2 — Inicialización de Memoria de Usuario

**Archivo:** `backend/src/modules/ia/ia-memory.service.ts`

- `inicializarMemoriaUsuario(usuarioId, nombreUsuario)`:
  - Crear directorio `./ai-memory/${usuarioId}/`
  - Crear `memoria.md` con plantilla inicial:
    ```markdown
    # Memoria de Usuario: ${nombreUsuario}
    Creada: ${fecha}
    
    ## Perfil
    - Nombre: ${nombreUsuario}
    - Usuario activo desde: ${fecha}
    
    ## Preferencias conocidas
    (vacío — se irá llenando)
    
    ## Historial de interacciones
    (vacío)
    ```
  - Invocar al registrarse el usuario (desde `auth.service.register()`)

- `leerMemoria(usuarioId)`: devolver contenido de `memoria.md`
- `borrarMemoria(usuarioId)`: eliminar directorio (para GDPR/eliminación de cuenta)

---

### Paso 5.3 — Feature IA 1: Sugerencias de Misiones Odin

**Archivo:** `backend/src/modules/ia/ia-odin.service.ts`

Invocado desde `POST /api/odin/missions/suggest`:

- `sugerirMisionesPersonalizadas(usuarioId)`:
  1. Recopilar contexto:
     - Últimas 14 actividades del usuario
     - Misiones completadas vs abandonadas en las últimas 2 semanas
     - Área más débil (menos XP generado)
  2. Construir prompt:
     ```
     El usuario tiene el siguiente historial de los últimos 14 días:
     [historial JSON]
     
     El área más descuidada es: [área]
     
     Sugiere 3 misiones personalizadas específicas para este usuario.
     Formato resultado: [{ "nombre": "...", "descripcion": "...", "objetivo_tipo": "actividades_count", "objetivo_valor": 3, "xp_reward": 50, "razon": "..." }]
     ```
  3. Llamar a `invocarIA({ tarea: 'sugerir-misiones', prompt })`
  4. Validar que el resultado es un array de 3 misiones con los campos esperados
  5. Devolver las misiones sugeridas (el usuario puede aceptarlas → `POST /api/odin/missions`)

---

### Paso 5.4 — Feature IA 2: Análisis Financiero Demeter

**Archivo:** `backend/src/modules/ia/ia-demeter.service.ts`

Invocado desde `GET /api/demeter/ai-analysis`:

- `analizarFinanzas(usuarioId)`:
  1. Recopilar últimos 3 meses de movimientos y presupuestos
  2. Construir prompt con el resumen financiero
  3. Llamar a `invocarIA({ tarea: 'analisis-financiero', prompt })`
  4. Resultado esperado:
     ```json
     {
       "alerta": "Gastos de entretenimiento 23% sobre presupuesto",
       "tendencia": "Tus ingresos crecieron 12% respecto al mes anterior",
       "sugerencia": "Considera reducir suscripciones — representan 18% de tus gastos fijos",
       "meta_ahorro": 150000
     }
     ```

---

### Paso 5.5 — Feature IA 3: Clasificación de Contenido Dionisio

**Archivo:** `backend/src/modules/ia/ia-dionisio.service.ts`

Invocado desde el pipeline de Dionisio (paso 5.8):

- `clasificarVideo(transcripcion: string, usuarioId: string)`:
  1. Construir prompt:
     ```
     Analiza la siguiente transcripción de un video corto y determina a qué sección del sistema NEURAX pertenece su contenido.
     
     SECCIONES DISPONIBLES:
     - soberbio: restaurantes, gastronomía, experiencias culinarias
     - alejandria: libros, lectura
     - apolo: películas, cine, series
     - michelin: recetas, cocina para preparar en casa
     - odysseia: viajes, destinos, turismo
     - nemesis: videojuegos, gaming
     - proeza: música, producción musical, artistas
     - kubera: productos tecnológicos, deseos de compra
     - prodigy: cursos, educación, aprendizaje
     - cronos: agendas, eventos, planificación de tiempo
     - no_clasificable: no pertenece a ninguna sección
     
     TRANSCRIPCIÓN:
     ${transcripcion}
     
     Formato resultado: { "seccion": "<nombre_seccion>", "confianza": 0.95, "datos_extraidos": { <campos relevantes para la sección> }, "razon": "..." }
     ```
  2. Llamar a `invocarIA({ usuarioId, tarea: 'clasificar-video', prompt })`
  3. Validar que `seccion` es una de las opciones válidas y `confianza >= 0.7`
  4. Si `confianza < 0.7`: devolver `{ seccion: 'no_clasificable' }`

---

### Paso 5.6 — Feature IA 4: Notificaciones Inteligentes

**Archivo:** `backend/src/modules/ia/ia-notifications.service.ts`

Job BullMQ semanal (`cron: '0 8 * * 1'` — lunes a las 8am):

- `generarInsightSemanal(usuarioId)`:
  1. Recopilar resumen de la semana: XP ganado, racha, actividades por área, misiones completadas
  2. Construir prompt con el resumen
  3. Llamar a `invocarIA({ usuarioId, tarea: 'insight-semanal', prompt })`
  4. Resultado: `{ "titulo": "...", "mensaje": "..." }`
  5. Enviar como notificación push (via `notificaciones.service`)

---

## BLOQUE B — Pipeline Dionisio

### Paso 5.7 — Dependencias del Pipeline

Instalar herramientas externas en el entorno de backend:
- **yt-dlp**: `pip install yt-dlp` (o instalar binario)
- **ffmpeg**: `apt install ffmpeg` (o imagen Docker con ffmpeg)
- **openai-whisper**: `pip install openai-whisper` (o usar API de Whisper si hay presupuesto)

Documentar en `backend/README.md` — prerrequisitos del sistema para el pipeline Dionisio.

Variables de entorno adicionales:
```env
YTDLP_BIN=yt-dlp
FFMPEG_BIN=ffmpeg
WHISPER_BIN=whisper
WHISPER_MODEL=base          # o small/medium según recursos
DIONISIO_TEMP_DIR=./tmp/dionisio
TIKTOK_COOKIES_FILE=./tiktok-cookies.txt   # para autenticación de TikTok
```

---

### Paso 5.8 — Pipeline Principal de Dionisio

**Archivo:** `backend/src/modules/dionisio/dionisio-pipeline.service.ts`

El pipeline completo de 7 pasos ejecutado como Job BullMQ:

```typescript
export async function procesarVideoDionisio(job: Job): Promise<void> {
  const { videoId, videoUrl, usuarioId } = job.data

  // Paso 1: Actualizar estado → 'descargando'
  await db.update(dionisioVideos).set({ pipeline_estado: 'descargando' }).where(eq(id, videoId))

  // Paso 2: Descargar video con yt-dlp
  const tmpDir   = path.join(process.env.DIONISIO_TEMP_DIR!, videoId)
  const videoPath = path.join(tmpDir, 'video.mp4')
  const audioPath = path.join(tmpDir, 'audio.wav')
  await fs.mkdir(tmpDir, { recursive: true })

  await execCommand(`${process.env.YTDLP_BIN} --cookies ${TIKTOK_COOKIES} -o "${videoPath}" "${videoUrl}"`)
  await db.update(dionisioVideos).set({ pipeline_estado: 'convirtiendo' }).where(eq(id, videoId))

  // Paso 3: Extraer audio con ffmpeg
  await execCommand(`${process.env.FFMPEG_BIN} -i "${videoPath}" -ac 1 -ar 16000 "${audioPath}"`)
  await db.update(dionisioVideos).set({ pipeline_estado: 'transcribiendo' }).where(eq(id, videoId))

  // Paso 4: Transcribir con Whisper
  const transcripcionPath = path.join(tmpDir, 'transcripcion.txt')
  await execCommand(`${process.env.WHISPER_BIN} "${audioPath}" --model ${WHISPER_MODEL} --output_format txt --output_dir "${tmpDir}"`)
  const transcripcion = (await fs.readFile(transcripcionPath, 'utf8')).trim()

  // Paso 5: Si transcripción vacía → descartar
  if (transcripcion.length < 20) {
    await db.update(dionisioVideos).set({
      pipeline_estado: 'descartado',
      pipeline_error: 'Transcripción vacía o muy corta',
      transcripcion: transcripcion || null
    }).where(eq(id, videoId))
    await limpiarTmp(tmpDir)
    return
  }

  await db.update(dionisioVideos).set({ transcripcion, pipeline_estado: 'clasificando' }).where(eq(id, videoId))

  // Paso 6: Clasificar con IA CLI
  const clasificacion = await ia_dionisio.clasificarVideo(transcripcion, usuarioId)

  if (clasificacion.seccion === 'no_clasificable') {
    await db.update(dionisioVideos).set({
      pipeline_estado: 'no_clasificable',
      pipeline_error: `Confianza baja: ${clasificacion.confianza}`
    }).where(eq(id, videoId))
    await limpiarTmp(tmpDir)
    return
  }

  // Paso 7: Guardar en la sección correspondiente y marcar como clasificado
  await guardarEnSeccion(usuarioId, clasificacion)
  await db.update(dionisioVideos).set({
    seccion_destino: clasificacion.seccion,
    clasificado_automatico: true,
    pipeline_estado: 'completado',
    datos_extraidos: clasificacion.datos_extraidos
  }).where(eq(id, videoId))

  await limpiarTmp(tmpDir)
}
```

**Función auxiliar `guardarEnSeccion(usuarioId, clasificacion)`:**
- Según `clasificacion.seccion`, llamar al servicio correspondiente con `datos_extraidos`
- Ejemplo: si `seccion = 'apolo'`, llamar `apolo.service.crear(usuarioId, { movie: datos.titulo, director: datos.director, ... })`

---

### Paso 5.9 — Trigger del Pipeline (Fuente: Guardados de TikTok)

**Archivo:** `backend/src/modules/dionisio/dionisio.service.ts`

- `enviarADionisio(usuarioId, videoUrl, fuente: 'tiktok' | 'manual')`:
  1. Validar que `videoUrl` es una URL de TikTok válida (regex: `https://www.tiktok.com/@.*/video/\d+` o `https://vm.tiktok.com/\w+`)
  2. Verificar que el video no ha sido procesado antes (por URL)
  3. Insertar en `dionisio_videos` con `pipeline_estado = 'pendiente'`
  4. Encolar job en `queue:dionisio-pipeline` con `{ videoId, videoUrl, usuarioId }`
  5. Devolver `{ id: videoId, estado: 'pendiente', mensaje: 'En cola de procesamiento' }`

- `reClasificar(usuarioId, videoId, seccionDestino)`:
  - Reclasificación manual: permite al usuario corregir la clasificación automática
  - Llamar a `guardarEnSeccion()` con la sección correcta

- `obtenerVideos(usuarioId, filtros)`:
  - Listar por `pipeline_estado` (para monitorear el pipeline)

---

### Paso 5.10 — Endpoints de Dionisio

**Archivo:** `backend/src/modules/dionisio/dionisio.routes.ts`

Prefijo `/api/dionisio`. Requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/process` | Enviar URL de TikTok para procesar |
| GET | `/videos` | Listar videos procesados (con filtros) |
| GET | `/videos/:id` | Detalle de un video + transcripción |
| POST | `/videos/:id/reclassify` | Reclasificar manualmente |
| DELETE | `/videos/:id` | Eliminar registro |

**Endpoints de IA general** (prefijo `/api/ia`):
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/memory` | Ver memoria del usuario |
| DELETE | `/memory` | Borrar memoria |
| POST | `/demeter/analyze` | Análisis financiero |
| POST | `/odin/suggest` | Sugerir misiones personalizadas |
| GET | `/notification/weekly` | Generar insight semanal manualmente |

---

## Checklist de Aceptación — Fase 5

- [ ] `invocarIA()` genera un archivo de prompt, llama al CLI y parsea la respuesta JSON
- [ ] Al registrar un nuevo usuario, se crea `ai-memory/{usuarioId}/memoria.md`
- [ ] `POST /api/dionisio/process` con URL de TikTok válida encola el job y devuelve ID
- [ ] El worker del pipeline actualiza `pipeline_estado` en cada paso
- [ ] Videos sin transcripción útil quedan en `pipeline_estado = 'descartado'`
- [ ] Video de TikTok sobre un restaurante → clasificado como `soberbio` con datos extraídos
- [ ] `POST /api/dionisio/videos/:id/reclassify` permite corregir la sección
- [ ] `POST /api/ia/odin/suggest` devuelve 3 misiones personalizadas válidas
- [ ] `GET /api/ia/demeter/analyze` devuelve insight financiero basado en los últimos 3 meses
- [ ] Memoria del usuario se actualiza en `memoria.md` después de cada invocación IA
