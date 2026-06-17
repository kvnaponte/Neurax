# NEURAX — Navegación y Estructura de Pantallas

## Mobile — Navegación Principal

### Bottom Navigation (6 tabs)

| Tab | Ícono | Label | Pantalla |
|-----|-------|-------|---------|
| 1 | `Home` | Inicio | Dashboard principal |
| 2 | `Activity` / `Zap` | Actividades | Historial y registro de actividades |
| 3 | `Calendar` | Cronnos | Calendario inteligente |
| 4 | `Trophy` | Logros | Achievements + hitos |
| 5 | `User` | Perfil | Perfil, estadísticas, configuración |
| 6 | `Grid` | Secciones | Grid de las 14 secciones |

### Comportamiento del Bottom Nav
- Tab activo: pill con gradiente púrpura + glow, label en 700 weight
- Tab inactivo: ícono en `--text-mute`, label en 500 weight
- El tab "Secciones" abre un **modal de pantalla completa** con grid de secciones (no navega a una pantalla nueva)
- Posición: `position: absolute; bottom: 0` con `backdrop-filter: blur(14px)`
- Safe area: respeta el `paddingBottom` del dispositivo (notch inferior)

### Stack de Navegación Mobile

```
Root Navigator
├── Auth Stack (si no hay sesión)
│   ├── Onboarding
│   ├── Login
│   ├── SecretQuestion
│   └── Register
│
└── Main Tab Navigator (si hay sesión)
    ├── Tab: Home
    │   └── DashboardScreen
    │       └── LevelUpOverlay (modal)
    │
    ├── Tab: Actividades
    │   ├── ActividadesScreen
    │   └── RegistrarActividadScreen (modal/bottom sheet)
    │
    ├── Tab: Cronnos
    │   ├── CronnosScreen (vista día)
    │   ├── CronnosWeekScreen (vista semana)
    │   └── NuevaTareaModal
    │
    ├── Tab: Logros
    │   ├── LogrosScreen
    │   └── CrearHitoModal
    │
    ├── Tab: Perfil
    │   ├── PerfilScreen
    │   ├── ProgresoScreen (Tu Progreso / niveles)
    │   ├── EstadisticasScreen
    │   └── ConfiguracionScreen
    │       ├── NotificacionesScreen
    │       └── CuentaScreen
    │
    └── Modal: Secciones (desde cualquier tab)
        └── SeccionesGridModal
            ├── → CronnosScreen (ya en tab)
            ├── → OdinScreen
            ├── → DemeterScreen
            ├── → SoberbioScreen
            ├── → DionisioScreen
            ├── → ApoloScreen
            ├── → AlejandriScreen
            ├── → MichelinScreen
            ├── → OdysseiaScreen
            ├── → NemesisScreen
            ├── → ProezaScreen
            ├── → LeoinidasScreen (ya disponible en actividades)
            ├── → ProdigyScreen
            └── → KuberaScreen
```

### Modal de Secciones (Grid)
Se abre al tocar el tab "Secciones". Aparece como un **bottom sheet** que sube cubriendo 85% de la pantalla:

```
┌─────────────────────────────────┐
│  ─────── (handle de drag)       │
│  SECCIONES                      │
│                                 │
│  [Cronnos] [Odin]  [Demeter]    │
│  [Soberbio][Dionisio][Apolo]    │
│  [Alejand.][Michel.][Odysseia]  │
│  [Nemesis] [Proeza][Leonidas]   │
│  [Prodigy] [Kubera]             │
│                                 │
└─────────────────────────────────┘
```
- Cada sección: ícono en card 56x56px + nombre abajo
- Color de borde según la sección (cada sección tiene su color de acento)
- Tap → navega a la pantalla de esa sección (push sobre el stack actual)

---

## Web — Navegación Principal

### Layout General

