# NEURAX — Notificaciones e Integración IA

---

## Sistema de Notificaciones

### Stack
- **Mobile**: Expo Notifications → Firebase Cloud Messaging (FCM) → dispositivo
- **Web**: Web Push API (browser notifications)
- **Dispatch**: BullMQ job en el backend (procesamiento async, no bloquea la API)

### Tipos de Notificaciones

| Tipo | Trigger | Prioridad | Canal |
|------|---------|-----------|-------|
| Recordatorio diario | Hora configurable por usuario | Normal | Push + in-app |
| Racha en riesgo | 20:00 si no hay actividad del día | Alta | Push |
| Logro desbloqueado | Al momento de desbloquear | Alta | Push + in-app overlay |
| Misión Odin disponible | 06:00 todos los días | Normal | Push |
| Misión Odin completada | Al completar la misión principal | Normal | In-app |
| Cofre épico desbloqueado | Al completar todas las misiones del día | Alta | Push + in-app |
| Meta Demeter alcanzada | Fondo Soberbio o Kubera al 100% | Normal | Push + in-app |
| Fecha próxima (Cronnos) | 1h antes de un evento importante | Normal | Push |
| Entrega académica próxima | 24h antes del deadline en Prodigy | Alta | Push |
| Fecha producción Proeza | Día de una fecha de producción marcada | Normal | Push |
| Level Up | Al subir de nivel | Alta | In-app overlay (no push) |

### Configuración de Notificaciones

El usuario puede configurar:
| Ajuste | Tipo | Opciones |
|--------|------|---------|
| Hora recordatorio diario | Time picker | Cualquier hora (default: 07:00) |
| Notif. de racha en riesgo | Toggle | On/Off (default: On) |
| Notif. de Odin | Toggle | On/Off (default: On) |
| Notif. de logros | Toggle | On/Off (default: On) |
| Notif. de Demeter | Toggle | On/Off (default: On) |
| Notif. de Cronnos | Toggle | On/Off (default: On) |
| Notif. de Prodigy | Toggle | On/Off (default: On) |
| Modo No Molestar | Time range | Rango de silencio (default: 23:00–06:00) |

### Pantalla de Notificaciones (In-App)
- Accesible desde campana en el header del dashboard
- Lista cronológica de las últimas 30 notificaciones
- Cada ítem: ícono del tipo, mensaje, timestamp relativo, estado (leída/no leída)
- Swipe left para marcar como leída o eliminar
- Botón "Marcar todas como leídas"
- Las notificaciones no leídas producen un badge número en la campana

---

## Integración con IA (Claude)

### Principio de Diseño
La integración de IA en NEURAX está diseñada para ser **mínima en costo y máxima en valor**. 

Restricción presupuestaria: el usuario tiene el **Plan Pro de Claude** (claude.ai), no necesariamente acceso a la API de pago. Por esto, la arquitectura ofrece dos modos:

| Modo | Descripción | Costo |
|------|-------------|-------|
| **API mínima** | Llamadas a Claude API con `claude-haiku-4-5` (modelo más económico) usando prompts ultra-compactos | ~$0.01-0.05 por uso |
| **Manual (Pro)** | El sistema genera un resumen estructurado que el usuario copia y pega en claude.ai (sin costo adicional) | $0 |

El usuario puede elegir qué modo usar en Configuración → IA.

---

### Features de IA

#### 1. Sugerencia de Logros Personalizados

**Cuándo se usa**: Usuario va a Logros → "Sugerir con IA"

**Flujo**:
1. Sistema recolecta: actividades de los últimos 7 días, racha actual, áreas frecuentes, logros ya desbloqueados
2. Comprime todo en un prompt de ~300 tokens
3. Claude genera 3 sugerencias de logros personalizados
4. Usuario revisa, acepta/modifica/rechaza

**Prompt template**:
```
Usuario NEURAX. Datos 7 días: [área:count,...]. Racha: N días. 
Logros desbloqueados: [ids]. Áreas débiles: [lista].
Sugiere 3 logros personalizados (JSON): [{nombre, descripcion, criterio_medible, xp_sugerido}]
Sin explicaciones. Solo el JSON.
```

**Estimado**: ~500 tokens por llamada (input + output)

---

#### 2. Generación de Misiones Personalizadas en Odin

