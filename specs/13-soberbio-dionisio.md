# NEURAX — Soberbio y Dionisio

---

## Soberbio (Experiencias Gastronómicas)

### Propósito
Gestionar la visita a restaurantes y lugares de comida. Incluye lista de lugares pendientes, calificación post-visita y conexión con el ecosistema Demeter/Dionisio/Cronnos.

### Pantalla Principal de Soberbio
```
┌─────────────────────────────────────────┐
│  SOBERBIO                  [+ Agregar]  │
│  "El placer de lo exquisito"            │
├─────────────────────────────────────────┤
│  [Pendientes][Visitados][Top]           │
├─────────────────────────────────────────┤
│  PENDIENTES (12)                        │
│  ┌─────────────────────────────────────┐│
│  │ 🍽️ La Candelaria                   ││
│  │ Colombiana · Chapinero              ││
│  │ ★★★★☆ (estimado)   💰 ~$85k       ││
│  │ [Fuente: Dionisio 📱]              ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ 🍣 Tanaka                           ││
│  │ Japonesa · Usaquén                  ││
│  │ Por agendar          💰 ~$120k     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  VISITADOS (8)                          │
│  [Vista compacta de tarjetas]           │
└─────────────────────────────────────────┘
```

### Registro de Experiencia
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Nombre del restaurante/lugar |
| Tipo de cocina | Texto | Colombiana, Italiana, Japonesa, etc. |
| Ubicación | Texto | Barrio/Ciudad |
| Estado | Enum | Pendiente / Visitado |
| Precio estimado | Monto | Costo estimado de la visita |
| Fuente | Enum | Manual / Dionisio / Recomendación |
| Fecha de visita | Date | Cuando fue (si visitado) |

### Sistema de Calificación Post-Visita
Se activa al marcar un lugar como "Visitado". El sistema pregunta:
"¿Cómo fue la experiencia?"

Criterios (1-5 estrellas cada uno):
| Criterio | Descripción |
|----------|-------------|
| Calidad de ingredientes | Frescura, calidad de los insumos |
| Técnica culinaria | Preparación, cocción, presentación |
| Creatividad / Concepto | Originalidad, propuesta gastronómica |
| Servicio | Atención, amabilidad, eficiencia |
| Ambiente | Decoración, música, comodidad |

- **Calificación final**: promedio de los 5 criterios (sobre 5)
- Después de calificar: la tarjeta se mueve a "Visitados" y se muestra en el home de Soberbio
- Reseña opcional (texto libre)

### Flujo Automático Demeter → Soberbio → Cronnos

1. **Demeter detecta**: el fondo "Experiencias" alcanza el presupuesto objetivo
2. **Sistema selecciona**: aleatoriamente un lugar de la lista "Pendientes" de Soberbio
3. **Notificación**: "¡Tienes presupuesto para ir a [Nombre]! ¿Cuándo vas?"
4. **Cronnos propone**: 3 opciones de fecha (próximos fines de semana con energía > 50%)
5. **Usuario confirma**: fecha → el evento se crea en Cronnos
6. **Post-visita**: Cronnos cierra el evento → sistema pregunta por la calificación

---

## Dionisio (Videos Guardados de Redes)

### Propósito
Gestionar videos guardados de TikTok, Instagram y Facebook, clasificarlos por categoría de interés y conectar con otras secciones del ecosistema.

### Categorías de Videos
| Categoría | Conexión con sección |
|-----------|---------------------|
| **Lugares para visitar** | → Soberbio (restaurantes) / Odysseia (turismo) |
| **Productos deseados** | → Kubera |
| **Cosas por aprender** | → Prodigy / Alejandría |
| **Juegos** | → Némesis |
| **Recetas** | → Michelin |
| **Música** | → Proeza |
| **Ejercicios** | → Leonidas |
| **Otro / General** | Sin conexión automática |

### Registro de Video

#### Método Principal: Pipeline Automático TikTok
El flujo automático es el método principal de Dionisio:

1. **Trigger**: el usuario guarda un video en TikTok (desde la app de TikTok)
2. **Descarga**: el sistema detecta el video guardado y lo descarga automáticamente via módulo de descarga
3. **Conversión**: el módulo de conversión transforma el video a audio
4. **Transcripción**: el audio se convierte a texto
5. **Clasificación**: basándose en el texto transcrito, el sistema lo envía automáticamente a la sección correspondiente:
   - Menciona un restaurante/lugar de comida → Soberbio
   - Menciona un destino turístico → Odysseia
   - Es una receta → Michelin
   - Es un juego → Némesis
   - Es música → Proeza
   - Es un producto → Kubera
   - Es ejercicio → Leonidas
6. **Descarte**: si el video no contiene texto (solo música o efectos) → se descarta automáticamente
7. **Limpieza**: una vez procesado correctamente → el video se elimina de los "Guardados" de TikTok

Si el pipeline no es técnicamente posible (restricciones de TikTok, permisos, etc.), se acepta evaluar alternativas técnicas.

**Hoja de ruta de redes:**
- V1: TikTok (pipeline principal)
- V2: Facebook e Instagram (mismo pipeline, si se puede implementar desde V1 incluirlos directamente)

#### Método Manual (fallback)
1. Usuario copia la URL del video desde la app de la red social
2. Pega en Dionisio → "Agregar video"
3. El sistema extrae metadata via Open Graph (título, thumbnail, fuente)
4. El usuario selecciona la categoría y destino manualmente

