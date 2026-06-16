# NEURAX — Sección Odin (Misiones)

## Propósito
Odin es el sistema de misiones diarias, semanales y mensuales. Incentiva la realización de actividades y hábitos mediante objetivos estructurados con recompensas de XP. Como en imagen_2: hay misiones principales, secundarias, un timer y cofres de recompensa épica.

> **Nota sobre niveles:** El XP que otorgan las misiones de Odin contribuye al sistema de niveles global (ver spec 04-gamification). Cada nivel está diseñado para durar ~6 meses o más, por lo que las misiones son una pieza clave pero no suficiente por sí solas — el usuario debe mantener actividad sostenida en todas las secciones.

---

## Estructura de Misiones

### Tipos de Misión

| Tipo | Reset | Cantidad | XP Rango |
|------|-------|---------|----------|
| **Misión Principal** | Diario (00:00) | 1 por día | 150-300 XP |
| **Misiones Secundarias** | Diario (00:00) | 3-4 por día | 40-100 XP cada una |
| **Super Misión Semanal** | Semanal (lunes 00:00) | 1 por semana | 400-700 XP |
| **Super Misión Mensual** | Mensual (día 1) | 1 por mes | 700-1000 XP |

### Estructura de la Pantalla Odin (como imagen_2)
```
┌─────────────────────────────────────────┐
│  🗡️ MISIÓN DEL DÍA                      │
│  Completa tus misiones diarias          │
│  y gana XP extra                        │
│  ⏱ 07:42:15  (tiempo restante)          │
├─────────────────────────────────────────┤
│  🎯 MISIÓN PRINCIPAL                     │
│  "Mantén la constancia"                 │
│  Registra al menos 5 actividades hoy   │
│  [███████████░░░░░] 3/5                  │
│                           +200 XP       │
├─────────────────────────────────────────┤
│  ⚡ MISIONES SECUNDARIAS                 │
│                                         │
│  ✓ Ejercita 30 minutos    +100 XP  ✅  │
│  ○ Estudia algo nuevo     +40 XP   ○  │
│  ○ Duerme 7-9 horas       +40 XP   ○  │
│  ○ Revisa tus finanzas    +40 XP   ○  │
├─────────────────────────────────────────┤
│  🎁 RECOMPENSA POR COMPLETAR TODO       │
│  ┌─────────────────────┐               │
│  │    COFRE ÉPICO 🔒   │  +350 XP      │
│  │  ¡Completa todo     │               │
│  │  para desbloquearlo!│               │
│  └─────────────────────┘               │
├─────────────────────────────────────────┤
│  [🗡️ VAMOS A POR ELLO 💪]              │
│  [Ver calendario de misiones]          │
└─────────────────────────────────────────┘
```

---

## Misiones Predefinidas del Sistema

### Pool de Misiones Principales

El sistema selecciona **1 misión principal por día** del siguiente pool. Se rota para no repetir la misma misión en los últimos 7 días:

| ID | Nombre | Objetivo | XP |
|----|--------|----------|-----|
| `consistency_5` | Mantén la constancia | Registra 5 actividades en el día | 200 XP |
| `full_day` | Día Completo | Registra actividades de 3 áreas diferentes | 250 XP |
| `early_warrior` | Guerrero Madrugador | Registra una actividad antes de las 8:00 AM | 150 XP |
| `study_focus` | Enfoque Total | Estudia 2 horas hoy | 200 XP |
| `body_mind` | Cuerpo y Mente | Ejercicio + Meditación o Sol matutino en el mismo día | 250 XP |
| `financial_check` | Control Total | Registra en Demeter y revisa tu presupuesto | 150 XP |
| `productivity_max` | Máxima Productividad | Trabajo + Estudio sumando 4 horas | 250 XP |
| `recovery_day` | Recuperación Óptima | Sueño 7h+ y Meditación o Sol matutino | 175 XP |
| `leonidas_day` | Día Leonidas | 2 sesiones de ejercicio en el día | 200 XP |
| `perfect_sleep` | Sueño Perfecto | Duerme entre 7 y 9 horas exactas | 150 XP |

### Pool de Misiones Secundarias

El sistema selecciona **3-4 misiones del día** del siguiente pool. Se priorizan las que son relevantes según el historial del usuario:

| ID | Nombre | Objetivo | XP |
|----|--------|----------|-----|
| `exercise_30` | Ejercita 30 minutos | 1 sesión física ≥ 30 min | 100 XP |
| `study_new` | Aprende algo nuevo | 1 sesión de estudio ≥ 30 min | 40 XP |
| `sleep_good` | Duerme bien | Registro de sueño ≥ 7h | 40 XP |
| `finance_log` | Registra tus finanzas | 1 registro en Demeter | 40 XP |
| `music_session` | Sesión musical | 1 registro de música | 40 XP |
| `transport_log` | Registra tu transporte | 1 registro de transporte | 30 XP |
| `morning_sun` | Sol matutino | Registro de sol antes de 9:00 AM | 50 XP |
| `meditation` | Medita | 1 sesión de meditación ≥ 10 min | 60 XP |
| `work_productive` | Sé productivo | 1 registro de trabajo ≥ 1h | 40 XP |
| `leonidas_set` | Entrena fuerte | 1 sesión Leonidas ≥ 45 min | 100 XP |
| `reading` | Lee | Registra sesión de estudio/lectura | 50 XP |
| `complete_cronnos` | Respeta tu agenda | Completa 3 tareas de Cronnos puntualmente | 80 XP |

