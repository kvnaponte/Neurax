# Fase 2 — Sistema de Actividades y Cronos

**Prerequisito:** Fase 1 completada (auth + motor de gamificación funcionando).
**Resultado:** El usuario puede registrar actividades y ganar XP. Cronos gestiona eventos con energía y drag & drop.
**Specs de referencia:** `05-activities.md`, `08-cronos.md`

---

## BLOQUE A — Sistema de Actividades

### Paso 2.1 — Definición de Tipos de Actividad

**Archivo:** `backend/src/modules/actividades/actividades.catalog.ts`

Objeto constante con todos los tipos de actividad del spec 05:

```typescript
export const TIPOS_ACTIVIDAD = {
  // Rutinarias
  sueno:           { area: 'rutinarias', xp_base: [10, 20], horario: [21, 7],  max_dia: 1 },
  meditacion:      { area: 'rutinarias', xp_base: [10, 20], horario: [0, 9],   max_dia: 1 },
  sol_matutino:    { area: 'rutinarias', xp_base: 15,        horario: [0, 9],   max_dia: 1 },
  transporte:      { area: 'rutinarias', xp_base: 5,         max_dia: null },
  musica_escucha:  { area: 'rutinarias', xp_base: 5,         max_dia: 2 },

  // Físicas
  ejercicio_fuerza: { area: 'fisicas', xp_base: [5, 15], horario: [6, 10] },
  ejercicio_cardio: { area: 'fisicas', xp_base: [5, 15], horario: [6, 10] },
  barras:           { area: 'fisicas', xp_base: [10, 20], horario: [6, 10] },
  trote:            { area: 'fisicas', xp_base: [10, 20], horario: [6, 10] },

  // Mentales
  estudio:          { area: 'mentales', xp_base: [10, 25], horario: [8, 14] },
  trabajo:          { area: 'mentales', xp_base: 10 },
  musica_produccion: { area: 'mentales', xp_base: 20 },

  // Económica
  ingreso:          { area: 'economica', xp_base: 10 },
  egreso:           { area: 'economica', xp_base: 5 },
  planificacion_financiera: { area: 'economica', xp_base: 15 }
} as const

export const LIMITES_DIARIOS: Record<string, number> = {
  rutinarias: 150,
  fisicas: 200,
  economicas: 100
}
```

Función `calcularXPBase(tipo: string, duracionMin: number): number`:
- Si `xp_base` es array `[min, max]`: usa umbral de duración para decidir (ej: `sueno >= 345 min → 20, sino → 10`)
- Si es número fijo: devuelve el número

---

### Paso 2.2 — Validaciones de Leonidas en Actividades

**Archivo:** `backend/src/modules/actividades/leonidas-validation.service.ts`

Extraer la lógica de validación muscular para usarla desde el módulo de actividades:

- `validarSecuenciaMuscular(usuarioId, grupoMuscular, timestamp)`:
  1. Obtener última sesión del `grupoMuscular` en `leonidas_sesiones`
  2. Calcular horas transcurridas
  3. Comparar con `DESCANSO_MINIMO[grupo]`
  4. Si insuficiente: lanzar `ValidationError` con tiempo restante
  5. Obtener último grupo trabajado (cualquier sesión física reciente)
  6. Si `(ultimoGrupo, grupoMuscular)` está en `SECUENCIAS_PROHIBIDAS` y mismo día: lanzar error
- `validarDiaSemana(tipo, timestamp)`:
  - Si es sábado y el tipo no es `barras` ni `trote`: lanzar error
- `obtenerGrupoSugerido(usuarioId, timestamp)`:
  - Obtener todos los grupos con descanso suficiente
  - Devolver el más conveniente (implementado en Fase 3 con el motor de Leonidas)

Tablas de reglas (constantes):
```typescript
export const DESCANSO_MINIMO: Record<string, number> = {
  pecho: 48, espalda_alta: 48, espalda_baja: 72,
  hombros: 48, biceps: 48, triceps: 48,
  abdomen: 24, gluteos: 48, cuadriceps: 48,
  femorales: 48, pantorrillas: 24, cuerpo_completo: 72
}

export const SECUENCIAS_PROHIBIDAS: [string, string][] = [
  ['triceps', 'espalda_alta'], ['espalda_alta', 'triceps'],
  ['pecho', 'hombros'], ['hombros', 'pecho'],
  ['biceps', 'espalda_alta'],
  ['cuadriceps', 'femorales'], ['femorales', 'cuadriceps']
]
```

---

### Paso 2.3 — Servicio de Actividades

**Archivo:** `backend/src/modules/actividades/actividades.service.ts`

