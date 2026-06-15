# NEURAX — Dashboard Principal

## Propósito
El Dashboard es la pantalla central de NEURAX. Es lo primero que ve el usuario al abrir la app después del login. Debe dar un snapshot completo del estado actual del usuario en 3 segundos de lectura.

---

## Dashboard Mobile

### Estructura (top → bottom, con scroll)

```
┌─────────────────────────────────────┐
│  [Avatar] Nombre        [🔔3] [◆XP]│  ← Header
├─────────────────────────────────────┤
│        XP TOTAL HERO CARD           │  ← XP Card
│   XXXXXX XP                         │
│   Hasta nivel N+1 (Nombre)          │
│   [████████████░░░░] barra XP        │
│   MIN XP ←————————→ MAX XP          │
├─────────────────────────────────────┤
│  [🔥 RACHA ACTUAL | 🏆 MEJOR RACHA] │  ← Streak Cards (2 col)
│     X días                Y días    │
├─────────────────────────────────────┤
│  ACTIVIDAD DE HOY          X/Y reg  │  ← Today tracker
│  [○]──[✓]──[✓]──[●]──[○]           │  ← dots pipeline
├─────────────────────────────────────┤
│  [+ Registrar Actividad]            │  ← CTA principal
├─────────────────────────────────────┤
│  RESUMEN SEMANAL         Ver más ›  │  ← Weekly summary
│  [◆ XP sem] [⊞ Acts] [⚡ Promedio] │
└─────────────────────────────────────┘
         ↓ scroll opcional ↓
┌─────────────────────────────────────┐
│  MISIONES ACTIVAS (Odin)  Ver Odin›│  ← Preview Odin
│  [Misión principal en progreso]     │
├─────────────────────────────────────┤
│  ÚLTIMO LOGRO                       │  ← Preview logro reciente
│  [HexBadge] Nombre logro  +XP XP   │
└─────────────────────────────────────┘
       ↕ Bottom Nav (fijo)
```

---

### Header

**Izquierda:**
- Avatar RPG circular (48x48px) con borde del color del nivel actual
- Nombre del usuario (15px, semibold, `--text`)
- Nombre del nivel (12px, Cinzel, color del nivel, con dot indicador pulsante)

**Centro:**
- Vacío (flexible)

**Derecha:**
- Campana de notificaciones (36x36px card) con badge rojo si hay notificaciones pendientes
- Chip de XP total (pill con gradiente dorado) — decorativo, actualiza con animación de conteo al ganar XP

---

### XP Hero Card

```
┌─────────────────────────────────────────┐
│                          [HexBadge 120] │  ← decorativo, background, 50% opacity
│  XP TOTAL               (opacidad 50%) │
│  123,456   XP                           │
│  Hasta nivel 4 (Veterano)               │
│  [████████████░░░░░░░] barra            │
│  100 XP ←——————————————→ 500 XP        │
└─────────────────────────────────────────┘
```

- Fondo: card con `--bg-500` + border dorado sutil
- XP número: 42px, Cinzel 800, gradiente dorado (`#fde68a` → `#fbbf24`)
- Al ganar XP: el número hace conteo animado (0.4s)
- La barra de progreso tiene gradiente `--purple-300` → `--gold-200`

---

### Streak Cards (2 columnas)

**Racha Actual:**
- Label: "RACHA ACTUAL" (10px Cinzel, 600)
- Valor: X días (28px Cinzel 800, color naranja `#fb923c`)
- Caption dinámica:
  - 0 días: "¡Comienza hoy!"
  - 1-2 días: "¡Buen inicio!"
  - 3-6 días: "¡Vas bien!"
  - 7-13 días: "¡Semana perfecta!"
  - 14+: "¡Imparable!"
- Ícono: `Flame` en naranja

**Mejor Racha:**
- Label: "MEJOR RACHA" (10px Cinzel, 600)
- Valor: Y días (28px Cinzel 800, dorado `#fbbf24`)
- Caption: "¡Tu récord!"
- Ícono: `Trophy` en dorado

---

### Actividad de Hoy — Pipeline

Muestra hasta 5 slots de actividad del día actual como dots en línea:

```
[✓]──────[✓]──────[●]──────[○]──────[○]
Sueño   Ejercicio  Trabajo  Música  Estudio
```

- `✓` (verde): Actividad completada ese día
- `●` (color del tipo, brillando): Actividad actual/en progreso
- `○` (gris, dashed border): Slot vacío
- Línea conectora: verde si el slot anterior está completado, gris si no
- Cada dot es 38px circular
- Al tocar un dot completado: muestra mini-tooltip con nombre + XP ganado

**Contador arriba derecha:** "X/Y actividades registradas" (donde Y es el target diario o el total planeado en Cronnos)

