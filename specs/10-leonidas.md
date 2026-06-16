# NEURAX — Sección Leonidas (Ejercicio Físico)

## Propósito
Leonidas es el módulo de gestión de ejercicio físico. Combina planificación semanal de entrenamientos, seguimiento de series/repeticiones, y un sistema de reglas estrictas de secuencia muscular para optimizar la recuperación y prevenir lesiones.

**Principio fundamental:** Los ejercicios se asignan **automáticamente** por el motor de reglas de Leonidas. El usuario únicamente puede marcar si realizó o no la sesión asignada del día. No puede modificar el grupo muscular asignado — el sistema garantiza que la asignación siempre cumple todas las reglas de descanso y secuencia.

---

## Pantalla Principal de Leonidas

### Mobile Layout
```
┌─────────────────────────────────────────┐
│  LEONIDAS                    [📅 Plan]  │
│  "El guerrero nunca descansa..."        │
├─────────────────────────────────────────┤
│  ESTA SEMANA                            │
│  [L][M][X][J][V][S][D]                  │
│  [✓][✓][○][●][○][~][○]                  │
│  ✓=completado ●=hoy ~=solo trote/barras │
├─────────────────────────────────────────┤
│  HOY: ENTRENAMIENTO DE PECHO           │
│  ─────────────────────────────────────  │
│  [💪 Press Banca]   3×10  ✓            │
│  [💪 Apertura]      3×12  ✓            │
│  [💪 Fondos]        3×15  ○            │
│  + Añadir ejercicio                    │
├─────────────────────────────────────────┤
│  DISPONIBILIDAD MUSCULAR               │
│  ─────────────────────────────────────  │
│  Pecho     [████████░░] 8h (disponible)│
│  Espalda   [██████████] ✓ disponible   │
│  Tríceps   [░░░░░░░░░░] 32h restantes  │
│  Hombros   [████░░░░░░] 16h restantes  │
├─────────────────────────────────────────┤
│  [⚔️ REGISTRAR SESIÓN]                  │
└─────────────────────────────────────────┘
```

---

## Planificación Semanal

El usuario puede definir un **plan de entrenamiento semanal** que indica:
- Qué días entrena
- Qué grupo muscular entrena cada día
- El tipo de entrenamiento (fuerza, cardio, barras, trote)

### Plan por Defecto Sugerido
| Día | Entrenamiento | Grupos |
|-----|--------------|--------|
| Lunes | Fuerza | Pecho + Tríceps |
| Martes | Fuerza | Espalda + Bíceps |
| Miércoles | Descanso | — |
| Jueves | Fuerza | Hombros + Abdomen |
| Viernes | Cardio | Cuerpo completo |
| Sábado | Solo permitido | Trote + Barras |
| Domingo | Descanso | — |

El usuario puede modificar este plan en cualquier momento.

---

## Registro de Sesión de Ejercicio

### Campos al Registrar
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Tipo | Selector | Sí | Fuerza / Cardio / Barras / Trote |
| Grupo muscular | Multi-selector | Sí para fuerza/barras | Qué músculos se trabajaron |
| Duración | Minutos | Sí | Tiempo total de sesión |
| Ejercicios | Lista | No | Nombre + series + repeticiones + peso |
| Intensidad | 1-5 | No | Percepción subjetiva del esfuerzo |
| Notas | Texto | No | Observaciones libres |
| Timestamp | DateTime | No | Default: ahora |

### Registro de Ejercicios Específicos
Para cada ejercicio dentro de la sesión:
| Campo | Tipo |
|-------|------|
| Nombre del ejercicio | Texto / selector de catálogo |
| Series | Número |
| Repeticiones | Número |
| Peso | Número (kg) + toggle "Sin peso / Con peso" |

El catálogo de ejercicios incluye los más comunes y permite agregar ejercicios personalizados.

---

## Sistema de Reglas Estrictas

### Validaciones en Tiempo Real
Al seleccionar un grupo muscular, el sistema verifica inmediatamente:

1. **¿El grupo necesita más descanso?**
   → Si hay menos horas de descanso que el mínimo requerido: BLOQUEADO
   → Mensaje: "Tríceps necesita 48h de descanso. Disponible en: 16h 30min"

2. **¿La secuencia está prohibida?**
   → Revisa el último músculo entrenado y verifica si la combinación está prohibida
   → Mensaje: "No puedes entrenar Espalda después de Tríceps el mismo día. Intenta mañana."

3. **¿Es sábado?**
   → Solo permite Trote y Barras
   → Al intentar registrar otro tipo: "Los sábados solo se permiten Trote y Barras"

### Panel de Disponibilidad Muscular
Siempre visible en la pantalla de Leonidas:

- Lista de todos los grupos musculares
- Para cada uno:
  - `✓ Disponible` (verde) → se puede entrenar
  - `X h restantes` (rojo/naranja) → con barra de progreso de descanso
  - Tiempo exacto: "Disponible en 8h 15min" o "Disponible mañana a las 10:30"

---

## Estadísticas de Leonidas

