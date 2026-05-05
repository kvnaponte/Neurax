# PostgreSQL: modelo de datos base del motor

Este archivo cubre todo lo que tiene que ver con la capa PostgreSQL del motor: las tablas mínimas del metamodelo, el esquema base completo, la doctrina de cuándo usar `jsonb` versus columnas reales, los tipos de índice necesarios, y la búsqueda full-text nativa.

## Tabla de contenidos

1. Las tablas mínimas del metamodelo
2. Esquema base completo en SQL
3. JSONB: por qué sí, y la regla práctica de "sobre fijo, contenido dinámico"
4. El error clásico: todo dentro de jsonb
5. Tipos de índices que debes dominar (B-tree, GIN, expresión)
6. Full-text search sin salir de PostgreSQL
7. Laboratorio mental: cómo decidir caso por caso

---

## 1. Las tablas mínimas del metamodelo

El motor se sostiene sobre exactamente seis tablas. Cuatro son el metamodelo (describen QUÉ existe), dos son los datos reales (almacenan instancias).

| Tabla | Rol | Lo que describe |
|---|---|---|
| `system_definition` | Metamodelo | Un dominio funcional. Ej: `gestion_documental`. |
| `entity_definition` | Metamodelo | Un tipo de objeto dentro de un sistema. Ej: `fondo_documental`. |
| `field_definition` | Metamodelo | Una propiedad de una entidad. Ej: `codigo`, `nombre`. |
| `relation_definition` | Metamodelo | Relaciones permitidas entre entidades. |
| `record` | Datos | Instancias reales de entidades. Aquí vive `data jsonb`. |
| `record_relation` | Datos | Relaciones reales entre registros instanciados. |

Si el usuario propone una séptima tabla "general" en el día uno, sospecha. La complejidad adicional debe venir después de tener este núcleo funcionando.

---

## 2. Esquema base completo en SQL

Este es el esquema canónico del manual. Es razonable, no perfecto: está pensado para ser entendido y para evolucionar con Alembic. Usa `uuidv7()` (PostgreSQL 18) como default de PK, lo que da IDs ordenables temporalmente.

```sql
CREATE TABLE system_definition (
    id          uuid PRIMARY KEY DEFAULT uuidv7(),
    code        text NOT NULL UNIQUE,
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE entity_definition (
    id          uuid PRIMARY KEY DEFAULT uuidv7(),
    system_id   uuid NOT NULL REFERENCES system_definition(id),
    code        text NOT NULL,
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (system_id, code)
);

CREATE TABLE field_definition (
    id          uuid PRIMARY KEY DEFAULT uuidv7(),
    entity_id   uuid NOT NULL REFERENCES entity_definition(id),
    code        text NOT NULL,
    label       text NOT NULL,
    data_type   text NOT NULL,
    required    boolean NOT NULL DEFAULT false,
    indexed     boolean NOT NULL DEFAULT false,
    searchable  boolean NOT NULL DEFAULT false,
    config      jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (entity_id, code)
);

CREATE TABLE relation_definition (
    id              uuid PRIMARY KEY DEFAULT uuidv7(),
    system_id       uuid NOT NULL REFERENCES system_definition(id),
    from_entity_id  uuid NOT NULL REFERENCES entity_definition(id),
    to_entity_id    uuid NOT NULL REFERENCES entity_definition(id),
    code            text NOT NULL,
    relation_type   text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (system_id, code)
);

CREATE TABLE record (
    id          uuid PRIMARY KEY DEFAULT uuidv7(),
    system_id   uuid NOT NULL REFERENCES system_definition(id),
    entity_id   uuid NOT NULL REFERENCES entity_definition(id),
    status      text NOT NULL DEFAULT 'active',
    data        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE record_relation (
    id                      uuid PRIMARY KEY DEFAULT uuidv7(),
    relation_definition_id  uuid NOT NULL REFERENCES relation_definition(id),
    from_record_id          uuid NOT NULL REFERENCES record(id),
    to_record_id            uuid NOT NULL REFERENCES record(id),
    created_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE (relation_definition_id, from_record_id, to_record_id)
);
```

