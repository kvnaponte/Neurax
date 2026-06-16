# NEURAX — Sistema de Actividades

## Tipos de Actividad

### Área: Rutinarias
| ID | Nombre | XP Base | Regla de Cálculo | Horario Óptimo |
|----|--------|---------|-----------------|----------------|
| `sueno` | Sueño | 10-20 XP | ≥ 345min (5h45m) = 20 XP; sino = 10 XP | 21:00–07:00 |
| `meditacion` | Meditación | 10-20 XP | ≥ 20min = 20 XP; sino = 10 XP | Antes de 09:00 |
| `sol_matutino` | Sol Matutino | 15 XP fijo | Sin mínimo | Antes de 09:00 (bonus 1.5x si antes de 07:30) |
| `transporte` | Transporte | 5 XP fijo | Sin mínimo | N/A |
| `musica_escucha` | Música (escucha) | 5 XP fijo | Máx. 2 actividades/día | N/A |

### Área: Físicas (Leonidas)
| ID | Nombre | XP Base | Regla de Cálculo | Horario Óptimo |
|----|--------|---------|-----------------|----------------|
| `ejercicio_fuerza` | Fuerza | 5-15 XP | ≥ 60min = 15 XP; sino = 5 XP | 06:00–10:00 (1.2x) |
| `ejercicio_cardio` | Cardio | 5-15 XP | ≥ 30min = 15 XP; sino = 5 XP | 06:00–10:00 (1.2x) |
| `barras` | Barras | 10-20 XP | ≥ 30min = 20 XP; sino = 10 XP | 06:00–10:00 (1.2x) |
| `trote` | Trote | 10-20 XP | ≥ 30min = 20 XP; sino = 10 XP | 06:00–10:00 (1.2x) |

### Área: Mentales / Productividad
| ID | Nombre | XP Base | Regla de Cálculo | Horario Óptimo |
|----|--------|---------|-----------------|----------------|
| `estudio` | Estudio | 10-25 XP | ≥ 50min = 25 XP; sino = 10 XP | 08:00–14:00 (1.2x) |
| `trabajo` | Trabajo | 10 XP fijo | Sin mínimo | N/A |
| `musica_produccion` | Música (producción) | 20 XP fijo | Sin mínimo | N/A |

### Área: Económica (Demeter)
| ID | Nombre | XP Base | Regla de Cálculo |
|----|--------|---------|-----------------|
| `ingreso` | Ingreso | 10 XP fijo | Registrar monto de ingreso |
| `egreso` | Egreso | 5 XP fijo | Registrar monto de gasto |
| `planificacion_financiera` | Planificación | 15 XP fijo | Revisar o actualizar presupuesto |

---

## Registro de Actividad

### Campos del Formulario

**Campos comunes (todos los tipos):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Tipo | Selector | Sí | Icono + nombre del tipo |
| Duración | Número (minutos) | Sí para la mayoría | Tiempo dedicado |
| Descripción | Texto libre | No | Nota personal opcional |
| Fecha/Hora | DateTime | No | Default: ahora. Permite registrar retroactivo hasta 24h |

**Campos adicionales para Físicas:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Grupo muscular | Selector | Sí para fuerza/barras | Cuál parte del cuerpo se trabajó |
| Repeticiones | Número | No | Para ejercicios por repetición |

**Campos adicionales para Económica:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Monto | Número (moneda) | Sí | Cantidad en moneda local |
| Destino/Fuente | Texto | No | De dónde viene o a dónde va |

---

## Grupos Musculares (Leonidas)

Lista completa de grupos musculares seleccionables:

```
Pecho          Espalda alta    Espalda baja
Hombros        Bíceps          Tríceps
Abdomen        Glúteos         Cuádriceps
Femorales      Pantorrillas    Antebrazos
Cuello         Core completo   Cuerpo completo
```

---

## Reglas Estrictas de Leonidas

### Asignación Automática de Ejercicios
En Leonidas **el usuario no elige qué músculo entrenar**. El sistema asigna automáticamente el grupo muscular del día basándose en:
- Las reglas de secuencia prohibida (ver tabla abajo)
- Los tiempos de descanso mínimos de cada grupo
- La restricción por día de la semana
- La conveniencia comparativa: entre todos los grupos disponibles, el sistema selecciona el que es más conveniente para ese día según el historial reciente

El usuario **únicamente puede marcar si realizó o no la sesión asignada**. No puede modificar el grupo asignado — el sistema garantiza que la selección cumple todas las reglas.

Ejemplo: si el lunes se entrenó pecho y las reglas dicen que mañana es más conveniente abdomen que otros grupos disponibles, el martes el sistema asigna abdomen automáticamente.

### Secuencias Musculares Prohibidas
El siguiente músculo **no puede trabajarse** el mismo día ni el día siguiente al músculo anterior:

