# SQLAlchemy 2.0: persistencia real y control fino

SQLAlchemy es la capa que conecta el código Python con PostgreSQL. En este motor, **se usa puro** (no SQLModel), porque el motor necesita control fino sobre tipos PostgreSQL específicos (JSONB), mutaciones sobre diccionarios, sesiones, y queries con operadores nativos del dialecto.

Este archivo cubre lo mínimo que debes dominar de SQLAlchemy 2.0 para construir y operar el motor.

## Tabla de contenidos

1. Las piezas que debes dominar (Engine, Session, DeclarativeBase, Mapped)
2. Modelo ORM mínimo de `record`
3. Por qué `MutableDict` importa tanto (y qué pasa sin él)
4. La regla de concurrencia que no se rompe
5. Las consultas mínimas que debes saber escribir
6. Relaciones en el motor: tabla real, no JSON
7. Práctica sugerida

---

## 1. Las piezas que debes dominar

| Pieza | Qué representa |
|---|---|
| `Engine` | La fábrica de conexiones a la base. Se crea **una vez** por proceso. |
| `Session` | Una unidad de trabajo transaccional. **Una por request**, nunca compartida. |
| `DeclarativeBase` | La clase base de la que heredan tus modelos ORM. |
| `Mapped` y `mapped_column()` | El estilo moderno (2.0) para declarar atributos tipados. |

SQLAlchemy 2.0 recomienda explícitamente a usuarios nuevos empezar por el Unified Tutorial y el estilo moderno con `DeclarativeBase`, `Mapped[...]` y `mapped_column()`. **No uses el estilo legacy de `Column(...)` directo en clases.**

### Engine

```python
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql+psycopg://user:pass@localhost:5432/db",
    pool_pre_ping=True,
)
```

`postgresql+psycopg://` selecciona Psycopg 3 como driver. `pool_pre_ping=True` evita conexiones zombie tras reinicios de la BD.

### Session

```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    # trabajo transaccional
    ...
```

El context manager garantiza commit/rollback/close apropiados.

### DeclarativeBase

```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
```

Todos tus modelos heredan de `Base`. La metadata combinada de `Base` es lo que Alembic compara contra la base real para autogenerar migraciones.

---

## 2. Modelo ORM mínimo de `record`

Este es el modelo canónico del motor. Memorízalo: aparecen aquí todas las decisiones críticas.

```python
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Record(Base):
    __tablename__ = "record"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuidv7()"),
    )
    system_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("system_definition.id"),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entity_definition.id"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        nullable=False,
        server_default=text("'active'"),
    )
    data: Mapped[dict] = mapped_column(
        MutableDict.as_mutable(JSONB),
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
```

Decisiones que NO son negociables:

- **`UUID(as_uuid=True)`** del dialecto PostgreSQL: te da objetos `uuid.UUID` en Python, no strings.
- **`server_default=text("uuidv7()")`**: el server genera el ID. Coherente con el SQL del esquema base.
- **`MutableDict.as_mutable(JSONB)`**: ver sección siguiente. Es CRÍTICO.
- **`index=True` en `entity_id`**: la mayoría de queries listan registros por entidad.

---

## 3. Por qué `MutableDict` importa tanto

Esta es probablemente la decisión técnica más fácil de pasar por alto y la más dolorosa cuando se descubre tarde.

### El problema sin `MutableDict`

```python
# columna declarada como  data: Mapped[dict] = mapped_column(JSONB)

record = session.get(Record, some_id)
record.data["nombre"] = "Nuevo nombre"   # mutación in-place
session.commit()                          # ← puede NO persistir el cambio
```

Visualmente cambiaste el dict, pero SQLAlchemy detecta cambios mirando si el **atributo** se reasignó, no si su contenido mutó. El dict es el mismo objeto, así que no hay "dirty flag".

### Soluciones

**Opción A (la del manual): `MutableDict`**

```python
data: Mapped[dict] = mapped_column(MutableDict.as_mutable(JSONB), ...)
```

`MutableDict` envuelve el dict de forma que cualquier mutación (set, del, update, pop) marca el atributo como dirty. SQLAlchemy lo detecta y lo persiste.

**Opción B: reasignar siempre**

```python
record.data = {**record.data, "nombre": "Nuevo nombre"}
```

Esto reasigna el atributo, lo que SÍ se detecta sin `MutableDict`. Pero es ergonómicamente peor y propenso a olvidos en el código de la aplicación.

**La doctrina del manual elige A.** En un motor donde `data` es JSONB y se modifica con frecuencia (parches parciales, actualización de campos individuales), `MutableDict` deja de ser opcional.

---

## 4. La regla de concurrencia que no se rompe

