# NEURAX — Sistema de Gamificación

## Sistema de XP

### Qué Genera XP
| Fuente | XP | Condición |
|--------|-----|-----------|
| Actividad registrada | Variable (ver spec activities) | Según tipo y duración |
| Misión Odin completada | 100-350 XP | Según tipo de misión |
| Super misión completada | 300-1000 XP | Semanales/mensuales |
| Logro desbloqueado | 25-500 XP | Según logro |
| Hito manual | Definido por usuario | Sin límite superior |
| Tarea Cronnos a tiempo | +20% XP bonus | Solo si completada en ventana |
| Racha bonus | Multiplicador | Ver tabla de rachas |

### Cálculo de XP de Actividad
```
XP_final = XP_base × bonus_racha × bonus_horario
```
- `XP_base`: definido en spec de actividades por tipo y duración
- `bonus_racha`: multiplicador según días consecutivos (ver tabla)
- `bonus_horario`: 1.2x si la actividad es en el horario óptimo de su tipo

### Límites Diarios de XP por Área
| Área | Límite diario |
|------|--------------|
| Rutinarias | 150 XP |
| Físicas | 200 XP |
| Económicas | 100 XP |
| Odin (misiones) | Sin límite |
| Logros | Sin límite |

---

## Sistema de Niveles

### Los 6 Niveles

| # | Nombre | XP Mínimo | XP Máximo | Color | Descripción |
|---|--------|-----------|-----------|-------|-------------|
| 1 | Superviviente | 0 | 99 | `#34d399` (verde) | Inicio del camino |
| 2 | Aprendiz | 100 | 249 | `#fb923c` (naranja) | Primeros pasos |
| 3 | Guerrero | 250 | 499 | `#a855f7` (púrpura) | En camino hacia la grandeza |
| 4 | Veterano | 500 | 999 | `#60a5fa` (azul) | Consistencia probada |
| 5 | Campeón | 1000 | 1999 | `#f472b6` (rosa) | Dominio absoluto |
| 6 | Imbatible | 2000 | ∞ | `#fbbf24` (dorado) | ¡La leyenda eres tú! |

### Avatar por Nivel
El avatar del dashboard muestra una ilustración RPG diferente por nivel:
| Nivel | Descripción del Avatar |
|-------|----------------------|
| 1 | Figura con ropa simple, sin armadura |
| 2 | Figura con capa y espada básica |
| 3 | Guerrero con armadura parcial y espada |
| 4 | Guerrero con armadura completa y escudo |
| 5 | Campeón con armadura ornamentada y halo |
| 6 | Leyenda con armadura luminosa y efectos de energía |

### Level Up
Al alcanzar el XP umbral del siguiente nivel:
1. Se pausa la actividad actual
2. Aparece el overlay **Level Up** (pantalla completa)
3. Animación de rayos de luz + HexBadge del nuevo nivel
4. Nombre del nivel en gradiente dorado
5. Descripción del nivel
6. Botón "Continuar la aventura"
7. Al cerrar: el dashboard refleja el nuevo nivel inmediatamente

---

## Sistema de Rachas

### Definición
Una **racha** es el número de días consecutivos en los que el usuario ha registrado **al menos una actividad** antes de la medianoche.

### Reglas
- La racha **comienza** el primer día que el usuario registra una actividad
- La racha **se mantiene** si hay al menos 1 actividad cualquier día
- La racha **se rompe** si a las 23:59:59 no hay ninguna actividad registrada ese día
- **No hay periodo de gracia** — si no hay actividad, la racha se rompe
- El reset ocurre a **medianoche hora local del dispositivo**

### Bonus de Racha (Multiplicador de XP)
| Días de racha | Multiplicador |
|--------------|--------------|
| 0-2 días | 1.0x (sin bonus) |
| 3-6 días | 1.1x |
| 7-13 días | 1.25x |
| 14-29 días | 1.5x |
| 30+ días | 1.75x |
| 60+ días | 2.0x |

### Alerta de Racha en Riesgo
A las **20:00** del usuario, si no hay actividad del día:
- Notificación push: "⚡ Tu racha de X días está en riesgo. ¡Registra una actividad antes de medianoche!"
- Badge rojo en el ícono de la app

### Métricas de Racha
- **Racha actual**: días consecutivos activos hasta hoy
- **Mejor racha**: récord histórico del usuario
- Ambas se muestran en el Dashboard

---

## Sistema de Logros

### Categorías

| Categoría | Descripción |
|-----------|-------------|
| **Consistencia** | Rachas, días activos consecutivos |
| **Volumen** | Totales acumulados (horas de estudio, sesiones de ejercicio, etc.) |
| **Perfección** | Días perfectos (todas las actividades planificadas completadas) |
| **Exploración** | Usar secciones nuevas, registrar tipos de actividad nuevos |
| **Hitos temporales** | Primeras veces (primera actividad, primera racha de 7 días, etc.) |
| **Físico (Leonidas)** | Logros específicos de ejercicio |
| **Mental (Prodigy)** | Logros de estudio y aprendizaje |
| **Personal** | Logros manuales o sugeridos por IA |

### Estados de un Logro
| Estado | Visual |
|--------|--------|
| **Bloqueado** | HexBadge con candado, opacidad 50%, sin descripción de progreso |
| **En progreso** | HexBadge coloreado + barra de progreso + contador (X/Y) |
| **Desbloqueado** | HexBadge brillante + check verde + fecha de desbloqueo |