| Músculo Anterior | Músculo Prohibido Siguiente |
|-----------------|----------------------------|
| Tríceps | Espalda alta |
| Espalda alta | Tríceps |
| Pecho | Hombros |
| Hombros | Pecho |
| Bíceps | Espalda alta |
| Cuádriceps | Femorales |
| Femorales | Cuádriceps |

### Tiempos de Descanso Muscular (mismo músculo)
| Grupo Muscular | Horas Mínimas de Descanso |
|---------------|--------------------------|
| Pecho | 48h |
| Espalda alta | 48h |
| Espalda baja | 72h |
| Hombros | 48h |
| Bíceps | 48h |
| Tríceps | 48h |
| Abdomen / Core | 24h |
| Glúteos | 48h |
| Cuádriceps | 48h |
| Femorales | 48h |
| Pantorrillas | 24h |
| Cuerpo completo | 72h |

### Restricciones por Día de la Semana
| Día | Restricción |
|-----|-------------|
| Sábado | Solo se permiten: Trote y Barras |
| Domingo | Sin restricciones adicionales |
| Lun–Vie | Sin restricciones adicionales |

### Manejo de Violaciones de Regla
Cuando el usuario intenta registrar una actividad que viola una regla de Leonidas:
1. Se bloquea el registro
2. Se muestra mensaje claro: "No puedes entrenar [grupo] — necesita [X]h más de descanso"
3. Se sugiere un grupo muscular alternativo disponible
4. El usuario puede ver el calendario de disponibilidad muscular

---

## Validación de Registro

### Orden de Validaciones
1. Campos requeridos completos
2. Duración dentro de límites (1 min ≤ duración ≤ 1440 min)
3. Fecha dentro del rango permitido (ahora ±24h)
4. Si área física: validar secuencia muscular
5. Si área física: validar día de la semana
6. Si área física: validar tiempo de descanso muscular
7. Calcular XP base
8. Aplicar bonus de racha
9. Aplicar bonus de horario
10. Validar límite diario del área
11. Si excede límite: registrar actividad con XP = 0 (la actividad queda en historial sin XP)

---

## Pantalla de Actividades (Mobile)

### Estructura
- Header: "Actividades" (Cinzel 26px) + botón filtro de fecha (ícono calendario)
- Tabs de filtro: **Todas / Físicas / Económicas / Rutinas** (pill selector con gradiente púrpura activo)
- Agrupación por día: "Hoy, 15 de junio" con contador X/Y actividades
- Lista de ActivityRow cards
- Botón flotante "Agregar actividad" al final de la lista
- Resúmenes de días anteriores en cards colapsadas

### ActivityRow
- Ícono del tipo en card 44x44px con color del área
- Nombre del tipo (15px, semibold)
- Hora registrada + duración
- XP ganado en color del área (dorado si superó límite = 0 XP en gris)

### Formulario de Registro (Modal / Bottom Sheet)
- Selector de tipo con iconos en grid 4x2
- Duración con +/- buttons y campo numérico
- Campos adicionales según tipo (slide-in animation)
- Preview del XP a ganar (actualiza en tiempo real mientras el usuario llena el form)
- Botón "Registrar" → XP burst animation

---

## Base de Datos

```sql
CREATE TABLE actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Clasificación
  tipo VARCHAR(50) NOT NULL,
  area VARCHAR(20) NOT NULL,  -- 'rutinarias', 'fisicas', 'economicas'
  
  -- Tiempo
  duracion_minutos INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- XP
  xp_base INTEGER NOT NULL DEFAULT 0,
  xp_generado INTEGER NOT NULL DEFAULT 0,
  bonus_racha DECIMAL(3,2) DEFAULT 1.0,
  bonus_horario DECIMAL(3,2) DEFAULT 1.0,
  limite_excedido BOOLEAN DEFAULT FALSE,
  
  -- Campos específicos (JSONB para flexibilidad)
  metadata JSONB DEFAULT '{}',
  -- Ejemplo para físicas: {"grupo_muscular": "pecho", "repeticiones": 50}
  -- Ejemplo para económica: {"monto": 150000, "moneda": "COP", "destino": "Arriendo"}
  
  -- Descripción libre
  descripcion TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índices optimizados para queries frecuentes
CREATE INDEX idx_actividades_usuario_fecha ON actividades(usuario_id, timestamp DESC);
CREATE INDEX idx_actividades_usuario_area ON actividades(usuario_id, area, timestamp DESC);
CREATE INDEX idx_actividades_tipo ON actividades(usuario_id, tipo);
-- Para validaciones de Leonidas (buscar último ejercicio por grupo muscular)
CREATE INDEX idx_actividades_muscular ON actividades USING GIN (metadata);
```
