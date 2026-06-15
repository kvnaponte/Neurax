# NEURAX — Secciones de Contenido

## Apolo (Películas)

### Propósito
Gestionar el historial de películas vistas, las pendientes por ver y las calificaciones cinematográficas.

### Pantalla Principal
- Header: "APOLO" + filtro Por Ver / Vistas / Todas
- **Top 5**: Las 5 películas con mejor calificación en card horizontal con poster
- **Pendientes**: Lista de películas por ver
- **Recientes**: Películas calificadas recientemente

### Registro de Película
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Título | Texto | Nombre de la película |
| Año | Número | Año de estreno |
| Director | Texto | Opcional |
| Plataforma | Selector | Netflix/HBO/Cine/Otro |
| Estado | Enum | Pendiente / Vista / En progreso |
| Fecha de visualización | Date | Cuando la vio |
| Poster | URL/Imagen | Manual o desde TMDB API (future) |

### Sistema de Calificación (solo si estado = Vista)
Criterios (puntuación 1-10 cada uno):
| Criterio | Descripción |
|----------|-------------|
| Guión | Calidad de la historia, diálogos, estructura |
| Actuación | Desempeño del elenco |
| Dirección | Visión del director, toma de decisiones creativas |
| Fotografía | Cinematografía, paleta visual |
| Música | Soundtrack y diseño de sonido |
| Efectos | Efectos visuales y práctica |

- **Calificación final**: promedio ponderado de los 6 criterios
- Se muestra como score / 10 con una estrella visual
- Top 5 se ordena por calificación final descendente

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
| Reseña | Texto | Notas personales |
| Costo estimado | Monto | Cuánto costó (vinculable a Demeter) |

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
| Género | Texto | Género musical |
| BPM | Número | Tempo (opcional) |
| Tonalidad | Texto | Do mayor, La menor, etc. (opcional) |
| Fecha inicio | Date | Cuando inició el proyecto |
| Fecha objetivo mezcla | Date | Fecha planificada para mezcla |
| Fecha objetivo lanzamiento | Date | Fecha planificada de lanzamiento |
| Colaboradores | Texto | Otros artistas/productores |
| Notas | Texto | Observaciones del proceso |
| Links | URLs | Borradores, demos online |

### Integración con Cronnos
- Las fechas de producción y lanzamiento se añaden automáticamente a Cronnos como recordatorios
- Las sesiones de producción (tiempo trabajando en la canción) se pueden registrar como actividad "Música (producción)"

### Exploración Musical
Sección para descubrir géneros/artistas nuevos:
- El usuario añade artistas o géneros que quiere explorar
- Estado: Pendiente / Explorando / Escuchado / Favorito
- Calificación 1-5

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
| Prioridad | Alta / Media / Baja | Qué tan urgente es |
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
  titulo VARCHAR(200) NOT NULL,
  año INTEGER,
  director VARCHAR(100),
  plataforma VARCHAR(50),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  fecha_visualizacion DATE,
  poster_url TEXT,
  calificaciones JSONB,
  -- {"guion": 8, "actuacion": 9, "direccion": 7, "fotografia": 8, "musica": 6, "efectos": 7}
  calificacion_final DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  resena TEXT,
  costo_estimado DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proeza (Música)
CREATE TABLE proeza_canciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  estado VARCHAR(30) DEFAULT 'idea',
  genero VARCHAR(50),
  bpm INTEGER,
  tonalidad VARCHAR(20),
  fecha_inicio DATE,
  fecha_objetivo_mezcla DATE,
  fecha_objetivo_lanzamiento DATE,
  colaboradores TEXT,
  notas TEXT,
  links TEXT[],
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
  prioridad SMALLINT DEFAULT 2,
  estado VARCHAR(20) DEFAULT 'deseado',
  fecha_meta DATE,
  fecha_adquisicion DATE,
  foto_url TEXT,
  notas TEXT,
  demeter_fondo_activo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
