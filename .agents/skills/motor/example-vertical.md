# Ejemplo vertical end-to-end: de metadata a registro real

Este es el capítulo más importante operativamente. Aquí se unen TODAS las piezas del motor en un único caso completo: desde declarar un sistema en metadata hasta consultar un registro por JSONB.

Si el usuario está listo para "ver el motor en funcionamiento", **este es el archivo que debes seguir paso a paso**.

## El caso

Construimos el sistema `gestion_documental` con la entidad `fondo_documental`, que tiene los campos `codigo`, `nombre`, `activo`. Creamos un registro vía API y lo consultamos por contenido.

## Tabla de contenidos

1. Paso 1 — Crear el sistema (SQL/seed)
2. Paso 2 — Crear la entidad (SQL/seed)
3. Paso 3 — Crear los campos (SQL/seed)
4. Paso 4 — Recibir el payload HTTP
5. Paso 5 — Construir el modelo dinámico
6. Paso 6 — Persistir el registro
7. Paso 7 — Responder con un contrato fijo
8. Paso 8 — Consultar el registro de tres formas
9. Lo que este ejemplo ya te enseña

---

## Paso 1. Crear el sistema

Esto típicamente se hace vía un endpoint `POST /systems`, pero también puede vivir como seed inicial. SQL crudo:

```sql
INSERT INTO system_definition (code, name)
VALUES ('gestion_documental', 'Gestión Documental');
```

Resultado: existe un row en `system_definition` con `code = 'gestion_documental'`. Su `id` lo generó `uuidv7()` automáticamente.

---

## Paso 2. Crear la entidad

```sql
INSERT INTO entity_definition (system_id, code, name)
SELECT id, 'fondo_documental', 'Fondo Documental'
FROM system_definition
WHERE code = 'gestion_documental';
```

Patrón clave: usar un `SELECT` para resolver el `system_id` por `code`, en lugar de hardcodear UUIDs. Esto hace los seeds idempotentes y portables.

---

## Paso 3. Crear los campos

Tres inserts, uno por campo. Observa los flags `required`, `indexed`, `searchable` que vienen directamente del manual:

```sql
INSERT INTO field_definition (entity_id, code, label, data_type, required, indexed, searchable)
SELECT e.id, 'codigo', 'Código', 'string', true, true, false
FROM entity_definition e
JOIN system_definition s ON s.id = e.system_id
WHERE s.code = 'gestion_documental' AND e.code = 'fondo_documental';

INSERT INTO field_definition (entity_id, code, label, data_type, required, indexed, searchable)
SELECT e.id, 'nombre', 'Nombre', 'string', true, false, true
FROM entity_definition e
JOIN system_definition s ON s.id = e.system_id
WHERE s.code = 'gestion_documental' AND e.code = 'fondo_documental';

INSERT INTO field_definition (entity_id, code, label, data_type, required, indexed, searchable)
SELECT e.id, 'activo', 'Activo', 'boolean', true, false, false
FROM entity_definition e
JOIN system_definition s ON s.id = e.system_id
WHERE s.code = 'gestion_documental' AND e.code = 'fondo_documental';
```

Con esto, el motor ya **sabe** que `fondo_documental` tiene tres campos, sus tipos, y sus restricciones semánticas. Nada más se ha tocado en el código.

---

## Paso 4. Recibir el payload HTTP

El cliente envía:

```http
POST /systems/gestion_documental/entities/fondo_documental/records
Content-Type: application/json

{
  "data": {
    "codigo": "FD-001",
    "nombre": "Fondo Central",
    "activo": true
  }
}
```

FastAPI valida el sobre fijo (`{"data": dict}`) con `CreateRecordRequest`. Eso es validación **estática**. Lo que viene después es validación **dinámica**.

---

## Paso 5. Construir el modelo dinámico

El servicio de validación lee `field_definition` filtrando por `entity_id` y construye un modelo Pydantic en memoria:

