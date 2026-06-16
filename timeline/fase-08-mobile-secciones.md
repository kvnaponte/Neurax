# Fase 8 — Mobile: Todas las Pantallas de Secciones

**Prerequisito:** Fase 7 completada (core mobile, auth, dashboard y navigation funcionando).
**Resultado:** Todas las pantallas de la app móvil implementadas: Cronos, Actividades, Odin, Leonidas, Demeter, Logros, Soberbio, Apolo, Alejandría, Michelin, Odysseia, Némesis, Proeza, Kubera, Prodigy, Dionisio y Perfil.
**Specs de referencia:** Todos los specs 04–16.

---

## BLOQUE A — Pantallas Principales (Tabs)

### Paso 8.1 — Pantalla de Actividades

**Archivo:** `mobile/src/app/(tabs)/actividades.tsx`

- Header con título "Registrar Actividad"
- Selector de tipo: grid de cards por área (Rutinarias / Físicas / Mentales / Económicas)
- Al seleccionar tipo: formulario contextual
  - Todos: campo de duración (slider o input numérico en minutos)
  - Físicas: selector de grupo muscular (mostrar disponibilidad con badge verde/rojo)
  - Económica: monto + categoría
- Botón "Registrar" → `POST /api/actividades`
- Feedback: animación de XP flotante (+XX XP) en verde/dorado sobre el botón
- Lista de actividades de hoy (acordeón expandible por área)
- Stats del día: XP por área, límites alcanzados en rojo

**Componente `XPFloat`:** Animación con Reanimated — el texto "+XX XP" aparece, sube y desaparece en 1.5 segundos.

---

### Paso 8.2 — Pantalla de Cronos

**Archivo:** `mobile/src/app/(tabs)/cronos.tsx`

Vista diaria como columna de tiempo (formato calendario vertical):

- Header: selector de fecha (swipe izquierda/derecha para cambiar día)
- Columna de 24 horas con slots de 30 minutos
- Eventos mostrados como bloques coloreados por tipo
- Indicador de energía: barra horizontal en la parte superior que decrece según los eventos
- **Drag & Drop:**
  - Long press en evento → drag
  - Al soltar sobre otro evento: modal con 3 opciones (Reemplazar / Deslizar hacia abajo / Intercambiar)
  - Usar `react-native-gesture-handler` + Reanimated para el gesture
- Botón (+) flotante → modal de crear evento (campos: título, tipo, inicio, fin)
- Al completar evento: tap → modal de confirmación → si es tipo Leonidas, redirigir a registro de sesión
- Penalización visible: badge "⚠️ -X XP" en eventos completados tarde

---

### Paso 8.3 — Pantalla de Odin (Misiones)

**Archivo:** `mobile/src/app/(tabs)/odin.tsx`

Tres tabs internas: Hoy / Semana / Mes

**Tab "Hoy":**
- Card principal: Misión del día con barra de progreso y contador HH:MM:SS
- Lista de misiones secundarias (3-4 cards)
- Cofre épico: card bloqueado/desbloqueado con animación de apertura al completar todo
- XP total del día

**Tab "Semana":**
- Super misión semanal con barra de progreso
- Historial de días (indicadores de semáforo: verde=completo, amarillo=parcial, rojo=sin actividad)

**Tab "Mes":**
- Super misión mensual
- Grid del calendario del mes (30/31 días con colores)

**Componente `ChestAnimation`:** Al abrir el cofre épico — using Lottie o Reanimated para la animación de apertura con destellos dorados.

---

### Paso 8.4 — Pantalla de Perfil y Navegación a Secciones

**Archivo:** `mobile/src/app/(tabs)/perfil.tsx`

- Header: avatar + nombre + nivel + XP total
- Sección "Logros": preview de últimos 3 logros desbloqueados + botón "Ver todos"
- Sección "Mis Secciones": grid de iconos/cards que navegan a las secciones
  - Leonidas, Demeter, Soberbio, Apolo, Alejandría, Michelin, Odysseia, Némesis, Proeza, Kubera, Prodigy, Dionisio
- Sección "Configuración": notificaciones, seguridad, cerrar sesión

---

## BLOQUE B — Pantallas de Secciones

### Paso 8.5 — Leonidas

**Archivo:** `mobile/src/app/sections/leonidas.tsx`

- Card principal "HOY": grupo muscular asignado + icono del músculo + badge "Asignado automáticamente"
- Lista de ejercicios sugeridos con detalles (series × reps)
- Botón "Marcar como completado" → `POST /api/leonidas/today/complete`
  - Alternativa: botón "Registrar sesión detallada" → formulario con ejercicios, series, pesos
