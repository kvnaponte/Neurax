# NEURAX — Branding e Identidad Visual

## Logo / Emblema

### Concepto
Fusión de tres elementos:
1. **Neurona estilizada**: nodos conectados con sinapsis que forman el cuerpo central del símbolo
2. **Circuito integrado**: líneas de PCB (placa de circuito) que emergen de los nodos de la neurona
3. **Forma de escudo/espada sutil**: la silueta general del conjunto evoca un escudo heráldico o una hoja de espada vista desde arriba

El resultado es un símbolo que se lee simultáneamente como tecnología, inteligencia y poder RPG.

### Construcción
```
        ◆
       /|\
      / | \
    ◆---◆---◆     ← nodos neuronales
    |   |   |
   ═╪═══╪═══╪═    ← líneas de circuito
    |   ◆   |
     \ / \ /
      ◆   ◆
       \ /
        ◆          ← punta de escudo/espada
```

### Variantes
- **Full**: símbolo + wordmark "NEURAX"
- **Icon**: solo el símbolo (para app icon, favicon)
- **Wordmark**: solo "NEURAX" en Cinzel Decorative

## Paleta de Colores

### Colores Primitivos (tokens base)

| Token | Hex | Uso |
|-------|-----|-----|
| `--gold-100` | `#fde68a` | Dorado claro, textos de nivel |
| `--gold-200` | `#fbbf24` | Dorado principal, XP, énfasis |
| `--gold-300` | `#f59e0b` | Dorado oscuro, bordes XP |
| `--gold-400` | `#b45309` | Dorado profundo, sombras |
| `--purple-100` | `#c084fc` | Púrpura claro |
| `--purple-200` | `#a855f7` | Púrpura medio, botones secundarios |
| `--purple-300` | `#7c3aed` | Púrpura principal, botones primarios |
| `--purple-400` | `#6d28d9` | Púrpura oscuro |
| `--blue-100` | `#93c5fd` | Azul claro |
| `--blue-200` | `#60a5fa` | Azul medio |
| `--blue-300` | `#3b82f6` | Azul principal |
| `--green-100` | `#6ee7b7` | Verde claro, éxito |
| `--green-200` | `#34d399` | Verde principal, completado |
| `--green-300` | `#10b981` | Verde oscuro |
| `--orange-100` | `#fdba74` | Naranja claro |
| `--orange-200` | `#fb923c` | Naranja principal, rachas |
| `--red-100` | `#fca5a5` | Rojo claro, advertencias |
| `--red-200` | `#ef4444` | Rojo principal, errores, peligro |
| `--pink-100` | `#f9a8d4` | Rosa claro |
| `--pink-200` | `#f472b6` | Rosa principal |
| `--bg-900` | `#04050f` | Fondo más oscuro |
| `--bg-800` | `#07061a` | Fondo principal |
| `--bg-700` | `#0d0c24` | Fondo ligeramente elevado |
| `--bg-600` | `#11122a` | Superficies cards |
| `--bg-500` | `#14152e` | Superficies elevadas |
| `--border` | `rgba(168,132,251,0.15)` | Bordes estándar |
| `--border-strong` | `rgba(168,132,251,0.30)` | Bordes con énfasis |
| `--text` | `#e2e8f0` | Texto principal |
| `--text-dim` | `#94a3b8` | Texto secundario |
| `--text-mute` | `#475569` | Texto deshabilitado |

### Gradientes de Energía (Cronnos)
Escala continua 0% → 100%:
```
0%   → #ef4444  (rojo, energía crítica)
25%  → #f97316  (naranja, energía baja)
50%  → #eab308  (amarillo, energía media)
75%  → #22c55e  (verde claro, energía buena)
100% → #10b981  (verde vibrante, energía óptima)
```

### Colores por Nivel

| Nivel | Nombre | Color |
|-------|--------|-------|
| 1 | Superviviente | `#34d399` (verde) |
| 2 | Aprendiz | `#fb923c` (naranja) |
| 3 | Guerrero | `#a855f7` (púrpura) |
| 4 | Veterano | `#60a5fa` (azul) |
| 5 | Campeón | `#f472b6` (rosa) |
| 6 | Imbatible | `#fbbf24` (dorado) |

### Colores por Área de Actividad

| Área | Color |
|------|-------|
| Rutinarias | `#818cf8` (índigo) |
| Físicas | `#fb923c` (naranja) |
| Económicas | `#60a5fa` (azul) |
| Otras | `#34d399` (verde) |

## Tipografía

| Rol | Fuente | Uso |
|-----|--------|-----|
| **Display / RPG** | Cinzel Decorative | Títulos de nivel, logros, nombre NEURAX |
| **Títulos** | Cinzel | XP total, nombres de secciones, subtítulos importantes |
| **Cuerpo** | Inter | Texto de UI, descripciones, formularios |
| **Mono** | JetBrains Mono | Datos numéricos, timestamps, códigos |

