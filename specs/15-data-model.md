# NEURAX — Modelo de Datos y Reglas de Negocio

## Diagrama de Entidades Principales

```
┌──────────────────────────────────────────────────────────┐
│                    USUARIOS (central)                     │
│  id · nombre · email · hashed_password                   │
│  secret_answer_hash · recovery_answer_1/2_hash          │
│  xp_total · nivel · active                               │
└────────────────────┬─────────────────────────────────────┘
                     │ 1:N
         ┌───────────┼───────────────────────────────────┐
         │           │                                   │
    ┌────▼────┐ ┌────▼──────┐  ┌──────────────┐  ┌─────▼──────┐
    │ACTIVIDAD│ │XP_EVENTS  │  │ACHIEVEMENTS  │  │RACHAS      │
    │-usuario │ │-usuario   │  │-usuario      │  │-usuario    │
    │-tipo    │ │-fuente    │  │-achievement  │  │-fecha      │
    │-area    │ │-xp_amount │  │-progreso     │  │-tiene_act  │
    │-duracion│ │-bonuses   │  │-desbloqueado │  └────────────┘
    │-xp_gen  │ └───────────┘  └──────────────┘
    │-metadata│
    └────┬────┘
         │
    ┌────▼──────────────────────────────────────────────┐
    │           RELACIONES CON SECCIONES                 │
    │                                                    │
    │  ACTIVIDAD puede originar:                         │
    │  - leonidas_sesiones (tipo=fuerza/cardio/barras/  │
    │    trote)                                          │
    │  - cronos_eventos.completado = TRUE                │
    │  - odin_misiones.progreso += 1                    │
    └───────────────────────────────────────────────────┘
```

---

## Mapa de Relaciones entre Secciones

```
DEMETER ─────────────► SOBERBIO
(fondo alcanza          (selección aleatoria
presupuesto)            de pendiente)
        │
        ▼
     CRONNOS ◄──────── PRODIGY
(agenda la visita)     (fechas de entrega
        │               y bloques de estudio)
        │
        ▼
SOBERBIO recibe
la calificación
post-visita

DIONISIO ─────────────► SOBERBIO
(video de                (agregar lugar pendiente)
restaurante)   ─────────► ODYSSEIA
               ─────────► KUBERA
               ─────────► MICHELIN
               ─────────► NEMESIS

PROEZA ───────────────► CRONNOS
(fecha de               (recordatorios de
producción)             fechas de lanzamiento)

KUBERA ───────────────► DEMETER
(producto deseado)      (crea fondo de ahorro)

LEONIDAS ─────────────► CRONNOS
(sesión planificada)    (reserva slot + verifica energía)
```

---

## Reglas de Negocio Globales

### Regla 1: Cálculo de XP
```
XP_final = floor(XP_base × bonus_racha × bonus_horario)

donde:
- XP_base: definido por tipo y duración de actividad (ver spec 05)
- bonus_racha: tabla en spec 04 (1.0 a 2.0)
- bonus_horario: 1.2 si la actividad es en horario óptimo, 1.0 en caso contrario
```

**Excepción**: Si el área ya alcanzó su límite diario de XP, `XP_final = 0`. La actividad se registra de todas formas pero sin XP.

### Regla 2: Actualización de Nivel
```
Al ganar XP:
  nuevo_nivel = calcular_nivel(usuario.xp_total + xp_ganado)
  si nuevo_nivel > usuario.nivel:
    disparar evento "level_up"
    actualizar usuario.nivel = nuevo_nivel
```

El nivel siempre se calcula desde el XP total acumulado, nunca se resta ni se baja.

### Regla 3: Gestión de Rachas
```
Cada día a las 00:00 (hora local del usuario):
  si (dia_anterior no tiene actividad):
    racha_actual = 0
  
Al registrar una actividad:
  marcar el día actual en tabla rachas (tiene_actividad = TRUE)
  recalcular racha_actual = días consecutivos desde hoy hacia atrás
```

### Regla 4: Propagación Cronnos
```
Al mover/modificar un evento en Cronnos:
  recalcular energía de TODOS los eventos posteriores ese día
  en orden cronológico
```

### Regla 5: Validación Muscular (Leonidas)
```
Al intentar registrar ejercicio con grupo X:
  
  ultima_sesion_X = última actividad con grupo X en actividades
  
  si (ahora - ultima_sesion_X < descanso_minimo[X]):
    BLOQUEAR con mensaje de tiempo restante
    sugerir alternativas disponibles
  
  ultimo_grupo = grupo de la última sesión física (ANY tipo)
  si (ultimo_grupo, X) en secuencias_prohibidas:
    BLOQUEAR si mismo día
    ADVERTIR si día siguiente
  
  si (dia_semana == SÁBADO) y (tipo NO IN ['trote', 'barras']):
    BLOQUEAR con mensaje de sábado
```

### Regla 6: Trigger Demeter → Soberbio
```
En cada registro de movimiento en Demeter:
  fondo_soberbio = calcular_saldo_fondo('experiencias', usuario_id)
  objetivo_fondo = presupuesto_actual.fondos_especiales.soberbio.objetivo
  
  si (fondo_soberbio >= objetivo_fondo AND NOT ya_notificado_este_mes):
    lugar_aleatorio = random(soberbio_lugares WHERE estado='pendiente')
    si (lugar_aleatorio existe):
      crear_notificacion('meta_demeter_alcanzada', lugar_aleatorio)
      marcar_notificado = TRUE
```

