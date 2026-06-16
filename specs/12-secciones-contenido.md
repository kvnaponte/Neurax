# NEURAX — Secciones de Contenido

## Apolo (Películas)

### Propósito
Gestionar el historial de películas vistas, las pendientes por ver y las calificaciones cinematográficas.

### Estética
Apolo tiene una ambientación de **cine antiguo / cine clásico**: tipografía serif dorada sobre fondos oscuros con textura de película, bordes con efecto de fotograma de celuloide, partículas de polvo animadas, y transiciones con efecto de proyector antiguo (fundido en negro con parpadeo). El objetivo es evocar la magia del cine de sala de los años 40-60.

### Pantalla Principal
- Header: "APOLO" en estilo marquesina de cine + filtro Por Ver / Vistas / Todas
- **Top 5**: Las 5 películas con mejor calificación en card horizontal con poster
- **Pendientes**: Lista de películas por ver
- **Recientes**: Películas calificadas recientemente
- **Nivel del usuario**: badge con nivel cinéfilo actual (ver Sistema de Niveles de Usuario abajo)

### Registro de Película
| Campo | Nombre | Descripción |
|-------|--------|-------------|
| Year | Año | Año de estreno |
| Movie | Película | Título de la película |
| Director | Director | Director principal |
| Country | País | País de origen |
| Producer | Productor | Productora o productor principal |
| Distributed | Distribuidora | Empresa distribuidora |
| Genre | Género | Género cinematográfico |
| Rating | Calificación | Puntuación del usuario (0.0–5.0) — ingresada manualmente |
| Stars | Estrellas | Calculado: visualización en estrellas basada en Rating |
| Category | Categoría | Calculado: categoría de calidad basada en Rating |

### Sistema de Calificación (solo si estado = Vista)

El usuario ingresa un **Rating** numérico (0.0 a 5.0). El sistema calcula automáticamente Stars y Category:

| Rating | Stars | Category |
|--------|-------|----------|
| 4.5 – 5.0 | ★★★★★ | DIAMOND |
| 4.0 – 4.4 | ★★★★☆ | GOLD |
| 3.5 – 3.9 | ★★★½☆ | PLATINUM |
| 3.0 – 3.4 | ★★★☆☆ | GOOD |
| 2.0 – 2.9 | ★★☆☆☆ | ACEPTABLE |
| 0.0 – 1.9 | ★☆☆☆☆ | BAD |

- El badge de Category se muestra en la tarjeta de la película con color propio (DIAMOND=cyan, GOLD=dorado, PLATINUM=plateado, GOOD=verde, ACEPTABLE=naranja, BAD=rojo)
- Top 5 se ordena por Rating descendente

### Sistema de Niveles de Usuario (Cinéfilo)

El usuario acumula niveles dentro de Apolo según la cantidad de películas vistas:

| Nivel | Nombre | Películas vistas |
|-------|--------|-----------------|
| 1 | NOVATO | 0 – 5 |
| 2 | INTERESADO | 6 – 20 |
| 3 | EMPODERADO | 21 – 60 |
| 4 | SOBERBIO | 61 – 150 |
| 5 | ERUDITO | 151 – 400 |
| 6 | DESPIERTO | 401 – 999 |
| 7 | ILUMINADO | 1,000+ |

El nivel de Apolo es independiente del nivel de XP global de NEURAX. Al subir de nivel cinéfilo: animación de proyector + badge nuevo.

---

## Alejandría (Libros)

### Propósito
Control de libros leídos y pendientes, con calificación literaria y seguimiento de lectura.

### Registro de Libro
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Título | Texto | Nombre del libro |
| Autor | Texto | Nombre del autor |
| Género | Selector | Ficción/No ficción/Fantasía/Historia/Autoayuda/Otro |
| Estado | Enum | Pendiente / Leyendo / Terminado |
| Páginas totales | Número | Opcional |
| Páginas leídas | Número | Para tracking de progreso |
| Fecha inicio | Date | Cuando empezó |
| Fecha fin | Date | Cuando terminó |
| Cover | URL/Imagen | Opcional |

### Sistema de Calificación (solo si Terminado)
Criterios (puntuación 1-5 estrellas cada uno):
| Criterio | Descripción |
|----------|-------------|
| Escritura | Estilo, prosa, calidad literaria |
| Trama | Historia, ritmo, estructura narrativa |
| Personajes | Profundidad, desarrollo, credibilidad |
| Ritmo | Velocidad, pacing, engancha o aburre |
| Impacto Personal | Qué tanto cambió o aportó al lector |

- **Calificación final**: promedio de los 5 criterios (sobre 5)
- Reseña opcional (texto libre) para notas personales

---

## Michelin (Recetas)

### Propósito
Base de datos de recetas pendientes y cocinadas, con sistema de dificultad y sugerencias basadas en disponibilidad de ingredientes.