---

## Super Misiones

### Super Misión Semanal (lunes a domingo)

| ID | Nombre | Objetivo | XP |
|----|--------|----------|-----|
| `weekly_streak` | Semana Sin Fallas | 7 días con actividad esta semana | 500 XP |
| `weekly_study_10h` | Semana Académica | Estudia 10 horas durante la semana | 400 XP |
| `weekly_exercise_5` | Semana Atlética | 5 sesiones de ejercicio en la semana | 450 XP |
| `weekly_full_odin` | Odin Semanal | Completa todas las misiones diarias 5 días | 600 XP |
| `weekly_finance` | Semana Financiera | Registra en Demeter todos los días de la semana | 400 XP |

### Super Misión Mensual

| ID | Nombre | Objetivo | XP |
|----|--------|----------|-----|
| `monthly_30_active` | Mes Activo | 30 días con actividad este mes | 1000 XP |
| `monthly_xp_2000` | Acumulador | Gana 2000 XP en el mes | 700 XP |
| `monthly_streak` | Racha del Mes | Mantén racha 30 días este mes | 900 XP |
| `monthly_5_sections` | Explorador | Usa al menos 5 secciones diferentes este mes | 700 XP |

---

## Cofre de Recompensa Épica

Cuando el usuario completa **TODAS** las misiones del día (principal + todas secundarias):
1. El cofre se desbloquea con animación (brillo dorado, apertura épica)
2. Se otorgan las XP del cofre (300-350 XP extra)
3. El cofre tiene nombre y efecto visual diferente cada semana:
   - Semana 1: Cofre de Bronce (300 XP)
   - Semana 2: Cofre de Plata (300 XP)
   - Semana 3: Cofre Dorado (350 XP)
   - Semana 4: Cofre Épico (350 XP + logro especial si es el 4to consecutivo)

---

## Misiones Personalizadas

El usuario puede crear misiones propias:
1. Ir a Odin → "Crear Misión"
2. Campos:
   - Nombre (texto libre)
   - Descripción
   - Tipo de objetivo (actividad, tiempo, sección específica)
   - Meta (cuantificable: X sesiones, X minutos, X veces)
   - XP asignado (1-300 XP, el usuario decide)
   - Frecuencia: diaria, semanal, una sola vez
3. Las misiones personalizadas aparecen en la pantalla de Odin junto a las del sistema

### Misiones Asistidas por IA
1. Odin → "Sugerir misión con IA"
2. El sistema genera un archivo de prompt con: resumen de actividades de la última semana + áreas débiles + archivos de memoria del usuario
3. Se invoca la CLI de IA (ver spec 02-tech-stack — Estrategia CLI) → devuelve 3 sugerencias de misiones en JSON
4. El usuario elige cuál activar (o la modifica antes de aceptar)
5. Los archivos de memoria se actualizan con las misiones elegidas para aprendizaje futuro

---

## Timer y Urgencia

- El timer en el header muestra el tiempo restante hasta las 00:00 (reset)
- Formato: `HH:MM:SS`
- Cuando faltan < 2 horas: el timer se pone en naranja
- Cuando faltan < 30 minutos: el timer pulsa en rojo + notificación push si hay misiones incompletas

---

## Calendario de Misiones

Vista mensual que muestra:
- Días con todas las misiones completadas: ✓ verde
- Días con misiones parciales: ~naranja
- Días sin actividad en Odin: ✗ rojo
- Días futuros: ○ gris

El usuario puede navegar meses anteriores para ver su historial.

---

## Base de Datos

```sql
-- Definición de misiones del sistema
CREATE TABLE odin_misiones_catalogo (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) NOT NULL,  -- 'principal', 'secundaria', 'super_semanal', 'super_mensual'
  objetivo_tipo VARCHAR(50),  -- 'actividades_count', 'minutos_tipo', 'areas_count', etc.
  objetivo_valor INTEGER NOT NULL,
  objetivo_filtro JSONB,      -- {"tipo": "ejercicio"} o {"area": "fisicas"}
  xp_reward INTEGER NOT NULL,
  activa BOOLEAN DEFAULT TRUE
);

-- Misiones asignadas al usuario por día
CREATE TABLE odin_misiones_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  catalogo_id VARCHAR(50) REFERENCES odin_misiones_catalogo(id),
  
  -- Para misiones personalizadas/IA (catalogo_id = NULL)
  nombre VARCHAR(100),
  descripcion TEXT,
  objetivo_tipo VARCHAR(50),
  objetivo_valor INTEGER,
  objetivo_filtro JSONB,
  xp_reward INTEGER,
  es_personalizada BOOLEAN DEFAULT FALSE,
  
  -- Progreso
  progreso INTEGER DEFAULT 0,
  completada BOOLEAN DEFAULT FALSE,
  completada_at TIMESTAMPTZ,
  xp_otorgado INTEGER DEFAULT 0,
  
  -- Periodo
  periodo_tipo VARCHAR(20) NOT NULL,  -- 'diario', 'semanal', 'mensual'
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de cofres abiertos
CREATE TABLE odin_cofres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo_cofre VARCHAR(20) NOT NULL,
  xp_otorgado INTEGER NOT NULL,
  abierto_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_odin_usuario_periodo ON odin_misiones_usuario(usuario_id, periodo_inicio, periodo_fin);
CREATE INDEX idx_odin_usuario_completadas ON odin_misiones_usuario(usuario_id, completada, periodo_inicio);
```