### Logros del Sistema (Predefinidos)

| ID | Nombre | Descripción | Criterio | XP |
|----|--------|-------------|----------|-----|
| `first_step` | Primer Paso | Registra tu primera actividad | 1 actividad total | 25 XP |
| `consistent_3` | Constante | 3 días consecutivos | Racha ≥ 3 | 50 XP |
| `consistent_7` | Semana Perfecta | 7 días consecutivos | Racha ≥ 7 | 100 XP |
| `consistent_30` | Mes Invicto | 30 días consecutivos | Racha ≥ 30 | 350 XP |
| `consistent_60` | Leyenda Viva | 60 días consecutivos | Racha ≥ 60 | 500 XP |
| `early_bird` | Madrugador | Actividad antes de las 7:00 AM | 1 actividad < 7:00 | 50 XP |
| `night_owl` | Noctámbulo | Actividad después de las 23:00 | 1 actividad > 23:00 | 30 XP |
| `gym_warrior` | Guerrero del Gym | 7 sesiones de Leonidas | 7 sesiones físicas | 75 XP |
| `study_10h` | Estudioso | 10 horas de estudio acumuladas | 600 min estudio | 75 XP |
| `sleep_5` | Bien Descansado | Dormir 7h+ durante 5 días | 5 registros sueño ≥ 420min | 60 XP |
| `marathon` | Maratonista | 50 actividades registradas | 50 actividades totales | 100 XP |
| `level_3` | Guerrero Confirmado | Alcanzar nivel 3 | XP ≥ 250 | 150 XP |
| `level_6` | Imbatible | Alcanzar el nivel máximo | XP ≥ 2000 | 500 XP |
| `all_types` | Hombre/Mujer Renaissance | Usar todos los tipos de actividad | 1 registro de cada tipo | 200 XP |
| `perfect_day` | Día Perfecto | Completar todas las actividades planeadas en un día | Cronnos 100% | 150 XP |
| `leonidas_month` | Leonidas Mensual | 20 sesiones de ejercicio en un mes | 20 sesiones/mes | 200 XP |
| `financial_streak` | Gestor de Patrimonios | 30 días registrando en Demeter | 30 registros Demeter | 150 XP |

### Logros Manuales (Hitos)
El usuario puede crear logros personales:
1. Ir a sección "Logros" → "Crear Hito"
2. Campos: Nombre, Descripción, XP asignado (1-500), ícono (selección de lista)
3. El hito se activa cuando el usuario lo marca manualmente como "completado"

### Logros Asistidos por IA
1. Ir a "Logros" → "Sugerir con IA"
2. El sistema compila un resumen del comportamiento del usuario (última semana)
3. Llamada a Claude API (haiku): prompt compacto con el resumen → sugiere 3 logros personalizados
4. El usuario revisa las 3 sugerencias y puede:
   - **Aceptar**: se crea el logro en estado "en progreso"
   - **Modificar**: puede editar nombre/descripción antes de aceptar
   - **Rechazar**: descarta la sugerencia

### Pantalla de Logros
- Tabs: Todos / Desbloqueados / En Progreso
- Logro destacado (featured): el más reciente desbloqueado, mostrado en card grande con badge hexagonal grande
- Grid de 3 columnas para el resto
- Cada card: HexBadge, nombre, descripción, XP otorgado, barra de progreso si aplica

---

## Evento XP en la UI

Cuando el usuario gana XP (registra actividad, completa misión, desbloquea logro):
1. Texto flotante "+X XP" aparece en el centro de la pantalla
2. Animación `xpRise`: el texto flota hacia arriba y desaparece (1.6s)
3. El contador de XP en el header se incrementa con animación de conteo
4. Si hay level-up: el overlay de Level Up aparece después del XP burst

---

## Base de Datos de Gamificación

```sql
-- XP Events (historial de todos los XP ganados)
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fuente VARCHAR(50) NOT NULL,       -- 'activity', 'mission', 'achievement', 'hito'
  fuente_id UUID,                    -- ID de la actividad/misión/logro origen
  xp_amount INTEGER NOT NULL,
  xp_base INTEGER NOT NULL,
  bonus_racha DECIMAL(3,2) DEFAULT 1.0,
  bonus_horario DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estado de logros por usuario
CREATE TABLE usuario_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,  -- slug del logro
  tipo VARCHAR(20) DEFAULT 'sistema',   -- 'sistema', 'manual', 'ia'
  progreso INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  desbloqueado BOOLEAN DEFAULT FALSE,
  desbloqueado_at TIMESTAMPTZ,
  xp_otorgado INTEGER DEFAULT 0,
  -- Para logros manuales/IA:
  nombre VARCHAR(100),
  descripcion TEXT,
  icono VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rachas
CREATE TABLE rachas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tiene_actividad BOOLEAN DEFAULT FALSE,
  UNIQUE(usuario_id, fecha)
);

CREATE INDEX idx_xp_events_usuario ON xp_events(usuario_id, created_at DESC);
CREATE INDEX idx_achievements_usuario ON usuario_achievements(usuario_id);
CREATE INDEX idx_rachas_usuario ON rachas(usuario_id, fecha DESC);
```
