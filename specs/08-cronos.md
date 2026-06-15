# NEURAX — Sección Cronnos

## Propósito
Cronnos es el **sistema nervioso central** de NEURAX. Es un calendario inteligente que gestiona todos los compromisos, actividades y pendientes del usuario, calcula su consumo de energía a lo largo del día, y sirve como hub de integración para todas las demás secciones.

---

## Vistas Disponibles

### Mobile
- **Vista Día** (predeterminada): timeline vertical con slots de 30 minutos, de 00:00 a 23:30
- **Vista Lista**: listado de eventos del día sin timeline (como imagen_1, columna derecha)

### Web
- **Vista Día**: timeline con slots de 30 min, 3 columnas (hora | energía | evento)
- **Vista Semana**: grid 7 columnas × slots de 30 min
- **Vista Mes**: calendario mensual con indicadores de densidad de actividades
- Se puede cambiar entre vistas con selector en el header de la sección

---

## Estructura de un Evento

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Título | Texto | Nombre del evento/tarea |
| Tipo | Enum | actividad, compromiso, pendiente |
| Inicio | DateTime | Hora de inicio |
| Fin | DateTime | Hora de fin |
| Duración | Calculado | `fin - inicio` en minutos |
| Área | Enum | rutinarias, físicas, económicas, estudio, otro |
| Energía consumida | 0-100% | Calculado automáticamente |
| Prioridad | 1-3 | Alta, Media, Baja |
| Completado | Boolean | El usuario lo marca al terminar |
| Vinculado con | Referencia | Sección de origen (Prodigy, Leonidas, etc.) |
| Color | Hex | Asignado según área o sección |

---

## Sistema de Energía

### Concepto
Cada evento consume una cantidad de energía del usuario. La energía es un indicador 0–100% que refleja el desgaste acumulado a lo largo del día.

### Visualización
- Escala continua **0% a 100%** con gradiente de color:
  - 0% → `#ef4444` (rojo crítico)
  - 25% → `#f97316` (naranja bajo)
  - 50% → `#eab308` (amarillo medio)
  - 75% → `#22c55e` (verde bueno)
  - 100% → `#10b981` (verde óptimo)
- En la **vista día**: columna lateral izquierda muestra el % de energía restante en cada slot de 30 min
- En las tarjetas de eventos: borde izquierdo con el color del nivel de energía en ese momento

### Cálculo de Energía Consumida por Tipo de Actividad

| Tipo de Actividad | Consumo Energía/hora |
|------------------|---------------------|
| Sueño (8h) | -60 (recupera energía) |
| Ejercicio de fuerza | +25 por hora |
| Ejercicio cardio | +20 por hora |
| Estudio concentrado | +15 por hora |
| Trabajo | +10 por hora |
| Transporte | +5 por hora |
| Meditación | -10 (recupera energía) |
| Música (escucha) | +2 por hora |
| Tiempo libre / descanso | -5 (recupera) |
| Ocio activo | +3 por hora |

### Propagación de Energía
- La energía inicial del día es 100%
- La energía después del sueño nocturno se recupera proporcional a las horas dormidas:
  - < 5h: recupera 50%
  - 5-6h: recupera 65%
  - 6-7h: recupera 75%
  - 7-8h: recupera 90%
  - > 8h: recupera 100%
- Cada evento siguiente afecta a todos los eventos posteriores (propagación en cascada)

---

## Interacción con Drag & Drop

### Mobile
- Los eventos se pueden mover **presionando y arrastrando** (long press para activar el drag)
- Al soltar: el evento se reposiciona en el slot más cercano (snapping a 30 min)
- Al mover un evento: todos los eventos posteriores **recalculan su energía automáticamente**
- Si el movimiento crea un conflicto (solapamiento): vibración haptica + indicador visual rojo

### Web
- Drag & drop nativo con dnd-kit
- Comportamiento igual al mobile en cuanto a reposicionamiento y recálculo

---

## Integración con otras Secciones

| Sección | Integración con Cronnos |
|---------|------------------------|
| **Prodigy** | Cronnos genera automáticamente bloques de estudio según fechas límite y disponibilidad |
| **Leonidas** | Al planificar un día de entrenamiento, Cronnos reserva el slot y verifica energía disponible |
| **Odin** | Las misiones del día aparecen como tareas en Cronnos |
| **Demeter** | Al alcanzar el presupuesto para una experiencia de Soberbio, Cronnos asigna fecha automáticamente |
| **Soberbio** | La visita programada aparece en Cronnos como evento de experiencia |

---

## Integración con Agente IA (API)

Cronnos expone endpoints especiales que pueden ser llamados por un agente externo con API Key:

```
POST /api/cronos/events        → Crear un evento
PUT  /api/cronos/events/:id    → Modificar posición/duración
DELETE /api/cronos/events/:id  → Eliminar un evento
GET  /api/cronos/availability  → Consultar slots disponibles
```