### Regla 7: Misiones Odin — Reset y Progreso
```
A las 00:00 cada día:
  generar nuevas misiones del día (principal + 3-4 secundarias)
  las misiones del día anterior no completadas quedan como 'expiradas'
  
Al registrar una actividad:
  para cada misión activa del día:
    si (actividad cumple criterio de la misión):
      misión.progreso += incremento_correspondiente
      si (misión.progreso >= misión.total):
        misión.completada = TRUE
        otorgar XP de la misión al usuario
        si (todas las misiones del día completadas):
          abrir cofre épico (XP bonus)
```

### Regla 8: Logros — Verificación Automática
```
Al registrar cualquier actividad, XP event, o cambio de nivel:
  para cada logro de sistema no desbloqueado:
    verificar si se cumple el criterio del logro
    si se cumple:
      desbloquear logro
      otorgar XP del logro
      crear notificación
      crear xp_event con fuente='achievement'
```

---

## Índices y Performance

### Queries Más Frecuentes

| Query | Índice Requerido |
|-------|-----------------|
| Actividades de un usuario en los últimos 7 días | `(usuario_id, timestamp DESC)` |
| Racha actual (días consecutivos) | `(usuario_id, fecha DESC)` |
| Última sesión por grupo muscular | GIN sobre `metadata` + `(usuario_id, tipo, timestamp)` |
| Misiones del día de un usuario | `(usuario_id, periodo_inicio, periodo_fin)` |
| Logros en progreso de un usuario | `(usuario_id, desbloqueado)` |
| XP total por período | `(usuario_id, created_at)` en xp_events |
| Eventos de Cronnos del día | `(usuario_id, inicio_at)` |

---

## Esquema Completo de Tablas

### Resumen de todas las tablas por dominio

```
CORE
├── usuarios
├── refresh_tokens
├── xp_events
├── usuario_achievements
├── rachas
├── notificaciones
├── notificaciones_config
└── ia_config

ACTIVIDADES
└── actividades

GAMIFICACIÓN
├── [usuario.xp_total, usuario.nivel — en tabla usuarios]
└── usuario_achievements

CRONOS
├── cronos_eventos
└── cronos_api_keys

ODIN
├── odin_misiones_catalogo
├── odin_misiones_usuario
└── odin_cofres

LEONIDAS
├── leonidas_sesiones
├── leonidas_ejercicios_sesion
└── leonidas_plan_semanal

DEMETER
├── demeter_movimientos
└── demeter_presupuestos

SOBERBIO
└── soberbio_lugares

DIONISIO
└── dionisio_videos

APOLO
└── apolo_peliculas

ALEJANDRÍA
└── alejandria_libros

MICHELIN
└── michelin_recetas

ODYSSEIA
└── odysseia_destinos

NEMESIS
└── nemesis_juegos

PROEZA
└── proeza_canciones

PRODIGY
├── prodigy_cursos
└── prodigy_entregas

KUBERA
└── kubera_productos
```

---

## Convenciones de API

### Rutas Base
```
/api/auth/*                     → Autenticación
/api/usuarios/:id/*             → Recursos del usuario
/api/gamification/*             → XP, niveles, logros
/api/actividades/*              → Actividades
/api/cronos/*                   → Sección Cronnos
/api/odin/*                     → Sección Odin
/api/leonidas/*                 → Sección Leonidas
/api/demeter/*                  → Sección Demeter
/api/soberbio/*                 → Sección Soberbio
/api/dionisio/*                 → Sección Dionisio
/api/apolo/*                    → Sección Apolo
/api/alejandria/*               → Sección Alejandría
/api/michelin/*                 → Sección Michelin
/api/odysseia/*                 → Sección Odysseia
/api/nemesis/*                  → Sección Némesis
/api/proeza/*                   → Sección Proeza
/api/prodigy/*                  → Sección Prodigy
/api/kubera/*                   → Sección Kubera
/api/notifications/*            → Notificaciones
/api/ia/*                       → Features de IA
```

### Formato de Respuesta Estándar
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-06-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Formato de Error Estándar
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción legible del error",
    "details": { ... }
  }
}
```

### Paginación (listas largas)
```
GET /api/actividades?page=1&limit=20&sort=timestamp&order=desc

Respuesta:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

---

## Migraciones (Alembic / Drizzle)

- Las migraciones se versionan con timestamp: `YYYYMMDD_HHMMSS_descripcion.sql`
- Nunca hacer DROP en una migración sin un rollback explícito
- Las migraciones son reversibles: siempre incluir `up()` y `down()`
- Los datos de seed (catálogo de misiones de Odin, catálogo de ejercicios de Leonidas) van en migraciones separadas de seed

### Orden de Ejecución de Migraciones Iniciales
1. `usuarios` y `refresh_tokens`
2. `actividades`
3. `xp_events`, `usuario_achievements`, `rachas`
4. `notificaciones`, `notificaciones_config`, `ia_config`
5. `cronos_eventos`, `cronos_api_keys`
6. `odin_misiones_catalogo` + seed de misiones
7. `odin_misiones_usuario`, `odin_cofres`
8. `leonidas_*` (sesiones, ejercicios, plan)
9. `demeter_*`
10. `soberbio_*`, `dionisio_*`
11. `apolo_*`, `alejandria_*`, `michelin_*`, `odysseia_*`
12. `nemesis_*`, `proeza_*`, `prodigy_*`, `kubera_*`