### Vista de Estadísticas
- **Volumen semanal**: total de series × repeticiones × peso por grupo muscular
- **Frecuencia**: cuántas veces se trabajó cada grupo en la última semana/mes
- **Racha de Leonidas**: días consecutivos con alguna sesión física
- **Progreso por ejercicio**: gráfica de peso máximo levantado por ejercicio a lo largo del tiempo
- **Distribución de grupos**: donut chart de cuánto tiempo se dedicó a cada grupo muscular

---

## Reglas Detalladas

### Secuencias Prohibidas (mismo día o día siguiente)
```
Tríceps → Espalda alta: PROHIBIDO
Espalda alta → Tríceps: PROHIBIDO
Pecho → Hombros: PROHIBIDO
Hombros → Pecho: PROHIBIDO
Bíceps → Espalda alta: PROHIBIDO
Cuádriceps → Femorales: PROHIBIDO
Femorales → Cuádriceps: PROHIBIDO
```

### Tiempos Mínimos de Descanso por Grupo Muscular
```
Pecho:         48h mínimo
Espalda alta:  48h mínimo
Espalda baja:  72h mínimo
Hombros:       48h mínimo
Bíceps:        48h mínimo
Tríceps:       48h mínimo
Abdomen/Core:  24h mínimo
Glúteos:       48h mínimo
Cuádriceps:    48h mínimo
Femorales:     48h mínimo
Pantorrillas:  24h mínimo
Cuerpo comp.:  72h mínimo
```

### Restricciones por Día
```
Sábado: SOLO Trote o Barras
Resto:  Sin restricciones adicionales
```

---

## Catálogo de Ejercicios (Predefinidos)

**Nota:** También puede cargarse manualmente desde la sección de configuración de Leonidas.

### Pecho
Flexiones · Press banca · Press inclinado · Aperturas · Fondos · Pullover

### Espalda
Dominadas · Remo · Jalón al pecho · Peso muerto · Hiperextensiones · Face pull

### Hombros
Press militar · Elevaciones laterales · Elevaciones frontales · Vuelos · Arnold press

### Bíceps
Curl barra · Curl mancuerna · Curl martillo · Curl concentrado · Curl predicador

### Tríceps
Press francés · Extensión polea · Tríceps en polea · Patada de tríceps · Fondos cerrados

### Cuádriceps
Sentadilla · Prensa · Extensiones · Zancadas · Sentadilla búlgara

### Femorales / Glúteos
Peso muerto rumano · Curl femoral · Hip thrust · Patada glúteo · Puente de glúteo

### Core / Abdomen
Plancha · Crunch · Leg raises · Russian twist · Rueda abdominal

### Cardio
Correr · Bicicleta · Elíptica · Remo · Burpees · Salto de cuerda

### Barras / Calistenia
Dominadas · Fondos · Muscle-up · L-sit · Front lever · Back lever

---

## XP de Leonidas

| Tipo | Duración | XP Base |
|------|----------|---------|
| Fuerza | < 60 min | 5 XP |
| Fuerza | ≥ 60 min | 15 XP |
| Cardio | < 30 min | 5 XP |
| Cardio | ≥ 30 min | 15 XP |
| Barras | < 30 min | 10 XP |
| Barras | ≥ 30 min | 20 XP |
| Trote | < 30 min | 10 XP |
| Trote | ≥ 30 min | 20 XP |

Aplicar bonus de racha + bonus de horario (06:00–10:00 = 1.2x) sobre XP base.

---

## Base de Datos

```sql
CREATE TABLE leonidas_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  actividad_id UUID REFERENCES actividades(id),  -- link al registro de actividad
  
  tipo VARCHAR(30) NOT NULL,  -- 'fuerza', 'cardio', 'barras', 'trote'
  grupos_trabajados TEXT[] NOT NULL,  -- ['pecho', 'triceps']
  duracion_minutos INTEGER NOT NULL,
  intensidad SMALLINT,  -- 1-5
  notas TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leonidas_ejercicios_sesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES leonidas_sesiones(id) ON DELETE CASCADE,
  
  nombre VARCHAR(100) NOT NULL,
  grupo_muscular VARCHAR(50),
  series INTEGER,
  repeticiones INTEGER,
  peso_kg DECIMAL(6,2),
  notas TEXT,
  orden SMALLINT DEFAULT 0
);

CREATE TABLE leonidas_plan_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL,  -- 0=Domingo, 1=Lunes, ..., 6=Sábado
  tipo VARCHAR(30),
  grupos_planeados TEXT[],
  activo BOOLEAN DEFAULT TRUE,
  UNIQUE(usuario_id, dia_semana)
);

-- Vista para calcular disponibilidad muscular
CREATE VIEW leonidas_disponibilidad_muscular AS
SELECT
  s.usuario_id,
  unnest(s.grupos_trabajados) as grupo,
  MAX(s.timestamp) as ultima_sesion,
  NOW() - MAX(s.timestamp) as tiempo_transcurrido
FROM leonidas_sesiones s
GROUP BY s.usuario_id, unnest(s.grupos_trabajados);

CREATE INDEX idx_leonidas_sesiones_usuario ON leonidas_sesiones(usuario_id, timestamp DESC);
```
