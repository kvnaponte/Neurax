# NEURAX — Integraciones y Ecosistema

## Mapa de Integraciones

Este documento describe todos los flujos automáticos entre secciones y cómo el ecosistema de NEURAX funciona como un único cerebro conectado.

---

## Integración 1: Prodigy → Cronnos (Horarios de Estudio)

### Trigger
El usuario define en Prodigy:
- Un curso con fecha límite
- Sus horas disponibles semanales para estudiar

### Flujo
```
1. Usuario crea curso en Prodigy con fecha_limite y horas_totales
2. Usuario va a Cronnos y activa "Generar horario para Prodigy"
3. Sistema calcula:
   - Días disponibles hasta fecha_limite
   - Horas restantes por estudiar (horas_totales - horas_estudiadas)
   - Slots disponibles en Cronnos (sin conflictos)
4. Sistema propone bloques de estudio en Cronnos
5. Usuario revisa y aprueba (puede ajustar individualmente)
6. Los bloques se crean como cronos_eventos tipo 'estudio'
   vinculados a prodigy_cursos.id
```

### Condición de Margen
El sistema siempre deja 3 días de margen antes del deadline para revisión final.

### Actualización Dinámica
Si el usuario completa horas de estudio reales antes de lo planificado, los bloques restantes en Cronnos se actualizan (reducen o eliminan según el progreso).

---

## Integración 2: Proeza → Cronnos (Fechas de Producción)

### Trigger
El usuario define en Proeza una canción con `fecha_objetivo_lanzamiento` o `fecha_objetivo_mezcla`.

### Flujo
```
1. Al guardar la fecha en Proeza:
   Sistema crea automáticamente en Cronnos:
   - Evento recordatorio "Mezcla: [Canción]" el día de la fecha objetivo
   - Evento "Lanzamiento: [Canción]" el día del lanzamiento
   - Serie de recordatorios 7 días, 3 días y 1 día antes
2. El usuario puede desactivar estos recordatorios en Cronnos si no los quiere
```

---

## Integración 3: Demeter → Soberbio → Cronnos (Visita de Experiencia)

### Trigger
El fondo "Experiencias" de Demeter alcanza el monto objetivo.

### Flujo Completo
```
1. DEMETER: fondo_soberbio.acumulado >= fondo_soberbio.objetivo
2. Sistema:
   a. Selecciona aleatoriamente un lugar de soberbio_lugares WHERE estado='pendiente'
   b. Si no hay pendientes: notificación "¡Agrega lugares a Soberbio primero!"
   c. Si hay pendientes: envía notificación push con el lugar seleccionado
3. Notificación: "¡Ya tienes presupuesto para [Nombre]! ¿Cuándo vas a ir?"
4. Usuario toca la notificación:
   → Abre flujo de agendamiento
5. CRONNOS: propone 3 opciones de fecha (próximos 3 fines de semana)
   - Verifica energía > 50% en el horario propuesto
   - Verifica que no haya conflictos
6. Usuario selecciona fecha
7. Cronnos crea evento "🍽️ Visita: [Nombre]" con duración estimada de 2h
8. POST-VISITA: Al marcar el evento como completado en Cronnos:
   → Soberbio pregunta: "¿Cómo fue la experiencia en [Nombre]?"
   → Se abre el formulario de calificación post-visita
9. Al calificar:
   → soberbio_lugar.estado = 'visitado'
   → demeter: reset del fondo de experiencias
   → XP otorgado por la actividad de visita
```

---

## Integración 4: Dionisio → Otras Secciones (Clasificación y Accionamiento)

### Trigger
El usuario agrega un video a Dionisio y toca "Accionar".

### Matriz de Accionamiento
| Categoría en Dionisio | Destino | Datos Pre-llenados |
|----------------------|---------|-------------------|
| Lugares para visitar (restaurante) | Soberbio (nuevo lugar) | nombre, tipo_cocina, fuente='dionisio' |
| Lugares para visitar (turismo) | Odysseia (nuevo destino) | nombre, país, fuente='dionisio' |
| Productos deseados | Kubera (nuevo producto) | nombre, enlace (URL del video), fuente='dionisio' |
| Recetas | Michelin (nueva receta) | nombre, url_referencia |
| Juegos | Némesis (nuevo juego) | nombre, fuente='dionisio' |
| Cosas por aprender | Prodigy (nuevo curso/tema) | nombre |
| Música | Proeza (exploración musical) | nombre |
| Ejercicios | Leonidas (referencia) | nota con el ejercicio |

### Trazabilidad
El objeto creado en la sección destino guarda `dionisio_video_id` para mantener la trazabilidad del origen.

---

## Integración 5: Kubera → Demeter (Fondo de Ahorro)

### Trigger
El usuario activa "Comenzar a ahorrar" en un producto de Kubera.

