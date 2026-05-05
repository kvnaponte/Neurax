# Pydantic v2: validación fija y validación dinámica

Pydantic hace **dos trabajos diferentes** en este motor, y es importante no confundirlos:

1. Validar **esquemas fijos** de la API (los contratos HTTP, request/response).
2. Validar **esquemas dinámicos** construidos en runtime a partir de `field_definition`.

Este archivo cubre ambos, con énfasis en el segundo, que es lo que vuelve "dinámico" al motor.

## Tabla de contenidos

1. Lo básico que debes dominar (`BaseModel`, `Field`, `model_config`, `from_attributes`)
2. Strict mode: por qué importa en un motor metadata-driven
3. `TypeAdapter`: validar tipos sin definir un BaseModel
4. `JsonValue`: el tipo correcto para `data`
5. `create_model()`: el corazón de la validación dinámica
6. Qué valida el motor en v1 y qué viene después
7. Práctica sugerida

---

## 1. Lo básico que debes dominar

### `BaseModel`

Para contratos claros y fijos. Úsalo en los schemas de la API.

```python
from pydantic import BaseModel

class CreateRecordRequest(BaseModel):
    data: dict
```

### `Field`

Para metadatos y restricciones declarativas.

```python
from pydantic import BaseModel, Field

class PaginationQuery(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
```

### `model_config`

Para configurar comportamiento del modelo (modo strict por defecto, alias, validación de asignaciones, etc.).

```python
from pydantic import BaseModel, ConfigDict

class Strict(BaseModel):
    model_config = ConfigDict(strict=True)
    value: int
```

### `from_attributes=True`

Permite convertir objetos ORM (con atributos, no claves) a modelos Pydantic sin hacer `dict()` manual.

```python
class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    status: str
    data: dict
```

Después: `RecordOut.model_validate(record_orm_object)` simplemente funciona.

---

## 2. Strict mode

Por defecto, Pydantic puede intentar **convertir** tipos. En contextos de UI con strings urlencoded a veces ayuda; en un motor metadata-driven es **peligroso**.

### Ejemplo del problema

- El usuario envía `"true"` (string).
- El campo en metadata dice `data_type: boolean`.
- Sin strict, Pydantic puede convertirlo a `True`.
- Resultado: estás aceptando datos sucios. La metadata dice booleano, pero estás guardando lo que llegue.

### Con strict mode

```python
from pydantic import TypeAdapter

adapter = TypeAdapter(int)
adapter.validate_python(123, strict=True)    # OK
adapter.validate_python("123", strict=True)  # ValidationError
```

Para un motor donde los tipos vienen de `field_definition`, **siempre** valida el contenido dinámico en strict mode. Lo que llega tiene que coincidir literalmente con el tipo declarado.

Tres formas de invocarlo:

- A nivel de llamada: `model.model_validate(data, strict=True)`.
- A nivel de `TypeAdapter`: `adapter.validate_python(value, strict=True)`.
- A nivel de modelo: `model_config = ConfigDict(strict=True)`.

---

## 3. `TypeAdapter`

`TypeAdapter` es clave cuando quieres validar tipos o estructuras **sin definir un BaseModel fijo**. Es la herramienta correcta para validar fragmentos sueltos: una lista, un dict, un tipo unión.

```python
from pydantic import TypeAdapter

adapter = TypeAdapter(list[int])
values = adapter.validate_python([1, 2, 3], strict=True)
# values == [1, 2, 3]

adapter.validate_python([1, "2", 3], strict=True)
# ValidationError: "2" no es int en strict
```

En este motor lo usarás especialmente para validar el modelo dinámico construido con `create_model()`.

---

## 4. `JsonValue`

Pydantic define `JsonValue` como un tipo que representa **cualquier valor serializable a JSON**: `str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]`.

Es exactamente el tipo correcto para describir el contenido del sobre `data` en la respuesta de la API:

```python
from pydantic import BaseModel, JsonValue
from uuid import UUID

class RecordResponse(BaseModel):
    id: UUID
    system_code: str
    entity_code: str
    status: str
    data: dict[str, JsonValue]
```

Esto comunica con precisión: "el `data` es un dict cuyas claves son strings y cuyos valores son cualquier cosa JSON-válida". Mejor que `dict` o `dict[str, Any]`.

---

## 5. `create_model()`: el corazón de la validación dinámica

Aquí empieza la parte realmente importante. Esta es la pieza que hace que el motor sea metadata-driven.

### El input: definiciones desde la base

```python
field_defs = [
    {"code": "codigo", "data_type": "string",  "required": True},
    {"code": "nombre", "data_type": "string",  "required": True},
    {"code": "activo", "data_type": "boolean", "required": False},
]
```

Esto viene de `field_definition` filtrado por `entity_id`.

### El builder