```python
field_defs = [
    {"code": "codigo", "data_type": "string",  "required": True},
    {"code": "nombre", "data_type": "string",  "required": True},
    {"code": "activo", "data_type": "boolean", "required": True},
]

PayloadModel = build_payload_model("fondo_documental", field_defs)
```

`PayloadModel` es **equivalente** a haber escrito a mano:

```python
class FondoDocumentalPayload(BaseModel):
    codigo: str
    nombre: str
    activo: bool
```

**Pero no fue escrito a mano.** Fue generado en runtime desde la metadata. **Esa es la magia central del motor.**

Validación:

```python
validated = PayloadModel.model_validate(body.data, strict=True)
# validated.codigo == "FD-001"
# validated.nombre == "Fondo Central"
# validated.activo == True
```

Si el cliente hubiera enviado `"activo": "true"` (string en lugar de bool), strict mode lo rechaza con 422.

Si hubiera enviado un campo extra `"foo": "bar"`, depende de `model_config`: con `extra="forbid"` se rechaza, con `extra="ignore"` se descarta. **La doctrina del manual prefiere `extra="forbid"`**: si el cliente envía algo no declarado, es un error suyo, y debes señalarlo.

---

## Paso 6. Persistir el registro

```python
record = Record(
    system_id=system.id,
    entity_id=entity.id,
    data={
        "codigo": "FD-001",
        "nombre": "Fondo Central",
        "activo": True,
    },
)
session.add(record)
session.commit()
session.refresh(record)
```

Después del `refresh`, `record` tiene su `id` (uuidv7), `created_at`, `updated_at` poblados desde el server.

`status` se quedó con su default `'active'` porque no lo seteamos.

---

## Paso 7. Responder con un contrato fijo

```python
return RecordOut(
    id=record.id,
    system_code=system.code,
    entity_code=entity.code,
    status=record.status,
    data=record.data,
)
```

Lo que el cliente recibe:

```json
{
  "id": "0195f4d2-6a6b-7c11-a0d8-6f5c0c1c37f1",
  "system_code": "gestion_documental",
  "entity_code": "fondo_documental",
  "status": "active",
  "data": {
    "codigo": "FD-001",
    "nombre": "Fondo Central",
    "activo": true
  }
}
```

**Punto clave**: el sobre del response es **siempre el mismo** (`id`, `system_code`, `entity_code`, `status`, `data`), sin importar la entidad. Lo que cambia es el contenido de `data`. Eso es lo que vuelve la API predecible para clientes.

---

## Paso 8. Consultar el registro de tres formas

Ahora veamos cómo se consulta este registro. Tres patrones distintos, cada uno con su uso:

### A. Por código exacto (containment)

Pregunta: "dame el registro cuyo `codigo` es exactamente `FD-001`".

```sql
SELECT *
FROM record
WHERE entity_id = :entity_id
  AND data @> '{"codigo": "FD-001"}';
```

En SQLAlchemy:

```python
stmt = select(Record).where(
    Record.entity_id == entity_id,
    Record.data.contains({"codigo": "FD-001"}),
)
```

**Acelerable** con un índice GIN sobre `record.data` o un índice de expresión sobre `(data->>'codigo')`.

### B. Por existencia de clave

Pregunta: "dame todos los registros que tengan declarado el campo `nombre`".

```sql
SELECT *
FROM record
WHERE data ? 'nombre';
```

En SQLAlchemy:

```python
stmt = select(Record).where(Record.data.has_key("nombre"))
```

Útil para auditar consistencia: "¿hay registros donde el campo `nombre` no se haya guardado?".

### C. Por búsqueda textual (full-text)

Pregunta: "dame los registros relevantes a 'fondo central'".

```sql
SELECT id,
       ts_rank(
           jsonb_to_tsvector('spanish', data, '["string"]'),
           websearch_to_tsquery('spanish', 'fondo central')
       ) AS rank
FROM record
WHERE jsonb_to_tsvector('spanish', data, '["string"]')
      @@ websearch_to_tsquery('spanish', 'fondo central')
ORDER BY rank DESC;
```