### Flujo
```
1. Usuario activa ahorro para producto_X con precio = $500.000
2. Sistema en Demeter:
   a. Crea un fondo especial: "Kubera: [Nombre Producto]"
   b. Objetivo: $500.000
   c. Sugiere al usuario asignar un % de sus ingresos a este fondo
3. El fondo se muestra en Demeter > Fondos Especiales
4. Con cada ingreso registrado, el usuario puede asignar parte al fondo
5. Al alcanzar el objetivo:
   a. Notificación: "¡Ya puedes comprar [Producto]! Has ahorrado $500.000"
   b. kubera_producto.estado = 'listo_para_adquirir'
6. El usuario marca como "Adquirido":
   a. kubera_producto.estado = 'adquirido'
   b. Registra precio real pagado
   c. El fondo en Demeter se cierra
```

---

## Integración 6: Leonidas → Cronnos (Planificación de Entrenamientos)

### Trigger
El usuario activa la integración en Leonidas.

### Flujo
```
1. Usuario define su plan semanal en Leonidas (qué días y qué grupos)
2. Al activar "Sincronizar con Cronnos":
   Sistema busca slots disponibles en la mañana (06:00-10:00) de cada día planificado
   y crea eventos de entrenamiento recurrentes
3. Los eventos son de tipo 'fisico' vinculados al tipo de entrenamiento del día
4. Antes de crear, verifica:
   - No hay conflictos con otros eventos
   - La energía estimada lo permite
5. Al completar el evento en Cronnos:
   → Redirige al formulario de registro de sesión en Leonidas
```

---

## Integración 7: Odin → Actividades (Verificación de Misiones)

### Trigger
Cada vez que se registra una actividad.

### Flujo
```
Al crear una actividad:
  para cada misión activa (no completada) del usuario hoy:
    evaluar si la actividad cumple el criterio de la misión
    
    Criterios posibles:
    - 'actividades_count': si tipo de actividad coincide, progreso += 1
    - 'minutos_tipo': si tipo coincide, progreso += duracion_minutos
    - 'areas_count': si area coincide, marcar area como cubierta
    - 'cronos_puntual': si actividad fue de Cronnos y fue puntual
    
    si progreso >= total:
      completar misión
      otorgar XP
      verificar si todas las misiones del día están completas → cofre épico
```

---

## Integración 8: Todas las Secciones → XP Global

### Principio
Toda acción en cualquier sección que genere XP pasa por el mismo pipeline:

```
Acción completada (en cualquier sección)
    │
    ▼
Crear xp_event en tabla xp_events
    │
    ▼
usuario.xp_total += xp_event.xp_amount
    │
    ▼
Recalcular usuario.nivel
    │
    ├── Si subió de nivel → evento 'level_up' → overlay animado
    └── Si no → actualizar contador de XP en UI (animación de conteo)
    │
    ▼
Verificar logros que dependen del XP total
    │
    └── Si algún logro se cumple → desbloquearlo → otorgar su XP → (recursivo)
```

---

## Integración 9: Agente IA Externo → Cronnos/Demeter (API)

### Acceso vía API Key
El usuario puede generar API Keys en Configuración → Integraciones para que un agente externo (Claude u otro) interactúe con su Cronnos y Demeter.

### Endpoints Expuestos al Agente
```
# Cronnos
GET  /api/external/cronos/events?date=YYYY-MM-DD   → listar eventos del día
GET  /api/external/cronos/availability             → slots libres
POST /api/external/cronos/events                   → crear evento
PUT  /api/external/cronos/events/:id               → mover/editar evento
DELETE /api/external/cronos/events/:id             → eliminar evento

# Demeter
GET  /api/external/demeter/balance                 → estado del presupuesto
POST /api/external/demeter/movimientos             → registrar movimiento
GET  /api/external/demeter/categorias              → saldo por categoría
```

### Autenticación del Agente
```
Authorization: Bearer NEURAX_AGENT_{key_hash}
```

Las API Keys del agente son **diferentes** a los JWT de usuario y tienen permisos granulares configurables.

---

## Estado Global del Ecosistema

### Eventos de Sistema (WebSocket)

El backend emite eventos via Socket.IO cuando ocurren cambios que todas las pantallas necesitan saber:

| Evento | Payload | Cuándo |
|--------|---------|--------|
| `xp:updated` | `{xp_total, nivel, xp_delta}` | Al ganar XP |
| `level:up` | `{nivel_anterior, nivel_nuevo}` | Al subir de nivel |
| `achievement:unlocked` | `{achievement_id, xp}` | Al desbloquear logro |
| `streak:updated` | `{racha_actual, mejor_racha}` | Al actualizar racha |
| `mission:completed` | `{mision_id, xp}` | Al completar misión Odin |
| `cronos:event_updated` | `{evento_id}` | Al modificar Cronnos |
| `notification:new` | `{notificacion_id, tipo}` | Al crear notificación |

Los clientes (mobile y web) escuchan estos eventos y actualizan el estado local (Zustand) inmediatamente sin necesidad de re-fetch.