### Registro de Receta
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Nombre de la receta |
| Tipo | Selector | Desayuno/Almuerzo/Cena/Snack/Postre |
| Origen | Texto | Cuisine/País de origen |
| Dificultad | 1-5 | 1=Muy fácil, 5=Chef profesional |
| Tiempo estimado | Minutos | Tiempo de preparación + cocción |
| Ingredientes | Lista | Texto libre por ingrediente |
| Instrucciones | Texto / Pasos | Opcional |
| Estado | Enum | Pendiente / Cocinada |
| Veces cocinada | Número | Contador |
| URL de referencia | URL | Opcional (receta encontrada online) |
| Foto | Imagen | Foto del resultado |

### Sugerencias del Sistema
- Filtro por dificultad (para días con poca energía: sugiere dificultad 1-2)
- Filtro "Ingredientes disponibles" (el usuario marca ingredientes que tiene en casa y el sistema filtra)
- "Sugerir receta aleatoria" del pool de pendientes

---

## Odysseia (Viajes y Turismo)

### Propósito
Llevar control de destinos visitados y por visitar, con clasificación y calificación de experiencias de viaje.

### Categorías de Viaje
| Categoría | Descripción |
|-----------|-------------|
| Nacional | Dentro del país del usuario |
| Internacional | Fuera del país |
| Ciudad | Destino urbano |
| Naturaleza | Playa, montaña, parque natural |
| Cultural | Museos, ruinas, patrimonio |

### Registro de Destino
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Ciudad o lugar específico |
| País | Texto | País del destino |
| Categoría | Multi-selector | Puede ser más de una categoría |
| Estado | Enum | Pendiente / Visitado |
| Fecha de visita | Date | Cuando fue (si visitado) |
| Duración | Días | Cuántos días estuvo |
| Fotos | Imágenes | Galería de la visita |
| Calificación | 1-5 estrellas | Experiencia general |
| Costo estimado | Monto | Cuánto costó (vinculable a Demeter) |

> **Nota:** No se registra reseña en Odysseia. La calificación de estrellas es suficiente.

---

## Proeza (Música y Producción)

### Propósito
Gestionar el proceso creativo musical: exploración de géneros, canciones en proceso, fechas de producción y lanzamientos.

### Estados de una Canción
```
Idea → En Proceso → Grabada → Mezclada → Masterizada → Lanzada
```

### Registro de Canción / Proyecto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Título de la canción |
| Estado | Enum | Estado en el flujo de producción |
| Beatmaker | Texto | Beatmaker o productor del beat |
| Fecha inicio | Date | Cuando inició el proyecto |
| Links | URLs | Borradores, demos online |

### Integración con Cronnos
- Las fechas de producción y lanzamiento se añaden automáticamente a Cronnos como recordatorios
- Las sesiones de producción (tiempo trabajando en la canción) se pueden registrar como actividad "Música (producción)"

### Exploración Musical
Sección para descubrir música de todo el mundo:
- El sistema asigna aleatoriamente un **país** y una **ciudad** al usuario
- El usuario explora manualmente música de esa combinación (artistas, géneros, cultura musical local)
- Al completar la exploración, marca el destino como explorado
- El sistema entonces asigna una nueva combinación aleatoria
- Estado por destino musical: Asignado / Explorando / Explorado
- Calificación 1-5 de la experiencia musical de ese lugar

---

## Prodigy (Estudios y Academia)

### Propósito
Gestionar el aprendizaje académico y autodidacta: cursos, certificaciones, temas pendientes y fechas de entrega.

### Categorías de Estudio
| Categoría | Ejemplos |
|-----------|----------|
| Universidad / Formal | Materias, trabajos, exámenes |
| Cursos Online | Udemy, Coursera, YouTube |
| Libros técnicos | Conectado con Alejandría |
| Certificaciones | AWS, Google, etc. |
| Autodidacta | Temas de interés libre |

### Registro de Tema/Curso
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Nombre del curso o tema |
| Categoría | Selector | Ver tabla anterior |
| Plataforma/Institución | Texto | Donde se estudia |
| Estado | Enum | Pendiente / En curso / Terminado |
| % Completado | 0-100% | Progreso del curso |
| Fecha inicio | Date | Cuando empezó |
| Fecha límite | Date | Deadline (vinculada a Cronnos) |
| Horas totales | Número | Duración estimada del curso |
| Horas estudiadas | Número | Calculado desde registros de actividad |
| Certificado | Boolean | Si otorga certificado al terminar |
| Calificación | 1-5 | Calidad del curso una vez terminado |

### Trabajos y Entregas
Para materias universitarias o cursos con tareas:
| Campo | Tipo |
|-------|------|
| Nombre del trabajo | Texto |
| Asignado a (curso) | Referencia |
| Fecha de entrega | DateTime |
| Estado | Pendiente / En progreso / Entregado |
| Prioridad | Alta / Media / Baja |

Todas las fechas de entrega se sincronizan automáticamente con Cronnos.

### Integración con Cronnos
El usuario define:
- Cuántas horas a la semana puede estudiar (disponibilidad)
- Cronnos genera bloques de estudio automáticamente basados en:
  - Fechas límite de trabajos (con 3 días de margen)
  - Disponibilidad del usuario
  - Prioridad de cada materia/curso

