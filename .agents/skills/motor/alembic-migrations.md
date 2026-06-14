# Alembic: cómo evoluciona el esquema sin caos

Alembic es la herramienta oficial de migraciones del ecosistema SQLAlchemy. Para este motor **no es un accesorio, es parte del motor**: el esquema cambia con el tiempo y los cambios deben ser controlados, repetibles y versionados.

## Tabla de contenidos

1. Qué problema resuelve Alembic
2. Qué significa "migrar" en este proyecto
3. Flujo mínimo correcto
4. Qué hace `autogenerate` y qué NO debes asumir
5. Branches de migración
6. Práctica sugerida
7. Anti-patrones de migración a detectar

---

## 1. Qué problema resuelve Alembic

> El esquema cambia con el tiempo, pero la base real debe cambiar de forma **controlada, repetible y versionada**.

Sin Alembic:
- Cada desarrollador tiene su propio "yo creé esa columna a mano".
- Producción y staging divergen.
- No hay rollback claro de un cambio.
- El historial del esquema vive en la cabeza de alguien.

Con Alembic:
- Cada cambio es un archivo Python versionado en el repo.
- `alembic upgrade head` es la fuente única de verdad para "llevar la BD al estado actual".
- Cada migración tiene `up` y `down`, así que hay rollback explícito (cuando la migración no es destructiva).

---

## 2. Qué significa "migrar" en este proyecto

En el motor metadata-driven, "migrar" no es solo "crear tablas". También es:

- Agregar **índices** (GIN sobre `record.data`, índices de expresión sobre rutas JSON).
- Agregar **restricciones** (UNIQUE en `(system_id, code)`, CHECK).
- Introducir **tablas nuevas del metamodelo** cuando el motor crece (por ejemplo, `permission_definition`).
- **Refinar columnas del sobre fijo** (promover un campo de jsonb a columna real cuando se vuelve crítico).
- Mantener **historial** de todos esos cambios.

**Lo que NO migras**: cambios en `data` de registros individuales, cambios en `field_definition` (eso es operación de runtime del motor, no DDL).

Distinción importante:
- **DDL del motor** → Alembic.
- **DML de metadata** (insertar nuevos `system_definition`, `entity_definition`) → API o seeds, no Alembic.

---

## 3. Flujo mínimo correcto

### Inicializar

```bash
alembic init migrations
```

Esto crea la estructura:
```
migrations/
  env.py            ← se configura aquí
  script.py.mako
  versions/
alembic.ini
```

### Configurar `env.py` para que apunte a la metadata de SQLAlchemy

En `migrations/env.py`, busca `target_metadata = None` y reemplaza:

```python
from app.models.base import Base
import app.models  # importa todos los modelos para que registren su metadata

target_metadata = Base.metadata
```

Importar el paquete `app.models` es importante: si solo importas `Base`, los modelos individuales no se cargan y `autogenerate` no los ve.

También configura la URL de BD desde settings:

```python
from app.config import get_settings
config.set_main_option("sqlalchemy.url", get_settings().database_url)
```

### Crear migración candidata

```bash
alembic revision --autogenerate -m "create base metadata tables"
```

Esto produce un archivo en `migrations/versions/<hash>_create_base_metadata_tables.py`.

### Revisarla a mano

Esta es la parte que **nadie debe saltarse**. Ver sección 4.

### Aplicarla

```bash
alembic upgrade head
```

Para retroceder un paso:
```bash
alembic downgrade -1
```

Para ver historial:
```bash
alembic history --verbose
```

---

## 4. Qué hace `autogenerate` y qué NO debes asumir

`autogenerate` compara el estado actual de la base con la metadata declarada en SQLAlchemy y genera migraciones candidatas para las **diferencias evidentes**.

### Lo que SÍ detecta bien

- Tablas nuevas o eliminadas.
- Columnas nuevas o eliminadas.
- Cambios de tipo en columnas (parcialmente).
- Foreign keys nuevas.

### Lo que NO detecta (o detecta mal)

- **Cambios en `server_default`**: si cambias `default=text("now()")` a `default=text("clock_timestamp()")`, autogenerate puede no notarlo.
- **Renombrar columnas**: lo verá como `drop` + `add`, lo que **destruye datos**.
- **Renombrar tablas**: igual, drop + create.
- **Índices con expresiones complejas**: `CREATE INDEX ... ON record USING GIN (jsonb_to_tsvector(...))`. Autogenerate no infiere índices de expresión a partir de SQLAlchemy si no los declaraste explícitamente.
- **Cambios en `CHECK`**.
- **Permisos, ownership, comments**.

### Qué revisar manualmente en cada migración generada

1. **Nombres de índices**: SQLAlchemy puede generar nombres largos y feos. Renombra a `ix_table_column` legible.
2. **`server_default`**: verifica que coincide con tu intención.
3. **Columnas JSONB**: verifica que están como `JSONB` y no `JSON` plano.
4. **Constraints**: ¿está la UNIQUE compuesta correcta?
5. **Operaciones destructivas**: cualquier `op.drop_column`, `op.drop_table`, `op.alter_column` que cambia tipo. ¿Hay backup? ¿Hay backfill necesario?

