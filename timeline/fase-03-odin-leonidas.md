# Fase 3 — Odin (Misiones) y Leonidas (Motor de Ejercicio)

**Prerequisito:** Fase 2 completada (actividades registrando XP correctamente).
**Resultado:** Sistema de misiones diarias/semanales/mensuales generándose automáticamente. Motor de Leonidas asignando el músculo del día y validando reglas.
**Specs de referencia:** `09-odin.md`, `10-leonidas.md`, `05-activities.md` (sección reglas Leonidas)

---

## BLOQUE A — Odin (Sistema de Misiones)

### Paso 3.1 — Algoritmo de Generación de Misiones Diarias

**Archivo:** `backend/src/modules/odin/odin-generator.service.ts`

Este servicio se ejecuta a las 00:00 cada día via BullMQ y genera las misiones del día.

- `generarMisionesDelDia(usuarioId: string, fecha: Date)`:
  1. Obtener las misiones principales usadas en los últimos 7 días (para no repetir)
     ```sql
     SELECT catalogo_id FROM odin_misiones_usuario
     WHERE usuario_id = ? AND periodo_tipo = 'diario'
     AND periodo_inicio > NOW() - INTERVAL '7 days'
     AND es_personalizada = false
     ```
  2. Seleccionar 1 misión principal del pool que no esté en la lista de excluidas (random)
  3. Seleccionar 3-4 misiones secundarias priorizando las más relevantes para el usuario:
     - Analizar historial de actividades de los últimos 7 días
     - Priorizar áreas donde el usuario es más débil (menos actividad)
     - Evitar repetir misiones usadas en los últimos 2 días
  4. Insertar todas en `odin_misiones_usuario` con:
     - `periodo_tipo = 'diario'`
     - `periodo_inicio = fecha`
     - `periodo_fin = fecha`
     - `progreso = 0`, `completada = false`

- `generarMisionSemanal(usuarioId: string, semana: number, año: number)`:
  - Ejecutar el lunes a las 00:00
  - Seleccionar 1 super misión semanal del pool
  - `periodo_inicio = lunes`, `periodo_fin = domingo`

- `generarMisionMensual(usuarioId: string, mes: number, año: number)`:
  - Ejecutar el día 1 de cada mes a las 00:00
  - Seleccionar 1 super misión mensual del pool

---

### Paso 3.2 — Job BullMQ: Generación Diaria de Misiones

**Archivo:** `backend/src/jobs/odin-daily.worker.ts`

- Cron: `'0 0 * * *'` (medianoche todos los días)
- Obtener todos los usuarios con `active = true` y al menos 1 login en los últimos 30 días
- Para cada usuario: llamar a `odin-generator.service.generarMisionesDelDia()`
- Si es lunes: también `generarMisionSemanal()`
- Si es día 1 del mes: también `generarMisionMensual()`

---

### Paso 3.3 — Verificación de Progreso de Misiones

**Archivo:** `backend/src/modules/odin/odin-progress.service.ts`

Se invoca desde `actividades.service.registrarActividad()` después de registrar:

- `verificarProgresoMisiones(usuarioId: string, actividad: Actividad)`:
  1. Obtener todas las misiones activas del día (no completadas) del usuario
  2. Para cada misión, evaluar si la actividad recién registrada cumple su criterio:
     - `actividades_count`: si `tipo` coincide con `objetivo_filtro.tipo`, `progreso += 1`
     - `minutos_tipo`: si `tipo` coincide, `progreso += actividad.duracion_minutos`
     - `areas_count`: si `area` coincide, agregar área al set de áreas cubiertas; `progreso = set.size`
     - `cronos_puntual`: si `cronos_evento completado a tiempo`, `progreso += 1`
  3. Si `progreso >= total`:
     - `completada = true`, `completada_at = NOW()`
     - Insertar en `xp_events` con el XP de la misión
     - `UPDATE usuarios SET xp_total += mision.xp_reward`
     - Emitir `mission:completed` via WebSocket
     - Verificar si **todas** las misiones del día están completas → disparar cofre épico
  4. `UPDATE odin_misiones_usuario SET progreso = nuevo_progreso WHERE id = ?`

---

### Paso 3.4 — Lógica del Cofre Épico

**Archivo:** `backend/src/modules/odin/odin-chest.service.ts`