---

## Kubera (Deseos Materiales)

### Propósito
Lista de productos y objetos que el usuario desea adquirir, conectada con Demeter para gestionar el ahorro hacia esos objetivos.

### Registro de Producto Deseado
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Texto | Nombre del producto |
| Categoría | Selector | Tecnología/Ropa/Hogar/Deporte/Otro |
| Precio estimado | Monto | Costo aproximado |
| Enlace | URL | Donde comprarlo |
| Estado | Enum | Deseado / Ahorrando / Adquirido |
| Fecha meta | Date | Fecha objetivo para adquirirlo |
| Foto | Imagen | Foto del producto |
| Notas | Texto | Por qué lo quiere, dónde lo encontró |

### Conexión con Demeter
- Al activar "Ahorrando" para un producto, se crea un **fondo Kubera** en Demeter
- El usuario puede asignar un % de sus ingresos a ese fondo
- Kubera muestra el progreso: `$XXX / $XXX precio` con barra de progreso
- Al alcanzar el 100%: notificación "¡Ya puedes comprar [producto]!" + el estado cambia a disponible para adquirir

### Historial de Adquisiciones
- Productos marcados como "Adquirido" pasan a un historial
- Muestran: fecha de adquisición, precio real pagado, meses que tardó en ahorrar

---

## Base de Datos — Secciones de Contenido

```sql
-- Apolo (Películas)
CREATE TABLE apolo_peliculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  year INTEGER,
  movie VARCHAR(200) NOT NULL,
  director VARCHAR(100),
  country VARCHAR(100),
  producer VARCHAR(200),
  distributed VARCHAR(200),
  genre VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',  -- 'pendiente', 'vista'
  fecha_visualizacion DATE,
  rating DECIMAL(3,1),            -- 0.0–5.0, ingresado por el usuario
  stars DECIMAL(3,1),             -- calculado igual a rating (representación visual)
  category VARCHAR(20),           -- 'DIAMOND','GOLD','PLATINUM','GOOD','ACEPTABLE','BAD'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Niveles cinéfilos de usuario en Apolo (se calcula on-the-fly, no necesita tabla propia)
-- nivel = función de COUNT(apolo_peliculas WHERE estado='vista' AND usuario_id=X)

-- Alejandría (Libros)
CREATE TABLE alejandria_libros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(100),
  genero VARCHAR(50),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  paginas_totales INTEGER,
  paginas_leidas INTEGER DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  cover_url TEXT,
  calificaciones JSONB,
  -- {"escritura": 4, "trama": 5, "personajes": 3, "ritmo": 4, "impacto": 5}
  calificacion_final DECIMAL(3,1),
  resena TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Michelin (Recetas)
CREATE TABLE michelin_recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(30),
  origen VARCHAR(100),
  dificultad SMALLINT,
  tiempo_minutos INTEGER,
  ingredientes TEXT[],
  instrucciones TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  veces_cocinada INTEGER DEFAULT 0,
  ultima_vez DATE,
  url_referencia TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Odysseia (Viajes)
CREATE TABLE odysseia_destinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  pais VARCHAR(100),
  categorias TEXT[],
  estado VARCHAR(20) DEFAULT 'pendiente',
  fecha_visita DATE,
  duracion_dias INTEGER,
  fotos_urls TEXT[],
  calificacion SMALLINT,
  -- sin campo resena
  costo_estimado DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proeza (Música)
CREATE TABLE proeza_canciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  estado VARCHAR(30) DEFAULT 'idea',  -- 'idea','en_proceso','grabada','mezclada','masterizada','lanzada'
  beatmaker VARCHAR(200),
  fecha_inicio DATE,
  links TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exploración musical (destinos asignados por el sistema)
CREATE TABLE proeza_exploracion_musical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  pais VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  estado VARCHAR(20) DEFAULT 'asignado',  -- 'asignado','explorando','explorado'
  calificacion SMALLINT,
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  fecha_explorado DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prodigy (Estudio)
CREATE TABLE prodigy_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(50),
  plataforma VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'pendiente',
  porcentaje_completado SMALLINT DEFAULT 0,
  fecha_inicio DATE,
  fecha_limite DATE,
  horas_totales INTEGER,
  otorga_certificado BOOLEAN DEFAULT FALSE,
  calificacion SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prodigy_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES prodigy_cursos(id),
  nombre VARCHAR(200) NOT NULL,
  fecha_entrega TIMESTAMPTZ NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente',
  prioridad SMALLINT DEFAULT 2,
  cronos_evento_id UUID REFERENCES cronos_eventos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kubera (Deseos)
CREATE TABLE kubera_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(50),
  precio_estimado DECIMAL(15,2),
  precio_real DECIMAL(15,2),
  enlace TEXT,
  -- sin campo prioridad
  estado VARCHAR(20) DEFAULT 'deseado',
  fecha_meta DATE,
  fecha_adquisicion DATE,
  foto_url TEXT,
  notas TEXT,
  demeter_fondo_activo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
