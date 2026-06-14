# FastAPI: cómo exponer el motor como API limpia

FastAPI es la capa HTTP del motor. Para este motor **no necesitas aprender todo FastAPI**, solo seis piezas. Este archivo cubre exactamente esas piezas y cómo se usan en el contexto del motor.

## Tabla de contenidos

1. Qué aprender de FastAPI y qué no
2. La dependencia más importante: `get_session`
3. La respuesta estable con `response_model`
4. Endpoint de creación, paso a paso
5. `lifespan` y arranque limpio
6. Configuración por entorno con Pydantic Settings
7. Testing con `dependency_overrides`
8. Práctica sugerida

---

## 1. Qué aprender de FastAPI y qué no

Para este motor solo necesitas dominar:

- **`APIRouter`** — para organizar endpoints por dominio.
- **`Depends`** — para inyección de dependencias (sesión de BD, settings, servicios).
- **`response_model`** — para tipar, documentar, validar y filtrar la salida.
- **`lifespan`** — para startup/shutdown limpios.
- **Settings por entorno** — con Pydantic Settings.
- **Testing con `dependency_overrides`** — para inyectar sesión de prueba.

Todo lo demás (WebSockets avanzados, GraphQL, OAuth flows complejos) viene **después** y solo si el dominio lo necesita.

---

## 2. La dependencia más importante: `get_session`

```python
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

engine = create_engine("postgresql+psycopg://user:pass@localhost/db")

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

Por qué es la dependencia más importante:

- Garantiza **una sesión por request**, alineado con la regla de oro de SQLAlchemy.
- El context manager se encarga de commit/rollback/close.
- Es trivial de **sustituir en tests** vía `app.dependency_overrides`.

En el endpoint:

```python
@router.post("/...")
def handler(session: Session = Depends(get_session)):
    ...
```

---

## 3. La respuesta estable con `response_model`

`response_model` en FastAPI hace **cuatro cosas a la vez**: documenta en OpenAPI, valida la salida, convierte tipos, y filtra campos no declarados.

```python
from pydantic import BaseModel, JsonValue
from uuid import UUID

class RecordOut(BaseModel):
    id: UUID
    system_code: str
    entity_code: str
    status: str
    data: dict[str, JsonValue]
```

Decisión de diseño: **el sobre del response es estable**, aunque el contenido de `data` varíe por entidad. Esto es lo que vuelve a la API "predecible desde el cliente": el cliente sabe que SIEMPRE va a recibir `{id, system_code, entity_code, status, data}`.

### Nota de performance

Cuando uses `response_model` o un return type tipado, FastAPI puede serializar el Pydantic directamente a JSON. **No** envuelvas en `JSONResponse(jsonable_encoder(...))`: esa ruta es más lenta. Devuelve el modelo Pydantic o un dict y deja que FastAPI haga lo correcto.

---

## 4. Endpoint de creación, paso a paso

Este es el endpoint canónico del motor. Léelo entendiendo qué hace cada paso.

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

router = APIRouter(prefix="/systems", tags=["records"])

@router.post(
    "/{system_code}/entities/{entity_code}/records",
    response_model=RecordOut,
)
def create_record(
    system_code: str,
    entity_code: str,
    body: CreateRecordRequest,
    session: Session = Depends(get_session),
):
    # 1. Resolver sistema
    system = get_system_by_code(session, system_code)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    # 2. Resolver entidad
    entity = get_entity_by_code(session, system.id, entity_code)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # 3. Cargar metadata de campos
    field_defs = list_fields_for_entity(session, entity.id)

    # 4. Construir modelo Pydantic dinámico
    PayloadModel = build_payload_model(entity.code, field_defs)

    # 5. Validar contenido dinámico (strict)
    try:
        validated = PayloadModel.model_validate(body.data, strict=True)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors())

    # 6. Persistir
    record = persist_record(session, system.id, entity.id, validated.model_dump())

    # 7. Responder con sobre estable
    return RecordOut(
        id=record.id,
        system_code=system.code,
        entity_code=entity.code,
        status=record.status,
        data=record.data,
    )
```

Cada paso tiene su propósito y ningún paso es opcional. Si saltas el paso 4, no estás en un motor metadata-driven; estás en un motor que acepta cualquier basura.

---

## 5. `lifespan` y arranque limpio