El agente puede:
1. Reorganizar eventos para optimizar la distribución de energía
2. Insertar nuevas tareas en slots disponibles
3. Proponer reorganizaciones y esperar confirmación del usuario (modo "sugerencia")
4. Ejecutar cambios directamente si tiene permiso `cronos:write` activado

**Autenticación del agente:** API Key generada en Configuración → Integraciones (diferente al JWT del usuario).

---

## Vista Mobile — Diseño Detallado

### Header de Cronnos (Mobile)
```
[←]  Cronnos  Lun, 15 Jun 2026  [+ ]  [Vista]
               ▲ fecha navegable ▲      Día/Lista
```

### Timeline View (Vista Día Mobile)
Como se muestra en imagen_1:

```
[06:00] ──────────────────────────────────── 🌙 Sueño
[07:00]   [████████████████] Sueño 8h · 70% ↑ ⚡+80XP
[08:00] ──────────────────────────────────────────────
[08:30]   [██████] Ejercicio · 45min · 65% ↑  ⚡+65XP
[09:00] ──────────────────────────────────────────────
[09:15]   [████████████] Estudio · 90min · 55%↑ ⚡+90XP
         ...
```

- **Línea de hora actual**: indicador rojo que se mueve en tiempo real
- **Evento actual**: borde brillante del color de su área + glow sutil
- **Eventos completados**: ✓ check verde en la esquina
- **Slots vacíos**: fondo transparente, se pueden tocar para agregar evento

### Vista Lista (Mobile, imagen_1 columna derecha)
```
ACTIVIDADES DISPONIBLES
[🌙 Sueño] [🏃 Ejercicio] [📚 Estudio] [💼 Trabajo] [⋯]

HOY
08:30  [Ejercicio] 45 min          +65 XP  ✓
09:00  [Estudio]   90 min          +90 XP  ✓
11:00  [Trabajo]   180 min         +90 XP  ●  ← en curso
20:00  [Música]    60 min          +15 XP  ○
```

### Modal "¿Qué deseas hacer?" (Agregar evento)
Aparece al tocar el botón `+` o al tocar un slot vacío:

```
┌─────────────────────────────────┐
│  ¿Qué deseas hacer?             │
│  15 Jun · 11:00 – 11:30         │
│                                 │
│  Tipo de actividad:             │
│  [🌙][🏃][📚][💼][🚌][🎵][⋯]  │
│                                 │
│  Duración: [30] minutos  ┤►├   │
│                                 │
│  Nota opcional...               │
│                                 │
│  Energía estimada: ████░ 72%   │
│                                 │
│  [Agregar a Cronnos]           │
└─────────────────────────────────┘
```

---

## Regla de Integración Demeter–Soberbio–Cronnos

Flujo automático:
1. Demeter detecta que el saldo del fondo "Experiencias" alcanza el presupuesto objetivo
2. Sistema selecciona **aleatoriamente** una experiencia pendiente de Soberbio
3. Cronnos sugiere 3 fechas disponibles (fin de semana, con energía suficiente)
4. Usuario selecciona fecha → el evento "Visita: [Nombre del lugar]" se crea en Cronnos
5. Notificación: "¡Ya puedes ir a [Nombre]! Fecha agendada: [Fecha]"

---

## XP de Cronnos

Las actividades completadas dentro de la ventana de tiempo planificada en Cronnos reciben **+20% de XP bonus por puntualidad**:
- "A tiempo": completada dentro de los ±15 minutos del horario planificado
- El bonus se aplica sobre el XP base de la actividad
- Se muestra como "⚡ +X XP (puntualidad)" en el desglose de XP

---

## Base de Datos

```sql
CREATE TABLE cronos_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(30) NOT NULL,   -- 'actividad', 'compromiso', 'pendiente'
  area VARCHAR(30),
  actividad_tipo VARCHAR(50),  -- FK lógica al tipo de actividad
  
  inicio_at TIMESTAMPTZ NOT NULL,
  fin_at TIMESTAMPTZ NOT NULL,
  duracion_minutos INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (fin_at - inicio_at)) / 60
  ) STORED,
  
  prioridad SMALLINT DEFAULT 2,  -- 1=Alta, 2=Media, 3=Baja
  energia_consumida DECIMAL(5,2),
  completado BOOLEAN DEFAULT FALSE,
  completado_at TIMESTAMPTZ,
  xp_bonus_puntualidad BOOLEAN DEFAULT FALSE,
  
  -- Relación con otras secciones
  seccion_origen VARCHAR(30),   -- 'prodigy', 'leonidas', 'soberbio', etc.
  seccion_ref_id UUID,          -- ID del objeto en la sección origen
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- API Keys para agentes externos
CREATE TABLE cronos_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  nombre VARCHAR(100),
  permisos JSONB DEFAULT '["cronos:read"]',
  activa BOOLEAN DEFAULT TRUE,
  ultimo_uso_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_cronos_usuario_fecha ON cronos_eventos(usuario_id, inicio_at);
CREATE INDEX idx_cronos_completado ON cronos_eventos(usuario_id, completado, inicio_at);
```