- `verificarCofre(usuarioId: string, fecha: Date)`:
  1. Verificar que misión principal + todas secundarias estén `completada = true`
  2. Verificar que no se haya abierto cofre hoy (`SELECT 1 FROM odin_cofres WHERE usuario_id=? AND fecha=?`)
  3. Si aplica:
     - Determinar tipo de cofre según semana del mes (semana 1: Bronce 300, semana 2: Plata 300, semana 3: Dorado 350, semana 4: Épico 350)
     - Verificar si el cofre de semana 4 lleva 4 consecutivos (logro especial)
     - Insertar en `odin_cofres`
     - Otorgar XP con `xp.service.otorgarXP()`
     - Emitir evento WebSocket con animación especial
     - Enviar notificación push

---

### Paso 3.5 — Timer y Urgencia

En el endpoint de misiones del día, calcular:
- `tiempo_restante_segundos`: diferencia entre `NOW()` y `medianoche`
- El frontend usa este valor para mostrar el contador HH:MM:SS

---

### Paso 3.6 — Endpoints de Odin

**Archivo:** `backend/src/modules/odin/odin.routes.ts`

Prefijo `/api/odin`. Requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/daily` | Misiones del día (principal + secundarias + cofre + timer) |
| GET | `/weekly` | Super misión semanal con progreso |
| GET | `/monthly` | Super misión mensual con progreso |
| GET | `/calendar` | Historial mensual (días completos/parciales/sin actividad) |
| POST | `/missions` | Crear misión personalizada |
| PUT | `/missions/:id` | Editar misión personalizada |
| DELETE | `/missions/:id` | Eliminar misión personalizada |
| POST | `/missions/suggest` | Sugerir misiones con IA (implementado en Fase 5) |
| GET | `/chest/status` | Estado del cofre de hoy |

---

## BLOQUE B — Leonidas (Motor de Ejercicio)

### Paso 3.7 — Motor de Asignación Automática

**Archivo:** `backend/src/modules/leonidas/leonidas-engine.service.ts`

Este es el núcleo de Leonidas: determina qué músculo debe entrenar el usuario hoy.

- `calcularDisponibilidadMuscular(usuarioId: string, ahora: Date)`:
  1. Para cada grupo muscular del catálogo:
     - Buscar la última sesión que trabajó ese grupo:
       ```sql
       SELECT MAX(timestamp) as ultima
       FROM leonidas_sesiones s
       JOIN jsonb_array_elements_text(s.grupos_trabajados::jsonb) g ON TRUE
       WHERE s.usuario_id = ? AND g = grupo
       ```
     - `horas_transcurridas = (ahora - ultima) / 3600000`
     - `disponible = horas_transcurridas >= DESCANSO_MINIMO[grupo]`
     - `horas_restantes = max(0, DESCANSO_MINIMO[grupo] - horas_transcurridas)`
  2. Aplicar restricción de día de semana:
     - Si es sábado: solo `trote` y `barras` disponibles (no músculos de fuerza)
  3. Devolver array de `{ grupo, disponible, horas_restantes, disponible_en }` para cada grupo

- `verificarSecuenciasProhibidas(ultimoGrupo: string | null, grupoCandidat: string): boolean`:
  - Retorna `true` si la combinación está prohibida (mismo día)

- `asignarMusculoDelDia(usuarioId: string, fecha: Date)`:
  1. Obtener grupos disponibles con `calcularDisponibilidadMuscular()`
  2. Filtrar los que `disponible = true`
  3. Obtener el último grupo entrenado (para verificar secuencias)
  4. Filtrar los que no violan secuencias prohibidas con el último grupo
  5. Si es sábado: filtrar solo `trote` y `barras`
  6. De los grupos restantes (candidatos válidos), calcular **conveniencia**:
     - Un grupo es más conveniente si:
       a. Tiene el mayor tiempo transcurrido desde su última sesión (más recuperado)
       b. Respeta el balance muscular (agonista/antagonista)
       c. Corresponde al plan semanal configurado por el usuario (si existe)
     - Ordenar candidatos por puntuación de conveniencia
  7. Devolver el grupo de mayor conveniencia como "asignación del día"
  8. Persistir la asignación en `leonidas_asignacion_dia` (nueva tabla: `usuario_id, fecha, grupo_asignado, ejercicios_sugeridos[]`)

**Nueva tabla en schema:** `leonidas_asignacion_dia`:
- `id`, `usuario_id`, `fecha` (date), `grupo_asignado`, `tipo` (fuerza/cardio/barras/trote), `ejercicios_sugeridos` (jsonb array), `completada` (bool), UNIQUE(usuario_id, fecha)

---

### Paso 3.8 — Selección de Ejercicios para la Sesión Asignada

**Archivo:** `backend/src/modules/leonidas/leonidas-exercises.service.ts`

Cuando se asigna un músculo, seleccionar ejercicios del catálogo:

- `seleccionarEjerciciosDelDia(grupoMuscular: string, historialReciente: string[])`:
  1. Obtener todos los ejercicios del catálogo para ese grupo
  2. Priorizar ejercicios no realizados en las últimas 2 sesiones del mismo grupo
  3. Seleccionar 3-5 ejercicios representativos
  4. Para cada ejercicio, incluir `{ nombre, series_sugeridas: 3, repeticiones_sugeridas: 10-15 }`

---

### Paso 3.9 — Registro de Sesión de Leonidas

**Archivo:** `backend/src/modules/leonidas/leonidas.service.ts`

- `registrarSesion(usuarioId, data)`:
  1. Verificar que existe asignación del día (`leonidas_asignacion_dia`)
  2. Verificar que la sesión coincide con el grupo asignado (o permitir ajuste menor si hay razón)
  3. Insertar en `leonidas_sesiones`: tipo, grupos_trabajados[], duracion_minutos, intensidad, notas, timestamp
  4. Insertar en `leonidas_ejercicios_sesion` los ejercicios realizados con series/repeticiones/peso
  5. Marcar `leonidas_asignacion_dia.completada = true`
  6. Llamar a `actividades.service.registrarActividad()` para generar el XP
  7. Actualizar la vista materializada (o simplemente invalidar el cache de disponibilidad)

- `obtenerSesionDelDia(usuarioId, fecha)`:
  - Devolver asignación + ejercicios sugeridos + sesión completada (si existe)

- `obtenerDisponibilidadMuscular(usuarioId)`:
  - Llamar a `leonidas-engine.calcularDisponibilidadMuscular()`

- `obtenerEstadisticas(usuarioId, periodo)`:
  - Volumen semanal (series × reps × peso por grupo)
  - Frecuencia por grupo
  - Racha de Leonidas
  - Progreso por ejercicio (peso máximo a lo largo del tiempo)

---

### Paso 3.10 — Endpoints de Leonidas

**Archivo:** `backend/src/modules/leonidas/leonidas.routes.ts`

Prefijo `/api/leonidas`. Requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/today` | Asignación del día + ejercicios sugeridos + estado de completitud |
| POST | `/today/complete` | Registrar que SE REALIZÓ la sesión del día (marcar sí/no) |
| POST | `/sessions` | Registrar sesión con detalles (ejercicios, series, etc.) |
| GET | `/sessions` | Historial de sesiones |
| GET | `/availability` | Disponibilidad muscular completa (todos los grupos) |
| GET | `/stats` | Estadísticas (volumen, frecuencia, progreso) |
| GET | `/exercises` | Catálogo de ejercicios (con filtro por grupo) |
| POST | `/plan` | Configurar plan semanal (override del auto-assignment) |
| GET | `/plan` | Obtener plan semanal configurado |