- `registrarActividad(usuarioId, data)`:
  1. Validar campos requeridos según tipo (schema Zod)
  2. Validar duración `1 ≤ duración ≤ 1440`
  3. Validar fecha dentro del rango permitido (ahora ±24h)
  4. Si área = físicas: ejecutar `leonidas-validation.service` (pasos 1-3 del spec 05)
  5. Calcular `xp_base` con `calcularXPBase(tipo, duracion)`
  6. Verificar `bonus_horario` = 1.2 si `esHorarioOptimo(tipo, timestamp)`, sino 1.0
  7. Obtener `diasRacha` y calcular `bonus_racha`
  8. Calcular `xp_final = floor(xp_base × bonus_racha × bonus_horario)`
  9. Verificar límite diario del área:
     - `SELECT SUM(xp_generado) FROM actividades WHERE usuario_id=? AND area=? AND date(timestamp)=today`
     - Si suma + xp_final > límite: `xp_final = 0`, `limite_excedido = true`
  10. Insertar en `actividades`
  11. Llamar a `xp.service.otorgarXP()` si `xp_final > 0`
  12. Llamar a `racha.service.marcarActividadDelDia()`
  13. Si área = físicas: insertar en `leonidas_sesiones` (ver Fase 3)
  14. Llamar a `odin.service.verificarProgresoMisiones()` (ver Fase 3)
  15. Devolver `{ actividad, xp_otorgado, nivel_nuevo?, racha_actual }`

- `obtenerActividades(usuarioId, filtros: { area?, tipo?, page, limit, fechaInicio?, fechaFin? })`:
  - Query paginada con filtros opcionales, ordenada por `timestamp DESC`
- `obtenerActividadesHoy(usuarioId)`:
  - Activities del día actual, agrupadas

---

### Paso 2.4 — Endpoints de Actividades

**Archivo:** `backend/src/modules/actividades/actividades.routes.ts`