Observa qué decisiones están tomadas conscientemente:

- **`field_definition` tiene flags semánticos**: `required`, `indexed`, `searchable`. El motor de validación los lee para construir el modelo Pydantic. El motor de búsqueda los lee para decidir cómo indexar.
- **`field_definition.config` es jsonb**: para cosas como `{"max_length": 200}`, `{"regex": "^FD-[0-9]+$"}`, `{"options": ["fisico","digital","hibrido"]}`. Configuración del campo, no del registro.
- **`record` tiene `system_id` Y `entity_id`**: aunque entity ya implica system, tener ambos simplifica filtros y particiones futuras.
- **`record_relation` tiene UNIQUE (relation_def, from, to)**: un mismo vínculo no se duplica.

---

## 3. JSONB: por qué sí, y la regla práctica

PostgreSQL soporta `json` y `jsonb`. Para este motor siempre `jsonb`, porque está orientado a procesamiento e indexación; `json` es texto, `jsonb` es estructura binaria.

Pero **usar jsonb no significa meter todo ahí**. La regla práctica es:

### Va a columna real si:

- Participa en JOIN.
- Necesita UNIQUE.
- Filtras por ese campo en casi todas las consultas.
- Ordenas frecuentemente por ese campo.
- Es parte del sobre fijo del registro.

### Puede ir a `data jsonb` si:

- Cambia entre entidades.
- Puede variar entre sistemas.
- No participa en relaciones críticas.
- No necesitas un índice específico desde el día uno.

### Ejemplo concreto

Para `fondo_documental` con campos `codigo`, `nombre`, `soporte`, `activo`:

- ¿`codigo` debe ser columna o jsonb? Si es UNIQUE por entidad y se filtra siempre → considerar promoverlo. En la v1 puede vivir en `data` con un índice de expresión sobre `data->>'codigo'`.
- ¿`nombre` columna o jsonb? Si solo se busca por similitud o full-text → `data` con `searchable=true` y `tsvector`.
- ¿`activo` columna o jsonb? Si es semántica del registro (estado funcional) y se filtra en TODOS los listados → considerar columna. Si es solo "el campo activo del dominio" → `data`.

El motor bueno **no nace perfecto**; nace con criterios correctos y evoluciona con Alembic.

---

## 4. El error clásico: todo dentro de jsonb

El anti-patrón a evitar:

```json
{
  "system": "gestion_documental",
  "entity": "fondo_documental",
  "status": "active",
  "codigo": "FD-001",
  "nombre": "Fondo Central"
}
```

…todo eso en una sola columna JSONB.

Lo que pierdes haciendo esto:

- **Claves foráneas reales**: ya no puedes referenciar `system_id` con `REFERENCES system_definition(id)`.
- **Restricciones claras**: NOT NULL, UNIQUE, CHECK ya no aplican al sobre.
- **Buenos índices para lo caliente**: filtrar por `system_id` con un B-tree es órdenes de magnitud más rápido que extraer una clave de JSONB.
- **Un modelo comprensible**: cualquier desarrollador que abra la tabla con `\d record` ya no entiende qué es un registro.

El diseño correcto es **híbrido**: columnas reales para el esqueleto, `jsonb` para lo variable.

---

## 5. Índices que debes entender de verdad

### B-tree (índice por defecto)

Úsalo para:
- `id`
- `system_id`
- `entity_id`
- Fechas (`created_at`, `updated_at`)
- Estados (`status`)
- Códigos muy consultados, una vez promovidos a columna real

```sql
CREATE INDEX ix_record_entity_id ON record (entity_id);
CREATE INDEX ix_record_status ON record (status);
```

### GIN (Generalized Inverted Index)

Es el índice clásico para búsquedas sobre `jsonb` y `tsvector`. Sirve para "el JSON contiene esto" o "el documento contiene esta palabra".