- Tab "Disponibilidad": lista de todos los grupos musculares con semáforo (verde=disponible, rojo=en descanso con tiempo restante)
- Tab "Historial": últimas 10 sesiones en acordeón
- Tab "Estadísticas": volumen por semana (chart de barras por grupo), racha de Leonidas

---

### Paso 8.6 — Demeter

**Archivo:** `mobile/src/app/sections/demeter.tsx`

**Si primer acceso (GET /api/demeter/status → configurado: false):** Mostrar wizard de configuración con 3 pasos:
1. Gastos fijos (arriendo, servicios, suscripciones, deudas)
2. Ingreso esperado
3. Distribución porcentual por categorías

**Si ya configurado:**
- Header: mes actual + ingreso esperado vs real
- Barras de presupuesto por categoría (verde=bien, amarillo=80%, rojo=excedido)
- Fondos especiales: 5 cards con progreso circular (Soberbio, Michelin, Odysseia, Nemesis, Kubera)
- Botón "Registrar movimiento" → modal con tipo/monto/categoría/descripción
- Lista de últimos movimientos (paginada)
- Botón "Re-distribuir gastos" → re-abre wizard

**Componente `FondoCard`:** tarjeta con progreso circular animado en gold. Tap → modal de detalles del fondo.

---

### Paso 8.7 — Logros

**Archivo:** `mobile/src/app/sections/logros.tsx`

- Tabs: Desbloqueados / Por desbloquear / Especiales IA
- Grid de tarjetas de logro (3 columnas)
- Logro desbloqueado: icono en full color + nombre + XP
- Logro bloqueado: icono en gris + nombre + progreso (X/Y)
- Tap en logro → modal con descripción completa
- Filtro por tipo (sistema / manual / ia)

**Animación de desbloqueo:** Al recibir el evento WebSocket `achievement:unlocked`, mostrar overlay de toda la pantalla con el logro y efectos de partículas (gold). Duración 2.5s con dismiss automático.

---

### Paso 8.8 — Soberbio

**Archivo:** `mobile/src/app/sections/soberbio.tsx`

- Tabs: Pendientes / Visitados
- Card de lugar: nombre, tipo de cocina, ciudad, país, calificación (si visitado)
- Botón (+) → formulario de nuevo lugar
- Tap en lugar visitado → modal de calificación (5 sliders: ingredientes, técnica, creatividad, servicio, ambiente)
- Calificación final calculada automáticamente
- Sección "Seleccionar lugar aleatorio" → tap → card con el lugar seleccionado + opción de crear evento en Cronos

---

### Paso 8.9 — Apolo

**Archivo:** `mobile/src/app/sections/apolo.tsx`

Estética vintage cinema: fondo con textura de grano de película, tipografía serifada.

- Header: nivel cinéfilo actual (badge con nombre) + películas vistas / total registradas
- Lista de películas con filtros: estado / género / categoría / año
- Card de película: póster (placeholder con título), año, director, categoría (DIAMOND/GOLD etc. en badge coloreado)
- Tap → detalle completo: todos los campos + rating + stars
- Botón (+) → formulario: Year/Movie/Director/Country/Producer/Distributed/Genre
- Al marcar como vista → field para rating (slider 0–5) → calcular category y stars automáticamente
- Top 5: sección especial con las 5 mejores películas

---

### Paso 8.10 — Alejandría

**Archivo:** `mobile/src/app/sections/alejandria.tsx`

- Lista de libros con tabs: Leyendo / Pendientes / Terminados
- Card: portada placeholder, título, autor, progreso de páginas (si en lectura)
- Botón (+) → formulario de registro
- Tap en libro leyendo → actualizar páginas leídas (deslizador)
- Stats: libros terminados este año, páginas leídas, géneros más leídos

---

### Paso 8.11 — Michelin

**Archivo:** `mobile/src/app/sections/michelin.tsx`

- Grid de recetas (2 columnas) con imagen placeholder
- Filtros: dificultad / tipo / tiempo
- Card: imagen, nombre, dificultad (badge), tiempo total
- Tap → receta completa con ingredientes y pasos
- Botón "Cocinar ahora" → marcar como cocinada + registrar en Cronos si se desea
- Botón "Receta aleatoria" → `GET /api/michelin/suggest` → mostrar sugerencia

---

### Paso 8.12 — Odysseia

**Archivo:** `mobile/src/app/sections/odysseia.tsx`

- Tabs: Pendientes / Visitados
- Card de destino: país, ciudad, foto (placeholder), estado
- Tap visitado → detalles + calificación + fecha de visita
- Botón (+) → formulario (sin campo reseña)
- Stats: mapa estilizado (placeholder) con contador de países visitados

---

### Paso 8.13 — Némesis

**Archivo:** `mobile/src/app/sections/nemesis.tsx`