```python
from typing import Any
from pydantic import TypeAdapter, create_model

TYPE_MAP: dict[str, type] = {
    "string":  str,
    "integer": int,
    "number":  float,
    "boolean": bool,
}

def build_payload_model(entity_code: str, field_defs: list[dict[str, Any]]):
    fields: dict[str, tuple[Any, Any]] = {}
    for f in field_defs:
        py_type = TYPE_MAP[f["data_type"]]
        if f["required"]:
            fields[f["code"]] = (py_type, ...)            # requerido
        else:
            fields[f["code"]] = (py_type | None, None)    # opcional con default None
    return create_model(f"{entity_code.title()}Payload", **fields)
```

`create_model("Name", field_a=(str, ...), field_b=(int, 0))` produce una clase Pydantic equivalente a haberla escrito a mano.

### El uso

```python
PayloadModel = build_payload_model("fondo_documental", field_defs)

validated = TypeAdapter(PayloadModel).validate_python(
    {
        "codigo": "FD-001",
        "nombre": "Fondo Central",
        "activo": True,
    },
    strict=True,
)

payload = validated.model_dump()
# payload está validado, tipado y listo para guardarse en record.data
```

### Caché obligatorio en producción

Construir el modelo en cada request es caro. En un servicio real:

- Cachea por `(entity_id, version_de_metadata)`.
- Invalida el caché cuando cambian `field_definition` o se agrega/quita un campo.
- Una opción simple: un dict en memoria del proceso, key = `entity_id`, value = `(payload_model, fields_hash)`.

El manual no insiste en esto en v1 para no agregar complejidad, pero es lo correcto para v2+.

---

## 6. Qué valida el motor y qué no (en v1)

### Validaciones que el motor v1 debe garantizar

- ¿El campo existe en la metadata? (los campos no declarados se rechazan).
- ¿El tipo coincide? (con strict mode).
- ¿Vino el campo requerido? (si `required=True` y falta → error).
- ¿Vinieron campos prohibidos? (campos no declarados → error).
- ¿El valor cumple restricciones simples? (las que vengan de `Field`).

### Validaciones que vienen después (v2+)

- Regex sobre strings (`{"regex": "^FD-[0-9]+$"}` en `field_definition.config`).
- Longitud mínima/máxima.
- Catálogos cerrados (enums dinámicos).
- Unicidad lógica (no del schema, sino del dominio: "no puede haber dos fondos con el mismo código").
- Validaciones cruzadas entre campos (si A entonces B).

Para que estas validaciones funcionen, `field_definition.config` (que es jsonb) se vuelve la fuente de verdad. El builder `build_payload_model` se extiende para leer ese config y traducirlo a `Field(pattern=..., min_length=..., max_length=...)`.

---

## 7. Práctica sugerida

Antes de escribir la versión productiva, haz este ejercicio:

1. Toma tres campos hardcodeados (uno requerido string, uno opcional bool, uno requerido int).
2. Constrúyelos con `create_model()`.
3. Valida un payload **correcto** → debe pasar.
4. Valida uno con un **tipo incorrecto** → mira el `ValidationError` exacto que produce Pydantic.
5. Valida uno con un **campo faltante** → mira el error.
6. Valida uno con un **campo extra no declarado** → decide: ¿lo aceptas y lo ignoras, o lo rechazas? (la respuesta correcta para este motor es **rechazarlo**, configurando `model_config = ConfigDict(extra="forbid")`).

Cuando entiendas el shape de los `ValidationError` de Pydantic, diseñar el handler 422 de FastAPI para que devuelva información útil al cliente se vuelve trivial.

---

## Patrón de integración: el endpoint completo

Así se ve el uso conjunto de todo lo anterior dentro de un endpoint FastAPI:

```python
@router.post("/{system_code}/entities/{entity_code}/records",
             response_model=RecordOut)
def create_record(
    system_code: str,
    entity_code: str,
    body: CreateRecordRequest,
    session: Session = Depends(get_session),
):
    system = get_system_by_code(session, system_code)
    if not system:
        raise HTTPException(404, "System not found")

    entity = get_entity_by_code(session, system.id, entity_code)
    if not entity:
        raise HTTPException(404, "Entity not found")

    field_defs = list_fields_for_entity(session, entity.id)
    PayloadModel = build_payload_model(entity.code, field_defs)

    try:
        validated = PayloadModel.model_validate(body.data, strict=True)
    except ValidationError as exc:
        raise HTTPException(422, exc.errors())

    record = persist_record(session, system.id, entity.id, validated.model_dump())

    return RecordOut(
        id=record.id,
        system_code=system.code,
        entity_code=entity.code,
        status=record.status,
        data=record.data,
    )
```

Lo elegante de este patrón: el contrato HTTP es estable (`CreateRecordRequest` con `data: dict`, `RecordOut` con `data: dict[str, JsonValue]`), pero la validación interna es completamente dinámica. El cliente envía un `data` arbitrario, y el motor lo valida contra la metadata viva.