**Respuesta de `GET /leonidas/today`:**
```json
{
  "fecha": "2026-06-15",
  "grupo_asignado": "pecho",
  "tipo": "fuerza",
  "ejercicios_sugeridos": [
    { "nombre": "Press banca", "series": 3, "repeticiones": 10 },
    { "nombre": "Aperturas", "series": 3, "repeticiones": 12 },
    { "nombre": "Fondos", "series": 3, "repeticiones": 15 }
  ],
  "completada": false,
  "sesion_registrada": null
}
```

---

### Paso 3.11 — Job Diario: Asignación de Músculo del Día

**Archivo:** `backend/src/jobs/leonidas-daily.worker.ts`

- Cron: `'0 0 * * *'` — medianoche (mismo job que Odin daily, o uno separado)
- Para cada usuario activo: llamar a `leonidas-engine.asignarMusculoDelDia()`
- La asignación del día queda persistida en `leonidas_asignacion_dia` desde las 00:00

---

## Checklist de Aceptación — Fase 3

- [ ] A las 00:00 se generan automáticamente misiones principales y secundarias para todos los usuarios activos
- [ ] `GET /api/odin/daily` devuelve misión principal, 3-4 secundarias, cofre y tiempo restante
- [ ] Completar actividades actualiza el progreso de misiones en tiempo real
- [ ] Al completar todas las misiones del día: se abre el cofre épico y se otorga XP adicional
- [ ] El motor de Leonidas calcula la disponibilidad correcta para cada grupo muscular
- [ ] `GET /api/leonidas/today` devuelve el grupo asignado del día con ejercicios sugeridos
- [ ] No se puede asignar `espalda_alta` el día siguiente a `triceps`
- [ ] Los sábados solo se asigna `trote` o `barras`
- [ ] `POST /api/leonidas/today/complete` marca la sesión como completada y genera XP
- [ ] Las estadísticas de Leonidas calculan volumen y frecuencia correctamente