**Cuándo se usa**: Odin → "Sugerir misión con IA"

**Flujo**:
1. Sistema recolecta: misiones de la última semana (completadas/falladas), áreas débiles del usuario
2. Claude genera 3 misiones personalizadas adaptadas al perfil
3. Usuario activa la que quiera

**Estimado**: ~400 tokens por llamada

---

#### 3. Resumen Narrativo de Progreso (Modo Manual)

**Cuándo se usa**: Dashboard web → "Mi resumen para Claude"

**Flujo** (sin API, compatible con Plan Pro):
1. Usuario toca botón "Exportar resumen"
2. Sistema genera texto estructurado con: XP semanal, actividades, rachas, logros, áreas débiles
3. Se copia al clipboard con un toque
4. El usuario lo pega en claude.ai y le hace preguntas libremente
5. Si quiere importar algo de vuelta (ej: una misión que Claude le sugirió): lo escribe manualmente en Odin

**Formato del resumen exportado**:
```
# Mi semana en NEURAX — [fecha]
- XP ganado: 320 XP
- Racha actual: 5 días
- Actividades: 18 (Físicas 35%, Rutinas 40%, Económicas 25%)
- Logros desbloqueados esta semana: Madrugador, Gym Warrior
- Misiones Odin completadas: 4/7 días
- Sección más usada: Leonidas
- Áreas débiles: Prodigy (0 sesiones), Demeter (2 registros)
- Meta actual: Llegar a nivel Guerrero (faltan 80 XP)
```

---

#### 4. Clasificación Automática de Videos en Dionisio

**Cuándo se usa**: Al pegar una URL en Dionisio

**Flujo (API)**:
1. El sistema extrae el título y descripción del video via Open Graph
2. Envía a Claude: `"Clasifica este video en: [lista de categorías]. Título: [X]. Desc: [Y]. Responde solo con la categoría."`
3. Claude responde con la categoría en 1-3 palabras
4. El campo de categoría se pre-rellena (el usuario puede cambiarlo)

**Estimado**: ~100 tokens por clasificación

---

### Configuración de IA en la App

Sección en Perfil → Configuración → Inteligencia Artificial:

| Ajuste | Tipo | Default |
|--------|------|---------|
| Modo IA | Selector (API / Manual) | Manual |
| API Key de Claude | Campo de texto (si modo API) | Vacío |
| Clasificación automática Dionisio | Toggle | Off |
| Sugerencias de logros | Toggle | On |
| Sugerencias de misiones | Toggle | On |

Si el usuario activa "Modo API", debe ingresar su **propia API Key de Anthropic**. Esto permite que use la API con su propio presupuesto sin que el sistema de NEURAX incurra en costos.

---

## Esquema de Base de Datos — Notificaciones

```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  data JSONB DEFAULT '{}',  -- payload para deep link al tap
  
  leida BOOLEAN DEFAULT FALSE,
  leida_at TIMESTAMPTZ,
  
  -- Estado de envío
  enviada_push BOOLEAN DEFAULT FALSE,
  enviada_push_at TIMESTAMPTZ,
  push_token TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notificaciones_config (
  usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  push_token TEXT,
  web_push_subscription JSONB,
  
  hora_recordatorio TIME DEFAULT '07:00',
  racha_en_riesgo BOOLEAN DEFAULT TRUE,
  odin_daily BOOLEAN DEFAULT TRUE,
  logros BOOLEAN DEFAULT TRUE,
  demeter BOOLEAN DEFAULT TRUE,
  cronos BOOLEAN DEFAULT TRUE,
  prodigy BOOLEAN DEFAULT TRUE,
  
  no_molestar_inicio TIME DEFAULT '23:00',
  no_molestar_fin TIME DEFAULT '06:00',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config de IA por usuario
CREATE TABLE ia_config (
  usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  modo VARCHAR(20) DEFAULT 'manual',  -- 'manual', 'api'
  anthropic_api_key_encrypted TEXT,   -- encriptada en reposo
  clasificacion_dionisio BOOLEAN DEFAULT FALSE,
  sugerencias_logros BOOLEAN DEFAULT TRUE,
  sugerencias_misiones BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, created_at DESC);
CREATE INDEX idx_notificaciones_no_leidas ON notificaciones(usuario_id, leida) WHERE leida = FALSE;
```