**Regla de oro**: la migración generada es un **borrador**. Tu trabajo es revisarla, ajustarla, y solo entonces hacer commit y aplicar.

### Ejemplo de migración revisada manualmente

```python
def upgrade():
    op.create_table(
        "record",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("uuidv7()")),
        sa.Column("system_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'active'")),
        sa.Column("data", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["system_id"], ["system_definition.id"]),
        sa.ForeignKeyConstraint(["entity_id"], ["entity_definition.id"]),
    )
    op.create_index("ix_record_entity_id", "record", ["entity_id"])
    op.create_index(
        "ix_record_data_gin",
        "record",
        ["data"],
        postgresql_using="gin",
    )

def downgrade():
    op.drop_index("ix_record_data_gin", table_name="record")
    op.drop_index("ix_record_entity_id", table_name="record")
    op.drop_table("record")
```

Observa que el índice GIN se agregó **a mano** porque autogenerate no lo infirió.

---

## 5. Branches de migración

Los branches aparecen cuando dos líneas de desarrollo crean revisiones con el mismo padre. Suele pasar cuando dos personas crean migraciones en paralelo desde la misma `head`.

```
                    ┌── revision_A ──┐
                    │                 │
revision_base ──────┤                 ├── revision_merge
                    │                 │
                    └── revision_B ──┘
```

Alembic lo documenta como caso natural y provee `alembic merge`:

```bash
alembic merge -m "merge feature-X and feature-Y" <revision_A> <revision_B>
```

Eso crea una revisión "vacía" cuya función es ser hija de ambas y unificar las heads.

**Debes saber que existen** incluso antes de necesitarlos. Cuando aparezcan en tu equipo, no entrarás en pánico.

---

## 6. Práctica sugerida

Para dominar el flujo de migraciones del motor, haz estos tres ejercicios:

1. **Migración inicial**: crea las seis tablas base del metamodelo en una sola migración. Revisa que los `server_default` y los UNIQUE compuestos están correctos.

2. **Migración de índices**: en una segunda migración, agrega:
   - Índice GIN sobre `record.data`.
   - Índice de expresión sobre `data->>'codigo'` para `record`.
   - Índice GIN sobre `jsonb_to_tsvector('spanish', data, '["string"]')` para búsqueda full-text.

   Ninguno de estos lo va a inferir autogenerate; los escribes a mano con `op.execute("CREATE INDEX ...")` o con `postgresql_using="gin"`.

3. **Branch resuelto**: en un repo de práctica, crea dos ramas que cada una agregue una columna distinta a `record`. Mergéa ambas y resuelve el branch con `alembic merge`.

---

## 7. Anti-patrones de migración a detectar

Cuando revises el flujo de migraciones de un usuario, busca:

- **`alembic upgrade head` ejecutado sin leer el archivo generado**. Solución: hacer code review de las migraciones como de cualquier otro PR.
- **Renombrado de columna que autogenerate convirtió en drop+add**. Solución: editar la migración manualmente, usar `op.alter_column(..., new_column_name=...)`.
- **Defaults perdidos** porque autogenerate no detectó el `server_default`. Solución: agregar `server_default=sa.text(...)` explícitamente.
- **Migraciones acumuladas en una sola revisión gigante**. Solución: una migración por cambio lógico. Múltiples cambios pequeños son más fáciles de revisar y de revertir.
- **Datos hardcodeados en migraciones** (insertar `system_definition` desde una migración). Solución: las migraciones son DDL, no DML semántico. Usa seeds o la API.
- **`downgrade()` vacío o `pass`**. Aceptable solo si la migración es genuinamente irreversible (drop con pérdida de datos), pero entonces documenta por qué.

---

## Patrón de migraciones con Alembic en este motor

Resumiendo el ciclo de vida típico de un cambio de esquema:

1. **Cambias el modelo SQLAlchemy** en `app/models/`.
2. **Generas migración candidata**: `alembic revision --autogenerate -m "descripción clara"`.
3. **Revisas el archivo generado**: nombres de índices, defaults, JSONB, operaciones destructivas, índices de expresión que autogenerate no infirió.
4. **Editas la migración** para corregir lo que autogenerate no detectó.
5. **Aplicas en local**: `alembic upgrade head`.
6. **Pruebas**: corre los tests, verifica que el motor sigue funcionando.
7. **Commit** del archivo de migración junto con el cambio del modelo.
8. **CI corre `alembic upgrade head` contra una BD limpia** para verificar que la migración funciona desde cero.
9. **Deploy**: en producción, la migración se aplica antes de que arranque el código nuevo.

Sin este ciclo, el motor empieza a divergir entre entornos. Con este ciclo, el esquema es **una sola fuente de verdad versionada**.