```sql
CREATE INDEX ix_record_data_gin ON record USING GIN (data);
```

Esto te permite consultas eficientes con `data @> '{"codigo": "FD-001"}'` o `data ? 'nombre'`.

Hay dos clases de operadores GIN sobre JSONB. La default cubre `@>`, `?`, `?&`, `?|`. La variante `jsonb_path_ops` es más rápida pero solo cubre `@>`.

### Índices de expresión

Sirven cuando una sola ruta del JSON domina el tráfico de consultas. Son frecuentemente **mejores** que un GIN genérico para ese caso.

```sql
CREATE INDEX ix_record_codigo_expr
    ON record ((data->>'codigo'));
```

Después de eso, `WHERE data->>'codigo' = 'FD-001'` puede usar este índice como un B-tree común.

### Heurística

- Si UNA ruta JSON domina (90%+ del tráfico de búsqueda) → índice de expresión.
- Si necesitas filtrar por contenido arbitrario del JSON → GIN.
- Si el campo se promueve a columna real → B-tree.

---

## 6. Full-text search sin salir de PostgreSQL

PostgreSQL trae búsqueda de texto completo nativa. Para muchos motores **no necesitas Elasticsearch**.

Funciones clave:
- `to_tsvector(config, text)` — convierte texto a vectores de búsqueda.
- `jsonb_to_tsvector(config, jsonb, types)` — extrae texto de un JSONB y lo convierte.
- `websearch_to_tsquery(config, query)` — parsea queries estilo buscador (acepta comillas, OR, -negación).
- `ts_rank(tsv, tsq)` — score de relevancia para ordenar.

### Ejemplo canónico de búsqueda en `record.data`

```sql
SELECT
    id,
    ts_rank(
        jsonb_to_tsvector('spanish', data, '["string"]'),
        websearch_to_tsquery('spanish', 'fondo central archivo')
    ) AS rank
FROM record
WHERE jsonb_to_tsvector('spanish', data, '["string"]')
      @@ websearch_to_tsquery('spanish', 'fondo central archivo')
ORDER BY rank DESC;
```

El tercer argumento `'["string"]'` le dice a `jsonb_to_tsvector` que solo extraiga valores de tipo string del JSON (ignora números, booleanos, etc.).

### Para acelerarlo

Crea un índice GIN sobre la expresión de tsvector:

```sql
CREATE INDEX ix_record_data_tsv
    ON record
    USING GIN (jsonb_to_tsvector('spanish', data, '["string"]'));
```

Eso te da una primera búsqueda útil sin agregar otra pieza de infraestructura. Cuando el motor crezca y la búsqueda se vuelva crítica, ya considerarás Elasticsearch o pgvector — pero no antes.

---

## 7. Laboratorio mental

Toma esta entidad:

```json
{
  "entity": "fondo_documental",
  "fields": [
    {"code": "codigo",  "type": "string",  "required": true,  "indexed": true},
    {"code": "nombre",  "type": "string",  "required": true,  "searchable": true},
    {"code": "soporte", "type": "string",  "required": false},
    {"code": "activo",  "type": "boolean", "required": true}
  ]
}
```

Las preguntas correctas que el motor te debe llevar a hacerte son:

1. **¿`codigo` vive en columna real o en jsonb en la v1?** Probablemente en `data` con índice de expresión. Si más adelante necesita UNIQUE global, se promueve.
2. **¿`nombre` necesita GIN, full-text o ambas?** Si `searchable=true`, full-text. Si además se filtra exacto, complementa con índice de expresión sobre `data->>'nombre'`.
3. **¿`activo` vale la pena promoverlo a columna real?** Si TODOS los listados filtran por `activo = true`, sí. Si es uno de muchos flags semánticos del dominio, no.

**No hay respuesta universal.** El criterio es: "¿este campo es parte del sobre del registro o del contenido?". Si es parte del sobre, columna. Si es parte del contenido, JSONB.
