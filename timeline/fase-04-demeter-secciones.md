# Fase 4 — Demeter y Secciones de Contenido

**Prerequisito:** Fase 3 completada.
**Resultado:** Demeter con presupuesto y 5 fondos especiales operativos. Las 8 secciones de contenido (Soberbio, Apolo, Alejandría, Michelin, Odysseia, Némesis, Proeza, Kubera, Prodigy) tienen CRUD completo con sus reglas específicas.
**Specs de referencia:** `11-demeter.md`, `12-secciones-contenido.md`, `13-soberbio-dionisio.md` (Soberbio)

---

## BLOQUE A — Demeter

### Paso 4.1 — Servicio de Presupuesto

**Archivo:** `backend/src/modules/demeter/demeter-budget.service.ts`

- `configurarPresupuesto(usuarioId, data)`:
  - Ejecuta el wizard de primera configuración o redistribución
  - `data = { gastos_fijos: { arriendo, servicios, suscripciones, deudas }, ingreso_esperado, categorias: { gastos_fijos_pct, inversiones_pct, entretenimiento_pct, gastos_personales_pct, otros_pct } }`
  - Validar que los porcentajes de categorías variables sumen 100%
  - Calcular `disponible = ingreso_esperado - sum(gastos_fijos)`
  - Calcular montos absolutos: `monto_categoria = disponible × pct / 100`
  - Upsert en `demeter_presupuestos` para el mes/año actual
  - Si ya existe presupuesto del mes: actualizar (re-distribución)

- `obtenerPresupuestoMes(usuarioId, año, mes)`:
  - Si no existe: devolver `{ configurado: false }` → el frontend muestra el wizard
  - Si existe: devolver presupuesto completo con gastos reales acumulados

- `calcularGastosReales(usuarioId, año, mes)`:
  - `SELECT categoria, SUM(monto) FROM demeter_movimientos WHERE usuario_id=? AND date_trunc('month', fecha) = ? AND tipo='egreso' GROUP BY categoria`

- `esPrimeraVez(usuarioId): Promise<boolean>`:
  - `SELECT COUNT(*) FROM demeter_presupuestos WHERE usuario_id = ?` === 0

---

### Paso 4.2 — Servicio de Movimientos

**Archivo:** `backend/src/modules/demeter/demeter-movements.service.ts`

- `registrarMovimiento(usuarioId, data)`:
  1. Insertar en `demeter_movimientos`
  2. Otorgar XP: ingreso=10, egreso=5, inversión=15 (via `xp.service.otorgarXP`)
  3. Si tipo = `ingreso`: verificar si se debe distribuir a fondos especiales
  4. Verificar alertas de presupuesto (ver paso 4.3)
  5. Verificar triggers de fondos especiales (ver paso 4.4)

- `obtenerMovimientos(usuarioId, filtros)`:
  - Paginado, filtrable por tipo/categoría/fecha

- `obtenerResumenMes(usuarioId, año, mes)`:
  - Ingresos totales, egresos totales, por categoría, distribución

---

### Paso 4.3 — Alertas de Presupuesto

**Archivo:** `backend/src/modules/demeter/demeter-alerts.service.ts`

Invocado después de cada `registrarMovimiento`:

- `verificarAlertas(usuarioId, categoriaAfectada)`:
  1. Obtener presupuesto del mes y gasto real acumulado de la categoría
  2. `porcentajeUsado = gastoReal / presupuestoCategoría`
  3. Si `porcentajeUsado >= 0.80` y no notificado: enviar notificación push "Categoría al 80%"
  4. Si `porcentajeUsado >= 1.00` y no notificado: enviar notificación push + badge rojo

Usar Redis para evitar notificaciones duplicadas:
- `SET demeter:alerta:80:${userId}:${categoria}:${mes} 1 EX 86400`

---

### Paso 4.4 — Motor de Fondos Especiales

**Archivo:** `backend/src/modules/demeter/demeter-funds.service.ts`

- `actualizarFondos(usuarioId, montoIngreso)`:
  - Al registrar un ingreso, opcionalmente asignar parte a los fondos activos
  - Actualizar `demeter_presupuestos.fondos_especiales` JSONB

- `verificarObjetivosFondos(usuarioId)`:
  Para cada fondo activo (soberbio, michelin, odysseia, nemesis, kubera):
  - Si `fondo.acumulado >= fondo.objetivo`:
    - Disparar el trigger correspondiente:
      - **Soberbio**: seleccionar lugar aleatorio pendiente → notificar → proponer fechas en Cronos
      - **Michelin**: seleccionar receta aleatoria pendiente → notificar → agendar sesión en Cronos
      - **Odysseia**: seleccionar destino pendiente → notificar → proponer fechas en Cronos
      - **Nemesis**: notificar que puede comprar el juego de la lista
      - **Kubera**: notificar que puede comprar el producto deseado
    - Usar Redis para no repetir la notificación en el mismo mes: `demeter:fondo:${nombre}:${userId}:${mes}`

