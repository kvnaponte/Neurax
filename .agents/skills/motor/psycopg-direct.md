# Psycopg 3: qué papel tiene y cuándo usarlo directo

Psycopg 3 es el adaptador moderno de PostgreSQL para Python. En este motor, **vive principalmente debajo de SQLAlchemy** como driver. No compite con SQLAlchemy; lo soporta.

Este archivo cubre cuándo NO necesitas tocarlo directamente, cuándo SÍ conviene, y el patrón canónico de carga masiva con `COPY`.

## Tabla de contenidos

1. Qué es Psycopg 3 en este motor
2. Cuándo NO necesitas usarlo directamente
3. Cuándo SÍ conviene usarlo directo
4. Ejemplo básico de `COPY`
5. Qué aprender y qué dejar para después

---

## 1. Qué es Psycopg 3 en este motor

Psycopg 3 es el driver. La URL `postgresql+psycopg://...` que pasaste a `create_engine()` ya está usando Psycopg 3. SQLAlchemy traduce queries al protocolo PostgreSQL a través de Psycopg.

**No compite con SQLAlchemy.** SQLAlchemy es el ORM y constructor de queries; Psycopg es la conexión real al servidor.

En la mayoría de tu código nunca lo verás. Eso es intencional: el motor está pensado para que el día a día sea SQLAlchemy.

---

## 2. Cuándo NO necesitas usarlo directamente

Para todas estas operaciones, SQLAlchemy es suficiente:

- CRUD normal (insertar, leer, actualizar, eliminar registros).
- Listados con filtros y paginación.
- Lecturas por contenido JSONB (`@>`, `?`, `->>`).
- Joins entre `record` y `record_relation`.
- Transacciones normales del motor.
- Búsqueda full-text con `jsonb_to_tsvector` (puedes ejecutarla con `session.execute(text(...))`).

Si tu instinto te dice "voy a abrir una conexión Psycopg directa para esto", primero pregúntate: **¿puedo expresarlo con `select()` de SQLAlchemy?** En el 95% de los casos, sí.

---

## 3. Cuándo SÍ conviene usarlo directo

Hay tres escenarios donde Psycopg directo es la herramienta correcta:

### A. Cargas masivas con `COPY`

`COPY` es la forma más eficiente de meter muchos registros a PostgreSQL. Para cargar 10.000 filas, `COPY` puede ser 10x-100x más rápido que `INSERT` repetidos vía SQLAlchemy.

Casos típicos en este motor:
- Importación inicial de datos legacy a `record`.
- Importación de catálogos masivos (cuando un sistema nuevo trae 50.000 registros de seed).
- Cargas desde CSV/Excel ya transformados a la estructura del motor.

### B. Procesos de inicialización pesados

Cuando levantas el motor por primera vez en un cliente y necesitas insertar:
- Todos los `system_definition`.
- Cientos de `entity_definition`.
- Miles de `field_definition`.

Hacerlo vía la API es lento e innecesario. Hacerlo vía Psycopg directo, en una transacción única, es la forma correcta.

### C. Operaciones administrativas crudas

- Reindexado masivo (`REINDEX`).
- `VACUUM ANALYZE` programado.
- Backups lógicos parciales.
- Diagnóstico (`pg_stat_*`).

Estas no son operaciones del motor en sí; son de operación de la BD. SQLAlchemy las puede ejecutar también, pero a veces es más limpio Psycopg directo.

---

## 4. Ejemplo básico de `COPY`

El soporte de `COPY` en Psycopg 3 es uno de los puntos más fuertes del driver. Sintaxis canónica:

```python
import psycopg

rows = [
    ("gestion_documental", "Gestión Documental"),
    ("inventario_activos", "Inventario de Activos"),
    ("pqrs",               "PQRS"),
]

with psycopg.connect("postgresql://user:pass@localhost/db") as conn:
    with conn.cursor() as cur:
        with cur.copy("COPY system_definition (code, name) FROM STDIN") as copy:
            for row in rows:
                copy.write_row(row)
```

Observa el patrón de tres `with` anidados:

1. `psycopg.connect(...)` — conexión transaccional, commit/rollback automático al salir.
2. `conn.cursor()` — cursor para ejecutar comandos.
3. `cur.copy(...)` — context del flujo de COPY.