---

### Botón "Registrar Actividad"

- Full width, gradiente púrpura, ícono `+`
- Al tocar: abre el bottom sheet de registro de actividad
- Si se acaba de ganar XP: el botón pulsa brevemente (feedback de éxito)

---

### Resumen Semanal

3 mini-cards en grid:
| Card | Ícono | Label | Valor |
|------|-------|-------|-------|
| 1 | `Bolt` (púrpura) | XP esta semana | Total XP últimos 7 días |
| 2 | `Calendar` (azul) | Actividades | Count últimos 7 días |
| 3 | `TrendingUp` (dorado) | Promedio | XP/día últimos 7 días |

Enlace "Ver más ›" → navega a pantalla de Estadísticas.

---

### Secciones de Preview (Scroll adicional)

**Preview de Odin (Misiones):**
- Si hay misión del día activa: muestra la misión principal con barra de progreso
- Si no hay misiones: muestra "Revisa tus misiones de hoy"
- Tap → navega a sección Odin

**Preview de Último Logro:**
- Solo aparece si se desbloqueó algún logro en las últimas 24h
- Muestra el HexBadge + nombre + XP otorgado
- Tap → navega a pantalla de Logros

---

### XP Burst (Overlay Flotante)

Cuando el usuario gana XP (al completar un registro):
1. Texto "+X XP" aparece centrado en la pantalla
2. Font: Cinzel 900, 3rem
3. Gradiente: `#fde68a` → `#f4c542` → `#f97316`
4. Animación `xpRise`: flota hacia arriba 80px + opacity 0 (1.6s)
5. `pointer-events: none` — no bloquea interacción
6. Desaparece solo; si hay level-up, la animación de Level Up aparece después

---

## Dashboard Web

### Layout en pantalla completa

```
┌─────────────────────────────────────────────────────────────┐
│  TOP NAV                                                     │
├───────────────┬─────────────────────────────────────────────┤
│               │  ┌────────┐ ┌──────────────────────────┐   │
│  [SIDE MENU   │  │ XP     │ │ RACHA ACTUAL | MEJOR     │   │
│   desplegable │  │ HERO   │ │ RACHA                    │   │
│   desde dcha] │  │ CARD   │ ├──────────────────────────┤   │
│               │  │        │ │ ACTIVIDADES HOY          │   │
│               │  └────────┘ │ [dot pipeline expandido] │   │
│               │             └──────────────────────────┘   │
│               │  ┌──────────────────────────────────────┐  │
│               │  │ RESUMEN SEMANAL (más datos que mobile)│  │
│               │  │ [bar chart semanal inline]            │  │
│               │  └──────────────────────────────────────┘  │
│               │  ┌──────────────────────────────────────┐  │
│               │  │ MISIONES ODIN    │  ÚLTIMOS LOGROS   │  │
│               │  └──────────────────────────────────────┘  │
└───────────────┴─────────────────────────────────────────────┘
```

### Diferencias Mobile vs Web

| Elemento | Mobile | Web |
|---------|--------|-----|
| Layout | Scroll vertical | Grid 2-3 columnas |
| XP Hero | Card completa | Card en columna izquierda |
| Dots de actividad | 5 dots | Expandido con más slots |
| Resumen semanal | 3 mini-cards | + Bar chart inline |
| Odin preview | Scroll bottom | Panel derecho |
| Logros preview | Scroll bottom | Panel derecho junto a Odin |
| Animación Dimension Split | Sí | Sí (versión adaptada) |

---

## Estados del Dashboard

### Loading State
- Skeleton screens (shimmer animation) para cada sección
- El contenido aparece sección por sección (stagger 150ms entre ellos)
- No spinner global — skeleton es más elegante

### Error State
- Si falla la carga: card de error con ícono + mensaje + botón "Reintentar"
- Solo se muestra error en la sección afectada, el resto carga normalmente

### Empty State (Usuario Nuevo)
- XP = 0, nivel 1
- Las racha cards muestran "0 días / ¡Comienza hoy!"
- Dots de actividad muestran 5 slots vacíos
- Mensaje de bienvenida personalizado: "¡Bienvenido, [Nombre]! Registra tu primera actividad"
- CTA de "Registrar Actividad" brilla con animación de pulso para llamar la atención

---

## Notificaciones (Badge)

El ícono de campana en el header muestra un badge rojo con el número de notificaciones no leídas.

Al tocar la campana: panel de notificaciones slide-in desde arriba mostrando:
- Logros desbloqueados (ícono dorado)
- XP ganado por misiones (ícono púrpura)
- Alertas del sistema (ícono azul)
- Racha en riesgo (ícono naranja)

Cada notificación muestra: timestamp relativo ("hace 2h"), mensaje, y una acción contextual.