Prefijo `/api/actividades`. Todos requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/` | Registrar actividad |
| GET | `/` | Listar actividades (paginado, con filtros) |
| GET | `/today` | Actividades del día + conteos por área |
| GET | `/stats` | Estadísticas por período (semana/mes/año) |
| GET | `/:id` | Detalle de una actividad |
| DELETE | `/:id` | Eliminar actividad (soft delete) |

**Schema Zod** (`actividades.schema.ts`):
```typescript
const RegistrarActividadSchema = z.object({
  tipo: z.enum([...tipos válidos...]),
  duracion_minutos: z.number().int().min(1).max(1440),
  descripcion: z.string().optional(),
  timestamp: z.string().datetime().optional(), // default: ahora
  metadata: z.object({
    grupo_muscular: z.string().optional(),
    repeticiones: z.number().optional(),
    monto: z.number().optional(),
    moneda: z.string().default('COP'),
    destino: z.string().optional()
  }).optional()
})
```

**Criterio:** `POST /api/actividades` con tipo `sueno` y `duracion_minutos: 480` otorga 20 XP base + bonus de racha + actualiza racha.

---

## BLOQUE B — Cronos

### Paso 2.5 — Motor de Energía de Cronos

**Archivo:** `backend/src/modules/cronos/energia.service.ts`

Tablas de consumo por tipo (del spec 08):
```typescript
export const CONSUMO_ENERGIA: Record<string, number> = {
  'sueno_8h': -60,          // recupera
  'ejercicio_fuerza': 25,   // por hora
  'ejercicio_cardio': 20,
  'estudio': 15,
  'trabajo': 10,
  'transporte': 5,
  'meditacion': -10,        // recupera
  'musica_escucha': 2,
  'descanso': -5,
  'ocio_activo': 3
}
```

- `calcularEnergiaEvento(tipoActividad, duracionMin): number`:
  - `consumo = CONSUMO_ENERGIA[tipo] ?? 5`
  - `energia_delta = consumo × (duracionMin / 60)` (proporcional a la duración)
- `propagarEnergiaDelDia(usuarioId, fecha)`:
  1. Obtener todos los eventos del día ordenados por `inicio_at`
  2. Energía inicial = 100%
  3. Si hay un evento `sueno` del día anterior: aplicar recuperación según horas dormidas (tabla del spec 08)
  4. Para cada evento en orden: `energia_restante -= calcularEnergiaEvento(tipo, duracion)`
  5. Actualizar `energia_consumida` en cada `cronos_evento`
  6. Retornar array de `{ evento_id, energia_restante_despues }`

---

### Paso 2.6 — Servicio de Cronos

**Archivo:** `backend/src/modules/cronos/cronos.service.ts`

- `crearEvento(usuarioId, data)`:
  1. Validar `inicio_at < fin_at`
  2. Verificar no solapamiento con eventos existentes (query: eventos del día que se intersectan)
  3. Insertar en `cronos_eventos`
  4. Llamar a `propagarEnergiaDelDia()` para recalcular todos los eventos del día
  5. Emitir `cronos:event_updated` via WebSocket

- `moverEvento(usuarioId, eventoId, nuevoInicio, opcionConflicto)`:
  - `opcionConflicto` puede ser: `'reemplazar' | 'deslizar' | 'intercambiar'`
  - **Reemplazar:** eliminar evento en destino, mover origen al slot
  - **Deslizar:** obtener todos los eventos desde el destino en adelante, desplazarlos hacia abajo en la duración del evento que se mueve
  - **Intercambiar:** swap de `inicio_at` y `fin_at` entre origen y destino
  - Recalcular energía después de cualquier cambio
  - Emitir evento WebSocket

- `completarEvento(usuarioId, eventoId)`:
  1. Marcar `completado=true`, `completado_at=NOW()`
  2. Calcular si fue puntual: `|completado_at - fin_at| <= 15 minutos`
  3. Si impuntual: `xp_penalizacion_impuntualidad = true`
  4. Si el evento está vinculado a una actividad (por `actividad_tipo`):
     - Aplicar la penalización del -15% en el XP de esa actividad
     - O registrar nota en el `xp_event` de esa actividad
  5. Si el evento es de tipo Leonidas: redirigir al formulario de sesión (respuesta incluye `action: 'register_leonidas_session'`)
  6. Si el evento es de tipo experiencia gastronómica (Soberbio): disparar calificación post-visita

- `obtenerEventosDelDia(usuarioId, fecha)`:
  - Obtener todos los eventos del día con energía calculada

- `obtenerDisponibilidad(usuarioId, fecha)`:
  - Devolver slots libres del día (slots de 30 min sin evento)

- `obtenerEventosPorRango(usuarioId, inicio, fin)` — para vista semana/mes

---

### Paso 2.7 — Gestión de API Keys para Agente

**Archivo:** `backend/src/modules/cronos/cronos-api-keys.service.ts`

- `generarApiKey(usuarioId, nombre, permisos)`:
  - Generar key random: `NEURAX_AGENT_${crypto.randomBytes(32).toString('hex')}`
  - Guardar hash en `cronos_api_keys`
  - Devolver key en claro (solo una vez)
- `autenticarAgente(keyEnClaro)`:
  - Hashear y buscar en tabla
  - Si encontrado y activo: devolver `{ usuario_id, permisos }`
- `revocarApiKey(keyId)`

Middleware `authenticateAgent` para rutas `/api/external/*`:
- Lee header `Authorization: Bearer NEURAX_AGENT_...`
- Valida con `cronos-api-keys.service.autenticarAgente()`
- Adjunta `request.agentUser = { userId, permisos }`

---

### Paso 2.8 — Endpoints de Cronos

**Archivo:** `backend/src/modules/cronos/cronos.routes.ts`

Prefijo `/api/cronos`. Requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/events` | Eventos (query params: `fecha`, `inicio`, `fin`) |
| POST | `/events` | Crear evento |
| PUT | `/events/:id` | Editar evento (título, duración, tipo) |
| DELETE | `/events/:id` | Eliminar evento |
| POST | `/events/:id/move` | Mover con opción de conflicto |
| POST | `/events/:id/complete` | Marcar como completado |
| GET | `/availability` | Slots disponibles del día |
| GET | `/energy/:fecha` | Estado de energía del día |
| POST | `/api-keys` | Generar API Key para agente |
| DELETE | `/api-keys/:id` | Revocar API Key |

Rutas externas (prefijo `/api/external/cronos`, middleware `authenticateAgent`):
- `GET /events`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id`, `GET /availability`

---

### Paso 2.9 — XP de Cronos (Penalización por Impuntualidad)

Integración en `cronos.service.completarEvento()`:

Cuando se completa un evento en Cronos:
- Si `completado_at > fin_at + 15min`:
  - Buscar el `xp_event` asociado a la actividad correspondiente (por `fuente_id = actividad.id`)
  - Crear un `xp_event` compensatorio de `-15%` del XP base de esa actividad
  - `UPDATE usuarios SET xp_total = xp_total - penalizacion WHERE id = ?`
  - Emitir `xp:updated` via WebSocket con `xp_delta` negativo
  - Añadir `xp_penalizacion_impuntualidad = true` al evento

---

## Checklist de Aceptación — Fase 2

- [ ] `POST /api/actividades` con tipo `sueno` 480min otorga 20 XP base
- [ ] Si el área ya alcanzó el límite diario, XP = 0 pero actividad se registra
- [ ] La racha se marca al registrar la primera actividad del día
- [ ] Si se intenta registrar ejercicio violando reglas musculares: error con tiempo restante
- [ ] `POST /api/cronos/events` crea evento y recalcula energía del día
- [ ] `POST /api/cronos/events/:id/move` con opción `'deslizar'` desplaza todos los eventos posteriores
- [ ] `POST /api/cronos/events/:id/complete` con tardanza aplica penalización de -15% XP
- [ ] `GET /api/cronos/availability` devuelve slots libres del día
- [ ] El agente puede autenticarse con su API Key y crear/editar eventos en `/api/external/cronos`