> `Session` y `AsyncSession` **no deben compartirse entre threads ni tareas concurrentes**. Son unidades de trabajo no concurrentes.

Esto está documentado explícitamente en SQLAlchemy. La regla operativa concreta:

- **Una sesión por request HTTP.** No por aplicación, no por servicio.
- **Cerrar al final del request.** El context manager `with Session(engine) as session:` lo hace.
- **No reutilizarla entre tareas concurrentes.** Si lanzas un `BackgroundTask` que necesita BD, ese task crea su propia sesión.

El error que produce romper esta regla es traicionero: bugs intermitentes de transacciones que se cruzan, queries que se ejecutan en orden inesperado, registros que parecen "desaparecer". Imposibles de reproducir, brutales en producción.

### Implementación correcta

```python
from collections.abc import Generator
from sqlalchemy.orm import Session

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

# en el endpoint:
@router.post(...)
def create_record(..., session: Session = Depends(get_session)):
    ...
```

`Depends(get_session)` garantiza una sesión nueva por request.

---

## 5. Consultas mínimas que sí debes saber escribir

Estas son las cuatro operaciones de las que no escapas en este motor.

### Insertar

```python
record = Record(
    system_id=system_id,
    entity_id=entity_id,
    data={"codigo": "FD-001", "nombre": "Fondo Central", "activo": True},
)
session.add(record)
session.commit()
session.refresh(record)   # trae los defaults del server (id, created_at, updated_at)
```

### Buscar por entidad

```python
from sqlalchemy import select

stmt = select(Record).where(Record.entity_id == entity_id)
rows = session.execute(stmt).scalars().all()
```

### Buscar por contenido JSONB (containment)

```python
stmt = select(Record).where(
    Record.entity_id == entity_id,
    Record.data.contains({"codigo": "FD-001"}),
)
```

`Record.data.contains({...})` se traduce al operador PostgreSQL `@>`. El dialecto PostgreSQL de SQLAlchemy soporta tipos JSON/JSONB y sus operadores nativos.

### Verificar si existe una clave

```python
stmt = select(Record).where(Record.data.has_key("nombre"))
```

`has_key` se traduce al operador `?` de PostgreSQL.

### Otros operadores útiles

- `Record.data["nombre"].astext` → equivale a `data->>'nombre'`. Útil para comparaciones de string.
- `Record.data["edad"].as_integer()` → equivale a `(data->>'edad')::int`.

---

## 6. Relaciones en el motor

**No todas las relaciones van en JSON.** Las relaciones fuertes deben ir en tablas reales.

Ejemplos de relaciones que NO van en JSON:

- Una `serie` pertenece a una `subserie`.
- Una `dependencia` se asocia a una `trd`.
- Un `activo` pertenece a una `sede`.

Esto se modela con `record_relation` y opcionalmente con `relación_definition` para declarar qué relaciones son válidas.

### Anti-patrón a detectar

```json
// MAL: relación dentro del JSONB del registro
{
  "data": {
    "codigo": "S-001",
    "nombre": "Serie Contratos",
    "subserie_id": "0195f4d2-..."   // ← clave foránea perdida en JSON
  }
}
```

Lo que se pierde: integridad referencial, JOIN eficiente, índices, claridad del modelo.

### Diseño correcto

```python
class RecordRelation(Base):
    __tablename__ = "record_relation"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuidv7()"),
    )
    relation_definition_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("relation_definition.id"), nullable=False
    )
    from_record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("record.id"), nullable=False
    )
    to_record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("record.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
```

Y para preguntar "qué subserie tiene la serie X":

```python
stmt = (
    select(Record)
    .join(RecordRelation, Record.id == RecordRelation.to_record_id)
    .where(RecordRelation.from_record_id == serie_id)
    .where(RecordRelation.relation_definition_id == rel_serie_subserie_id)
)
```

---

## 7. Práctica sugerida

Antes de exponer el motor por API, valida que dominas la persistencia con este ejercicio:

1. Crea la tabla `record` con SQLAlchemy y migra con Alembic.
2. Inserta tres registros desde una sesión interactiva.
3. Modifica `record.data["nombre"]` de uno y haz `commit()`. Verifica con `SELECT data FROM record WHERE id = ...` directamente en `psql` que el cambio se persistió. **Si no se persiste, verifica que estás usando `MutableDict.as_mutable(JSONB)`.**
4. Busca con `Record.data.contains({"codigo": "X"})`.
5. Busca con `Record.data.has_key("nombre")`.

Si entiendes esos cinco pasos, ya entiendes la mitad de la persistencia del motor. La otra mitad son las relaciones, que se resuelven con el patrón `record_relation` de la sección 6.