FastAPI recomienda `lifespan` como la forma actual de manejar startup y shutdown. **Si defines `lifespan`, los handlers viejos `@app.on_event("startup")` y `@app.on_event("shutdown")` ya no se usan.**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.state.metadata_cache = {}
    yield
    # shutdown
    app.state.metadata_cache.clear()

app = FastAPI(lifespan=lifespan)
```

Úsalo para:

- Preparar caches ligeros (por ejemplo, el caché de modelos Pydantic dinámicos por entidad).
- Abrir y cerrar recursos globales (clientes HTTP externos, conexiones a brokers).
- Inicializar componentes compartidos.

**No** uses `lifespan` para crear una sesión global de SQLAlchemy. Eso rompe la regla de "una sesión por request".

---

## 6. Configuración por entorno con Pydantic Settings

FastAPI documenta el uso de `pydantic-settings` con `.env`, `Depends` y `@lru_cache`. Patrón canónico:

```python
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "motor-dinamico"
    database_url: str
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

En endpoint o servicio:

```python
@router.get("/health")
def health(settings: Settings = Depends(get_settings)):
    return {"app": settings.app_name}
```

`@lru_cache` garantiza que `Settings` se construye una sola vez por proceso (lee el `.env` una sola vez). En tests, sustituyes `get_settings` con `dependency_overrides` para inyectar settings diferentes.

Variables esperadas en `.env`:

```
APP_DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/motor
APP_LOG_LEVEL=DEBUG
```

---

## 7. Testing con `dependency_overrides`

FastAPI permite reemplazar dependencias durante pruebas usando `app.dependency_overrides`. Es exactamente el mecanismo que necesitas para tests aislados.

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.main import app
from app.db import get_session

# Engine de test (idealmente apuntando a una BD de test, no SQLite — el motor depende de jsonb)
test_engine = create_engine("postgresql+psycopg://test:test@localhost/motor_test")

def get_test_session():
    with Session(test_engine) as session:
        yield session

@pytest.fixture
def client():
    app.dependency_overrides[get_session] = get_test_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_create_record(client):
    response = client.post(
        "/systems/gestion_documental/entities/fondo_documental/records",
        json={"data": {"codigo": "FD-T1", "nombre": "Test", "activo": True}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["codigo"] == "FD-T1"
```

**No uses SQLite en estos tests.** El motor depende de tipos PostgreSQL (`uuid`, `jsonb`, `timestamptz`) y operadores específicos del dialecto. Los tests deben correr contra una PostgreSQL real (puedes usar `testcontainers-python` o un schema de test).

---

## 8. Práctica sugerida

Antes de seguir construyendo, valida que tienes el borde HTTP encaminado con estos endpoints mínimos:

- `POST /systems` — crear un sistema.
- `POST /systems/{system_code}/entities` — crear una entidad.
- `POST /systems/{system_code}/entities/{entity_code}/records` — crear un registro (este es el complejo, el del paso 4 de arriba).
- `GET /systems/{system_code}/entities/{entity_code}/records` — listar registros.

Si consigues los cuatro con:

- Respuestas tipadas (`response_model`).
- Sesión por request (`Depends(get_session)`).
- 404 para metadata faltante.
- 422 para validación dinámica fallida.

…entonces el borde HTTP del motor ya tiene calidad de núcleo. Todo lo demás (búsqueda, filtros, relaciones, paginación) son **extensiones del mismo patrón**, no problemas nuevos.

---

## Anti-patrones a detectar en endpoints

Cuando revises código FastAPI de un usuario que esté construyendo un motor, busca:

- **Sesión global compartida** (no usa `Depends(get_session)`). Solución: sesión por request.
- **`response_model` ausente**. Solución: declararlo siempre. Es 4 funciones en una.
- **Validación dinámica saltada**: el endpoint guarda `body.data` directo en `record.data` sin pasar por `build_payload_model`. Solución: validar SIEMPRE contra metadata.
- **`HTTPException` con `detail=str(exc)`** en errores de validación. Solución: usar `exc.errors()` para que el cliente reciba estructura.
- **Mezcla de `models/` y `schemas/`**: la misma clase usada como ORM y como response. Solución: separar SQLAlchemy ORM (capa de persistencia) de Pydantic schemas (capa de contrato). Convertir entre ambos con `from_attributes=True`.