### Escala Tipográfica

| Token | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| `--text-hero` | 44px | 900 | XP total hero |
| `--text-xl` | 28px | 800 | Títulos de pantalla |
| `--text-lg` | 22px | 700 | Subtítulos de sección |
| `--text-md` | 16px | 600 | Texto principal |
| `--text-sm` | 13px | 500 | Texto secundario |
| `--text-xs` | 11px | 600 | Labels, etiquetas, captions |
| `--text-2xs` | 9px | 500 | Micro labels |

## Iconografía

- Sistema de íconos: **Lucide Icons** (consistencia, estilo limpio)
- Stroke width estándar: 1.8px (normal), 2.2px (activo/seleccionado)
- Tamaños: 14px (inline), 18px (navigation), 22px (cards), 28px (featured)

### Íconos por Sección

| Sección | Ícono |
|---------|-------|
| Cronnos | `Calendar` |
| Odin | `Swords` |
| Demeter | `Coins` / `TrendingUp` |
| Soberbio | `UtensilsCrossed` |
| Dionisio | `Play` / `Bookmark` |
| Apolo | `Film` |
| Alejandría | `BookOpen` |
| Michelin | `ChefHat` |
| Odysseia | `Map` |
| Némesis | `Gamepad2` |
| Proeza | `Music` |
| Leonidas | `Dumbbell` |
| Prodigy | `GraduationCap` |
| Kubera | `ShoppingBag` |

## Componentes Visuales Clave

### Hexágono de Nivel (HexBadge)
- Forma hexagonal con gradiente del color del nivel
- Número de nivel centrado en Cinzel
- Glow/halo del color del nivel en estado activo
- Aparece en: dashboard, pantalla de progreso, logros

### Barra de XP
- Altura: 8-10px
- Gradiente horizontal: `--purple-300` → `--gold-200`
- Fondo: `rgba(0,0,0,0.4)`
- Borde redondeado: 999px

### Cards
- Background: `rgba(20,21,46,0.5)` o `--bg-500`
- Border: `1px solid var(--border)`
- Border-radius: 14-18px
- Padding: 14-20px
- Sombra sutil: `0 4px 20px rgba(0,0,0,0.3)`

### Botón Primario
- Background: `linear-gradient(135deg, #7c3aed, #a855f7)`
- Border-radius: 14px
- Sombra activa: `0 0 24px rgba(168,85,247,0.4)`
- Font: Inter 600

### Animaciones

| Nombre | Duración | Uso |
|--------|----------|-----|
| `fadeUp` | 0.8s ease-out | Entrada de elementos |
| `popIn` | 0.6s cubic-bezier(.2,.8,.2,1) | Aparición de overlays |
| `xpRise` | 1.6s ease-out | Texto de XP ganado flotando hacia arriba |
| `dimensionSplit` | 4.0s | Animación post-login (dimensiones abriéndose) |
| `rayPulse` | 2.4s ease-in-out infinite | Rayos de luz en level-up |
| `shimmer` | 1.5s linear infinite | Loading skeletons |

## Estética de Fondo

- Fondo base: `radial-gradient(ellipse at 50% 0%, #1a0d3d 0%, #07061a 70%)`
- Campo de estrellas (StarField): partículas estáticas blancas semi-transparentes, densidad variable
- Orbes de luz: `radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 60%)` con blur
- Separadores de sección: línea `1px solid var(--border)` con fade horizontal

## Animación de Acceso — "Dimension Split"

Secuencia de 4.0s que ocurre después de responder correctamente la pregunta secreta. El tiempo es el suficiente para apreciar la animación en su esplendor:

1. **0–0.4s**: Pantalla de login se congela, aparece un brillo dorado pulsante en el centro
2. **0.4–1.2s**: La pantalla se "raja" diagonalmente desde el centro hacia los bordes (efecto de grieta luminosa dorado/púrpura)
3. **1.2–2.2s**: Las dos mitades se deslizan lentamente hacia los extremos, revelando el fondo de estrellas del sistema
4. **2.2–3.2s**: El logo de NEURAX aparece con glow púrpura intenso, partículas y efecto de respiración
5. **3.2–4.0s**: Fade in suave del dashboard principal

## Animación de Level Up

- Overlay de pantalla completa con `backdrop-filter: blur(8px)`
- Fondo: `radial-gradient` del color del nuevo nivel
- Campo de rayos de luz giratorios (12 rayos)
- HexBadge del nuevo nivel con glow pulsante
- Nombre del nivel en gradiente dorado
- Botón "Continuar la aventura" con ícono de espada