Dentro del bloque `copy`, llamas `copy.write_row(tupla)` por cada fila. Psycopg 3 maneja la serialización binaria correctamente: types Python (str, int, datetime, UUID, dict) se mapean a tipos PostgreSQL sin conversiones manuales.

### COPY con JSONB

Para insertar registros directamente en `record` con `data` como dict Python:

```python
import json
import uuid

rows = [
    (uuid.uuid4(), system_id, entity_id, "active",
     json.dumps({"codigo": "FD-001", "nombre": "Fondo A", "activo": True})),
    (uuid.uuid4(), system_id, entity_id, "active",
     json.dumps({"codigo": "FD-002", "nombre": "Fondo B", "activo": True})),
]

with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur:
        with cur.copy(
            "COPY record (id, system_id, entity_id, status, data) FROM STDIN"
        ) as copy:
            for row in rows:
                copy.write_row(row)
```

**Nota**: el `data` debe ir como string JSON para `COPY`. PostgreSQL lo parsea al tipo JSONB en la inserción. Si lo pasas como dict Python, Psycopg no sabe convertirlo automáticamente en este contexto.

### COPY desde un archivo

Cuando el origen es un CSV:

```python
with open("legacy_records.csv", "rb") as f:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            with cur.copy("COPY record (id, system_id, entity_id, status, data) FROM STDIN WITH (FORMAT csv, HEADER true)") as copy:
                while data := f.read(8192):
                    copy.write(data)
```

### Convención: scripts de importación viven aparte

Estos scripts NO viven dentro de `app/`. Viven en un directorio separado, por ejemplo `scripts/imports/`:

```
scripts/
  imports/
    seed_metadata.py
    import_legacy_fondos.py
```

Razón: no son parte del motor productivo. Son operaciones puntuales que se ejecutan a mano o como cron, con sus propias preocupaciones (logging detallado, reanudabilidad, validación previa). Mezclarlos con el código del motor confunde la frontera "qué corre siempre" vs "qué corre una vez".

---

## 5. Qué aprender y qué dejar para después

### Aprende esto al inicio

- **Conexión básica**: `psycopg.connect(dsn)` con context manager.
- **Transacciones**: el `with` ya las maneja; commit al final, rollback en excepción.
- **`COPY`**: la API del cursor `cur.copy(...)` y `write_row()`.

Con esto cubres el 100% de los casos donde necesitarás Psycopg directo en un motor v1.

### Déjalo para después

- **Capa async** (`psycopg.AsyncConnection`): es buena, pero el motor v1 es sincrónico. Async añade complejidad sin pagarse aún.
- **Server-side cursors** para resultados gigantes.
- **`pipeline` mode** para optimización extrema.
- **Tipos custom** (`register_adapter`, `register_loader`).
- **`LISTEN` / `NOTIFY`** para events PostgreSQL.

Cuando el motor crezca a v2 y tengas necesidades específicas, vuelves a la documentación de Psycopg. No las estudies preventivamente.

---

## Anti-patrones a detectar

Cuando revises código de un usuario que use Psycopg, busca:

- **Psycopg directo para CRUD normal**: el usuario abre una conexión cruda dentro de un endpoint FastAPI, ejecuta un `INSERT` con SQL crudo, cierra. Solución: usa SQLAlchemy. Te ahorra 20 líneas y te da mapping de tipos automático.
- **Una conexión Psycopg global compartida**: igual que con SQLAlchemy, las conexiones no son thread-safe ni task-safe. Solución: una conexión por operación, manejada con context manager.
- **`INSERT ... VALUES` repetido en bucle Python para cargar miles de registros**: lentísimo. Solución: `COPY`.
- **`copy.write_row(dict)` con un dict Python esperando JSONB**: no funciona. Solución: serializa con `json.dumps()` antes.
- **Mezcla de conexión Psycopg y sesión SQLAlchemy en la misma transacción**: imposible coordinar. Solución: una u otra, no ambas.

---

## Resumen del rol de Psycopg 3 en el motor

Una sola frase:

> Psycopg 3 es **invisible** en el día a día (vive bajo SQLAlchemy) y **brilla** en el día de la importación masiva (vía `COPY`).

Si entiendes ese rol, ya entiendes lo que el motor v1 necesita de Psycopg.