- Lista Kanban horizontal (swipe entre estados): Por Comprar / Por Jugar / Jugando / Completado
- Card de juego: título, plataforma, género, horas jugadas
- Tap → detalle + calificación (si completado)
- Botón (+) → formulario de nuevo juego
- Stats: horas totales, gasto total, plataforma favorita

---

### Paso 8.14 — Proeza

**Archivo:** `mobile/src/app/sections/proeza.tsx`

Tabs: Canciones / Exploración Musical

**Tab Canciones:**
- Lista con estados (pipeline: idea → lanzada)
- Card: nombre de canción, beatmaker, estado actual
- Botón (+) → formulario: nombre, estado, beatmaker, fecha, links

**Tab Exploración Musical:**
- Card grande: "Exploración actual" → país + ciudad asignados
- Descripción: "Explora la escena musical de [Ciudad], [País]"
- Botón "Completar exploración" → slider de calificación 1-10
- Historial de exploraciones pasadas

---

### Paso 8.15 — Kubera

**Archivo:** `mobile/src/app/sections/kubera.tsx`

- Lista de productos deseados (sin campo prioridad)
- Card: nombre, precio estimado, categoría, estado (pendiente/ahorrando/adquirido)
- Tap → detalles + botón "Iniciar ahorro" (si pendiente) → crea fondo en Demeter
- Al notificación de fondo lleno: badge en la tarjeta del producto
- Botón "Marcar como adquirido" → registrar precio real

---

### Paso 8.16 — Prodigy

**Archivo:** `mobile/src/app/sections/prodigy.tsx`

- Lista de cursos con progreso
- Card: nombre del curso, plataforma, progreso (%), horas estudiadas
- Tap → detalles + lista de entregas
- Entrega con fecha → se muestra en Cronos
- Botón "Generar horario de estudio" → `POST /api/prodigy/cronos/generar`

---

### Paso 8.17 — Dionisio

**Archivo:** `mobile/src/app/sections/dionisio.tsx`

- Input para pegar URL de TikTok → botón "Procesar"
- Feed de videos procesados con estado en badge (color):
  - `pendiente` → gris
  - `descargando/convirtiendo/transcribiendo/clasificando` → azul con spinner
  - `completado` → verde
  - `no_clasificable` → naranja
  - `descartado` → rojo
- Tap en video → detalles: transcripción, sección asignada, datos extraídos
- Botón "Reclasificar" si el usuario quiere corregir
- El estado se actualiza en tiempo real via WebSocket (`dionisio:pipeline_update`)

---

## BLOQUE C — Componentes Compartidos

### Paso 8.18 — Componentes de UI Reutilizables

**Directorio:** `mobile/src/components/ui/`

- `Button`: variantes primary (gold) / secondary (outline) / ghost / danger
- `Input`: campo de texto con label, error state, gold border en focus
- `Card`: contenedor con fondo `#12121A` y borde `#1E1E2E`
- `Badge`: chip pequeño con texto + color de fondo
- `Modal`: modal bottom sheet (usando expo-bottom-sheet)
- `ProgressBar`: barra horizontal con animación de llenado
- `CircularProgress`: barra circular para fondos de Demeter
- `Separator`: línea divisoria gold

### Paso 8.19 — Componentes de Gamificación

**Directorio:** `mobile/src/components/gamification/`

- `XPBar`: barra de progreso de nivel con colores y label
- `LevelBadge`: badge con nombre del nivel y efecto glow gold
- `StreakBadge`: badge con ícono de llama y días de racha
- `AchievementCard`: card de logro con efecto de revelación
- `XPFloat`: animación flotante de XP ganado
- `LevelUpOverlay`: overlay full-screen al subir de nivel con animación

---

## Checklist de Aceptación — Fase 8

- [ ] Cronos muestra los eventos del día con barras de energía y permite drag & drop
- [ ] Modal de 3 opciones (Reemplazar/Deslizar/Intercambiar) aparece al soltar en conflicto
- [ ] Odin muestra misión principal + secundarias + cofre con countdown
- [ ] Al completar todas las misiones, la animación del cofre se reproduce
- [ ] Leonidas muestra el músculo asignado del día automáticamente con ejercicios sugeridos
- [ ] Demeter muestra wizard en primer acceso y presupuesto con barras después
- [ ] Los 5 fondos especiales en Demeter muestran progreso circular
- [ ] Apolo calcula y muestra la categoría (DIAMOND/GOLD etc.) al calificar
- [ ] Proeza - Exploración Musical muestra país/ciudad asignados aleatoriamente
- [ ] Dionisio muestra el estado del pipeline en tiempo real via WebSocket
- [ ] Al subir de nivel: overlay de animación `LevelUpOverlay` se muestra
- [ ] Todos los formularios validan con Zod y muestran errores en línea