```
┌─────────────────────────────────────────────────────────┐
│ TOP NAV (secciones más visitadas + botón menú)          │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  SIDE MENU   │          CONTENIDO PRINCIPAL             │
│  DERECHO     │                                          │
│  (despleg.)  │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Top Navigation Bar (Web)
- Izquierda: Logo NEURAX (click → Dashboard)
- Centro: Las **3-5 secciones más visitadas** (actualización automática por frecuencia de uso)
  - Se muestran como tabs con ícono + nombre
  - El orden cambia dinámicamente según visitas en los últimos 7 días
- Derecha: Avatar del usuario + nivel + notificaciones (campana) + botón hamburger (abre sidebar)

### Side Menu Derecho (Desplegable)
- Se abre al click del botón hamburger o al hover en desktop
- Muestra **todas las 14 secciones** organizadas por categoría:

```
CORE
  📅 Cronnos
  ⚔️ Odin

VIDA PERSONAL
  💰 Demeter
  🎮 Kubera
  💪 Leonidas
  🎓 Prodigy
  🎵 Proeza

ENTRETENIMIENTO
  🎬 Apolo
  📚 Alejandría
  🎮 Némesis

EXPERIENCIAS
  🍽️ Soberbio
  ✈️ Odysseia
  👨‍🍳 Michelin

DIGITAL
  📱 Dionisio
```

- Cierra al click fuera del menú o al presionar Escape
- Animación: slide-in desde la derecha (0.3s ease-out)

### Animaciones de Transición entre Secciones
Cada sección tiene una animación de entrada única al navegar a ella:
- Fundido + escala desde 95% a 100%
- Duración: 0.4s con Motion
- El header de la sección aparece primero (stagger: 0.1s) seguido del contenido

### Home Page por Sección
Cada una de las 14 secciones tiene su propio "home page" en web con:
- Hero banner con el nombre de la sección y su ícono
- Resumen de datos clave (últimas actividades, estadísticas rápidas)
- Acciones rápidas (botones principales)
- Feed de actividad reciente de esa sección

---

## Animaciones Globales

### Transición entre Tabs (Mobile)
- Tipo: Slide horizontal (siguiente tab) / Slide horizontal inverso (tab anterior)
- Las tabs numéricamente ordenadas definen la dirección

### Entrada de Pantalla (Push)
- Tipo: Slide desde la derecha (entrada) / Slide hacia la derecha (back)

### Modales y Bottom Sheets
- Entrada: slide desde abajo + fade
- Salida: slide hacia abajo + fade
- Swipe down para cerrar (Gesture Handler)

---

## Pantalla de Perfil (Mobile)

### Estructura
- Avatar + nombre + email
- Badge de nivel con color del nivel actual
- Estadísticas rápidas en grid 3 columnas: XP Total, Actividades, Mejor racha

### Opciones de menú (filas clickeables)
| Ícono | Label | Descripción |
|-------|-------|-------------|
| `Shield` | Tu Progreso | Pantalla de niveles y progreso |
| `Trophy` | Logros desbloqueados | X de Y logros |
| `Bell` | Notificaciones | Configurar notificaciones |
| `User` | Cuenta y privacidad | Gestión de cuenta |
| `RefreshCw` | Sincronizar dispositivos | Forzar sync manual |
| `LogOut` | Cerrar sesión | Rojo, requiere confirmación |

### Pantalla "Tu Progreso" (Niveles)
- Card hero con el HexBadge del nivel actual + nombre + descripción + barra de progreso
- Lista de los 6 niveles con:
  - HexBadge del nivel (con glow si es el actual)
  - Nombre + rango de XP
  - Check verde si alcanzado / candado si no

---

## Pantalla de Estadísticas (Mobile + Web)

### Filtro de Período
- Esta semana / Este mes / Este año / Todo el tiempo
- Selector tipo dropdown

### Contenido
1. **Donut chart**: distribución de XP por área (Físicas/Económicas/Rutinas/Otras)
2. **Mini stats grid** (3 columnas): Días activos, Actividades totales, XP promedio diario
3. **Bar chart**: XP por día de la semana (7 barras, dorado el día actual)
4. **Distribución por tipo**: lista con porcentajes y puntos de color
5. **Tendencia**: indicador de +/-% vs período anterior

---

## Gestión de Estado de Navegación

- El estado de la tab activa se persiste en Zustand
- Las pantallas de secciones se montan lazily (solo cuando se visitan por primera vez)
- Los datos de cada sección se cachean en TanStack Query (staleTime: 5 minutos)
- Al volver a una pantalla ya visitada: muestra datos cacheados + revalida en background