**Acelerable** con un índice GIN sobre la expresión `jsonb_to_tsvector('spanish', data, '["string"]')`.

En SQLAlchemy puro esto se ejecuta con `text()`:

```python
from sqlalchemy import text

stmt = text("""
    SELECT id,
           ts_rank(
               jsonb_to_tsvector('spanish', data, '["string"]'),
               websearch_to_tsquery('spanish', :q)
           ) AS rank
    FROM record
    WHERE jsonb_to_tsvector('spanish', data, '["string"]')
          @@ websearch_to_tsquery('spanish', :q)
    ORDER BY rank DESC
""")
results = session.execute(stmt, {"q": "fondo central"}).all()
```

---

## Lo que este ejemplo ya te enseña

Si entendiste estos ocho pasos, ya entendiste:

- **El metamodelo**: `system_definition`, `entity_definition`, `field_definition` describen QUÉ existe.
- **La validación dinámica**: `field_definition` se transforma en un modelo Pydantic en runtime con `create_model()`.
- **El sobre fijo**: cualquier registro tiene la misma forma externa, distinta sólo en `data`.
- **La persistencia híbrida**: columnas reales para el sobre, JSONB para el contenido.
- **La consulta flexible**: containment para exacto, `has_key` para presencia, `jsonb_to_tsvector` para búsqueda textual.

**Eso ya es el núcleo del motor.** Todo lo demás (relaciones entre registros, paginación, filtros complejos, validaciones avanzadas) son **extensiones del mismo patrón**.

---

## Variación: agregar un campo opcional

Para reforzar la idea de que la metadata vive en BD, veamos qué pasa si agregas el campo `soporte` (opcional):

```sql
INSERT INTO field_definition (entity_id, code, label, data_type, required, indexed, searchable)
SELECT e.id, 'soporte', 'Soporte', 'string', false, false, false
FROM entity_definition e
JOIN system_definition s ON s.id = e.system_id
WHERE s.code = 'gestion_documental' AND e.code = 'fondo_documental';
```

**No tocas ni una línea de código del motor.** El próximo request al endpoint:

```json
{
  "data": {
    "codigo": "FD-002",
    "nombre": "Fondo Histórico",
    "soporte": "fisico",
    "activo": true
  }
}
```

…ya validará correctamente, porque `build_payload_model` lee la metadata viva. El motor "evolucionó" cambiando solo datos.

Si el caché de modelos dinámicos está activo, recuerda invalidarlo cuando cambies `field_definition`. En v1 puedes saltarte esa optimización; en v2+ ya es necesaria.

---

## Variación: registro con relación

Para asociar dos registros (por ejemplo, una `serie` con su `subserie`), el patrón es el mismo pero usando `record_relation`:

1. Asegúrate de que existe la `relation_definition` apropiada (`serie_pertenece_a_subserie`).
2. Inserta en `record_relation` con `from_record_id`, `to_record_id`, `relation_definition_id`.

```python
relation = RecordRelation(
    relation_definition_id=rel_def_id,
    from_record_id=serie_record.id,
    to_record_id=subserie_record.id,
)
session.add(relation)
session.commit()
```

**Nunca pongas la FK dentro de `data`.** Esa es la regla del manual y se aplica aquí literalmente.

---

## Resumen del flujo end-to-end

```
[ Metadata en DB ]   [ HTTP POST con data ]
        │                     │
        ▼                     ▼
[ Cargar field_defs ]    [ Validar sobre estático ]
        │                     │
        └──────────┬──────────┘
                   ▼
        [ build_payload_model() ]
                   │
                   ▼
        [ model_validate(strict) ]
                   │
                   ▼
        [ Record(...).add().commit() ]
                   │
                   ▼
        [ RecordOut con sobre fijo ]
                   │
                   ▼
        [ HTTP 200 al cliente ]
```

Este es el latido del motor. Si lo entiendes, todo lo demás es decoración.