### Campos de un Video
| Campo | Tipo | Descripción |
|-------|------|-------------|
| URL | Text | URL original del video |
| Título | Texto | Extraído o editado por el usuario |
| Thumbnail | URL | Imagen de preview |
| Fuente | Enum | TikTok / Instagram / Facebook / Otro |
| Categoría | Selector | Ver tabla de categorías |
| Subcategoría | Texto libre | Más específico dentro de la categoría |
| Nota personal | Texto | Contexto del usuario |
| Estado | Enum | Guardado / Revisado / Accionado / Archivado |
| Conexión | Referencia | Link a objeto en otra sección (si aplica) |
| Fecha guardado | DateTime | Cuando se agregó |

### Flujo de "Accionar" un Video
En el pipeline automático (TikTok), el video ya llega clasificado y la acción ocurre sin intervención del usuario.

Para videos en método manual o corrección de clasificación automática:
1. El usuario toca "Accionar" / "Re-clasificar" en el video
2. Sistema muestra opciones según categoría detectada:
   - "Lugares → Añadir a Soberbio" / "Añadir a Odysseia"
   - "Productos → Añadir a Kubera"
   - "Recetas → Añadir a Michelin"
   - etc.
3. Usuario selecciona destino → se crea automáticamente el registro en la sección destino
4. El video queda en estado "Accionado" con badge de la sección destino

### Vista Principal
- Tabs: Todos / Por categoría
- Cards con thumbnail + título + fuente (logo de red social) + categoría badge
- Filtro de estado (Guardado / Revisado / Accionado / Archivado)
- Botón "Importar video" (abre input de URL)

---

## Némesis (Videojuegos)

### Propósito
Llevar el historial y estado de videojuegos: pendientes por jugar, en progreso, completados, y calificaciones.

### Estados de un Juego
```
Por comprar → Por jugar → Jugando → Completado → Calificado
```

### Registro de Juego
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Nombre del juego |
| Plataforma | Selector | PC/PS5/Xbox/Switch/Mobile/Otro |
| Género | Texto | RPG/Acción/Estrategia/etc. |
| Estado | Enum | Ver estados arriba |
| Fecha inicio | Date | Cuando empezó a jugarlo |
| Fecha completado | Date | Cuando lo terminó |
| Horas jugadas | Número | Tiempo total de juego |
| Precio | Monto | Costo del juego |
| Cover | URL/Imagen | Portada del juego |

### Sistema de Calificación (solo si Completado)
Criterios (puntuación 1-10 cada uno):
| Criterio | Descripción |
|----------|-------------|
| Historia | Narrativa, personajes, mundo |
| Jugabilidad | Mecánicas, controles, loop de gameplay |
| Gráficos | Diseño visual, arte, rendimiento |
| Música | Soundtrack, efectos de sonido, ambientación |
| Rejugabilidad | Valor de repetición, contenido post-historia |
| Dificultad | Balance de desafío vs accesibilidad |

- **Calificación final**: promedio de los 6 criterios (sobre 10)

### Estadísticas de Némesis
- Total de juegos por estado
- Horas totales jugadas (lifetime)
- Juego con mejor calificación
- Gasto total en juegos
- Plataforma favorita (por horas jugadas)

---

## Base de Datos

```sql
-- Soberbio
CREATE TABLE soberbio_lugares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  tipo_cocina VARCHAR(100),
  ubicacion VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'pendiente',
  precio_estimado DECIMAL(10,2),
  fuente VARCHAR(30) DEFAULT 'manual',  -- 'manual', 'dionisio', 'recomendacion'
  -- sin fotos_urls ni dionisio_video_id
  fecha_visita DATE,
  calificaciones JSONB,
  -- {"ingredientes": 4, "tecnica": 5, "creatividad": 3, "servicio": 4, "ambiente": 5}
  calificacion_final DECIMAL(3,1),
  resena TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dionisio
CREATE TABLE dionisio_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  titulo VARCHAR(300),
  thumbnail_url TEXT,
  fuente VARCHAR(30) NOT NULL,  -- 'tiktok', 'instagram', 'facebook', 'otro'
  categoria VARCHAR(50),
  subcategoria VARCHAR(100),
  nota TEXT,
  estado VARCHAR(20) DEFAULT 'guardado',  -- 'guardado','procesando','accionado','archivado','descartado'
  
  -- Pipeline automático
  transcripcion TEXT,           -- texto extraído del audio del video
  pipeline_estado VARCHAR(30),  -- 'pendiente','descargando','convirtiendo','transcribiendo','clasificando','completado','error'
  pipeline_error TEXT,          -- mensaje de error si falla el pipeline
  
  -- Conexión a otras secciones
  seccion_destino VARCHAR(30),
  seccion_ref_id UUID,
  
  fecha_guardado TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dionisio_usuario_cat ON dionisio_videos(usuario_id, categoria, estado);
CREATE INDEX idx_dionisio_pipeline ON dionisio_videos(usuario_id, pipeline_estado) WHERE pipeline_estado NOT IN ('completado', 'error');

-- Némesis
CREATE TABLE nemesis_juegos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  plataforma VARCHAR(50),
  genero VARCHAR(100),
  estado VARCHAR(30) DEFAULT 'por_jugar',
  fecha_inicio DATE,
  fecha_completado DATE,
  horas_jugadas INTEGER DEFAULT 0,
  precio DECIMAL(10,2),
  cover_url TEXT,
  calificaciones JSONB,
  -- {"historia": 8, "jugabilidad": 9, "graficos": 7, "musica": 8, "rejugabilidad": 6, "dificultad": 7}
  calificacion_final DECIMAL(4,2),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
