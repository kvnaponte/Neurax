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

## Integración con IA — Estrategia CLI

### Principio de Diseño
**No se usa ninguna API de pago** (ni Anthropic ni cualquier otro proveedor). NEURAX automatiza la interacción con IA a través de la CLI de Claude Code, sin costo por token. Ver spec 02-tech-stack para la arquitectura técnica completa.

El sistema aprende sobre el usuario **manteniendo archivos de memoria** que se actualizan en cada interacción y se leen como contexto en la siguiente.

---

### Features de IA

#### 1. Sugerencia de Logros Personalizados

**Cuándo se usa**: Usuario va a Logros → "Sugerir con IA"

**Flujo**:
1. Sistema recolecta: actividades de los últimos 7 días, racha actual, áreas frecuentes, logros ya desbloqueados
2. Genera archivo de prompt estructurado + carga archivos de memoria del usuario
3. Invoca CLI de IA → devuelve 3 sugerencias de logros en JSON
4. Usuario revisa, acepta/modifica/rechaza
5. Sistema actualiza archivos de memoria con la decisión del usuario

**Formato de respuesta esperado** (JSON):
```json
[{"nombre": "...", "descripcion": "...", "criterio_medible": "...", "xp_sugerido": 50}]
```

---

#### 2. Generación de Misiones Personalizadas en Odin

**Cuándo se usa**: Odin → "Sugerir misión con IA"

**Flujo**:
1. Sistema recolecta: misiones de la última semana (completadas/falladas), áreas débiles
2. Invoca CLI de IA con contexto + memoria → devuelve 3 misiones personalizadas en JSON
3. Usuario activa la que quiera
4. Sistema actualiza memoria con la misión elegida

---

#### 3. Resumen de Progreso (Exportable)

**Cuándo se usa**: Dashboard → "Exportar resumen"

**Flujo**:
1. Sistema genera texto estructurado con: XP semanal, actividades, rachas, logros, áreas débiles
2. Se copia al clipboard con un toque
3. El usuario puede usarlo libremente (pegarlo donde quiera)

**Formato del resumen exportado**:
```
# Mi semana en NEURAX — [fecha]
- XP ganado: 320 XP | Racha actual: 5 días
- Actividades: 18 (Físicas 35%, Rutinas 40%, Económicas 25%)
- Logros desbloqueados: Madrugador, Gym Warrior
- Misiones Odin completadas: 4/7 días
- Sección más usada: Leonidas
- Áreas débiles: Prodigy (0 sesiones), Demeter (2 registros)
- Meta: Nivel Guerrero (faltan 42,830 XP)
```

---

#### 4. Clasificación Automática de Videos en Dionisio

**Cuándo se usa**: Al procesar un video en el pipeline automático de TikTok

**Flujo**:
1. El sistema obtiene la transcripción del video (texto extraído del audio)
2. Invoca CLI de IA con la transcripción → responde con la categoría en JSON
3. El sistema enruta el video a la sección correspondiente automáticamente

---

### Configuración de IA en la App

Sección en Perfil → Configuración → Inteligencia Artificial:

| Ajuste | Tipo | Default |
|--------|------|---------|
| Clasificación automática Dionisio | Toggle | On |
| Sugerencias de logros | Toggle | On |
| Sugerencias de misiones | Toggle | On |

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
  clasificacion_dionisio BOOLEAN DEFAULT TRUE,
  sugerencias_logros BOOLEAN DEFAULT TRUE,
  sugerencias_misiones BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, created_at DESC);
CREATE INDEX idx_notificaciones_no_leidas ON notificaciones(usuario_id, leida) WHERE leida = FALSE;
```