- `configurarFondo(usuarioId, nombre, objetivo)`:
  - Actualizar el objetivo en `demeter_presupuestos.fondos_especiales`

---

### Paso 4.5 — Endpoints de Demeter

**Archivo:** `backend/src/modules/demeter/demeter.routes.ts`

Prefijo `/api/demeter`. Requieren `authenticate`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/status` | Primera vez o presupuesto configurado |
| POST | `/budget` | Configurar/redistribuir presupuesto |
| GET | `/budget/:año/:mes` | Presupuesto + gastos reales del mes |
| POST | `/movements` | Registrar movimiento |
| GET | `/movements` | Listar movimientos (paginado) |
| GET | `/summary/:año/:mes` | Resumen del mes |
| GET | `/funds` | Estado de los 5 fondos especiales |
| POST | `/funds/:nombre` | Configurar objetivo de un fondo |
| GET | `/stats` | Estadísticas históricas (6 meses) |

---

## BLOQUE B — Secciones de Contenido

### Paso 4.6 — Soberbio

**Archivo:** `backend/src/modules/soberbio/soberbio.service.ts` + `soberbio.routes.ts`

- CRUD de lugares: `crear`, `actualizar`, `obtener`, `listar`, `eliminar`
- `actualizarEstado(id, estado: 'pendiente' | 'visitado')`:
  - Al pasar a `visitado`: registrar `fecha_visita = NOW()`
  - Si hay calificación en el body: guardar `calificaciones` JSONB
  - Calcular `calificacion_final = avg(valores del JSONB)`
- `seleccionarLugarAleatorio(usuarioId)`:
  - `SELECT * FROM soberbio_lugares WHERE usuario_id=? AND estado='pendiente' ORDER BY RANDOM() LIMIT 1`
- `calificarVisita(usuarioId, lugarId, criterios)`:
  - Criterios: `{ ingredientes, tecnica, creatividad, servicio, ambiente }` (1-5 cada uno)
  - Calcular promedio
  - XP por visita calificada: 50 XP

Endpoints prefijo `/api/soberbio`:
- `GET /` — lista (pendientes/visitados/todos)
- `POST /` — crear lugar
- `PUT /:id` — actualizar
- `DELETE /:id` — eliminar (soft delete)
- `POST /:id/visit` — marcar visitado + calificar

---

### Paso 4.7 — Apolo

**Archivo:** `backend/src/modules/apolo/apolo.service.ts` + `apolo.routes.ts`

- CRUD de películas con campos: `year, movie, director, country, producer, distributed, genre, estado, fecha_visualizacion, rating, stars, category`

- `calcularCategory(rating: number): string`:
  ```
  4.5–5.0 → 'DIAMOND'
  4.0–4.4 → 'GOLD'
  3.5–3.9 → 'PLATINUM'
  3.0–3.4 → 'GOOD'
  2.0–2.9 → 'ACEPTABLE'
  0.0–1.9 → 'BAD'
  ```

- `calcularNivelCinefilo(usuarioId: string): string`:
  ```
  SELECT COUNT(*) FROM apolo_peliculas WHERE usuario_id=? AND estado='vista'
  ```
  - 0–5 → 'NOVATO'
  - 6–20 → 'INTERESADO'
  - 21–60 → 'EMPODERADO'
  - 61–150 → 'SOBERBIO'
  - 151–400 → 'ERUDITO'
  - 401–999 → 'DESPIERTO'
  - 1000+ → 'ILUMINADO'

- Al registrar una película como vista: calcular automáticamente `stars = rating`, `category = calcularCategory(rating)`

- `obtenerTop5(usuarioId)`: ORDER BY rating DESC LIMIT 5

Endpoints prefijo `/api/apolo`:
- `GET /` — lista con filtros
- `POST /` — agregar película
- `PUT /:id` — actualizar (incluyendo calificar con rating)
- `DELETE /:id`
- `GET /top5` — top 5 por rating
- `GET /nivel` — nivel cinéfilo actual del usuario

---

### Paso 4.8 — Alejandría

**Archivo:** `backend/src/modules/alejandria/`

CRUD de libros con campos del spec 12. Sin cambios respecto al spec original.

- Al marcar como `terminado`: calcular `calificacion_final = avg(calificaciones)`
- Campo `paginas_leidas` permite tracking de progreso
- Endpoint de búsqueda por autor/título/género

Endpoints prefijo `/api/alejandria`:
- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `GET /stats` — stats de lectura (libros terminados, en progreso, páginas leídas)

---

### Paso 4.9 — Michelin

**Archivo:** `backend/src/modules/michelin/`

CRUD de recetas con campos del spec 12.

- `sugerirRecetaAleatoria(usuarioId, filtros: { dificultad?, ingredientesDisponibles? })`:
  - Si filtro de ingredientes: comparar con `ingredientes` array
  - `ORDER BY RANDOM() LIMIT 1`
- Al marcar como `cocinada`: incrementar `veces_cocinada`, actualizar `ultima_vez`
- Integración con Cronos: cuando Demeter dispara el fondo Michelin, este servicio proporciona la receta aleatoria seleccionada

Endpoints prefijo `/api/michelin`:
- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `GET /suggest` — sugerencia aleatoria (con filtros opcionales)

---

### Paso 4.10 — Odysseia

**Archivo:** `backend/src/modules/odysseia/`

CRUD de destinos sin campo `resena`.

- Al marcar como `visitado`: registrar `fecha_visita`, actualizar `calificacion`
- Integración con Demeter: cuando el fondo Odysseia se completa, proporcionar destino pendiente aleatorio

Endpoints prefijo `/api/odysseia`:
- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `GET /stats` — mapa de destinos visitados vs pendientes

---

### Paso 4.11 — Némesis

**Archivo:** `backend/src/modules/nemesis/`

CRUD de juegos con estados: `por_comprar → por_jugar → jugando → completado → calificado`

- Al marcar como `completado`: calcular `calificacion_final = avg(calificaciones)`
- `obtenerEstadisticas(usuarioId)`: total por estado, horas totales, gasto total, plataforma favorita

Endpoints prefijo `/api/nemesis`:
- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `GET /stats`

---

### Paso 4.12 — Proeza

**Archivo:** `backend/src/modules/proeza/`

CRUD de canciones con campos simplificados: `nombre, estado, beatmaker, fecha_inicio, links[]`
- Estado: `idea → en_proceso → grabada → mezclada → masterizada → lanzada`

**Exploración Musical (sistema aleatorio):**
- `obtenerExploracionActual(usuarioId)`:
  - Obtener la exploración con estado `asignado` o `explorando` del usuario
  - Si no existe: generar nueva asignación aleatoria
- `generarNuevaExploracion(usuarioId)`:
  - Obtener lista de países y ciudades del mundo (seed de datos a preparar)
  - Seleccionar combinación que no haya sido explorada antes por el usuario
  - Insertar en `proeza_exploracion_musical` con `estado='asignado'`
- `completarExploracion(usuarioId, exploracionId, calificacion)`:
  - `UPDATE SET estado='explorado', fecha_explorado=NOW(), calificacion=?`
  - Generar automáticamente la siguiente asignación

**Seed de datos:** `backend/src/db/seeds/proeza-paises.ts` — lista de ~200 países con ciudades representativas

Endpoints prefijo `/api/proeza`:
- `GET /canciones`, `POST /canciones`, `PUT /canciones/:id`, `DELETE /canciones/:id`
- `GET /exploracion/actual` — exploración musical actual asignada
- `POST /exploracion/:id/complete` — marcar exploración como explorada

---

### Paso 4.13 — Kubera

**Archivo:** `backend/src/modules/kubera/`

CRUD de productos sin campo `prioridad`.
- Al activar `ahorrando`: crear fondo Kubera en Demeter
- Al marcar `adquirido`: registrar `precio_real`, `fecha_adquisicion`, cerrar fondo en Demeter

Endpoints prefijo `/api/kubera`:
- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `POST /:id/start-saving` — activar ahorro (crea fondo en Demeter)
- `POST /:id/acquire` — marcar como adquirido

---

### Paso 4.14 — Prodigy

**Archivo:** `backend/src/modules/prodigy/`

CRUD de cursos con entregas vinculadas a Cronos.

- Al crear una entrega con `fecha_entrega`: crear automáticamente un `cronos_evento` tipo `compromiso`
- Al completar un curso: calcular `porcentaje_completado = 100`
- `obtenerHorasEstudiadas(usuarioId, cursoId)`:
  - Sum de `duracion_minutos` de actividades tipo `estudio` vinculadas al curso

Endpoints prefijo `/api/prodigy`:
- `GET /cursos`, `POST /cursos`, `PUT /cursos/:id`, `DELETE /cursos/:id`
- `GET /entregas`, `POST /entregas`, `PUT /entregas/:id`, `DELETE /entregas/:id`
- `POST /cronos/generar` — generar horario de estudio en Cronos para un curso

---

## Checklist de Aceptación — Fase 4

- [ ] `GET /api/demeter/status` devuelve `{ configurado: false }` para usuario nuevo
- [ ] `POST /api/demeter/budget` con wizard completo configura presupuesto con los 5 fondos
- [ ] Al acumularse el fondo Soberbio: se selecciona un lugar aleatorio y se dispara la notificación
- [ ] Apolo calcula correctamente `category='DIAMOND'` para rating 4.8
- [ ] `GET /api/apolo/nivel` devuelve el nivel cinéfilo correcto según películas vistas
- [ ] Exploración Musical de Proeza asigna país/ciudad aleatorios y genera la siguiente al completar
- [ ] Kubera sin campo prioridad y con botón de iniciar ahorro que crea fondo en Demeter
- [ ] Prodigy crea evento en Cronos automáticamente al registrar una entrega con fecha
- [ ] Soberbio sin campos de fotos ni referencia Dionisio
- [ ] Odysseia sin campo de reseña
