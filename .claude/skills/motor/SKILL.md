---
name: motor-dinamico-metadata
description: Diseña, explica e implementa motores genéricos basados en metadatos (metadata-driven) usando FastAPI, Pydantic v2, SQLAlchemy 2.0, PostgreSQL, Alembic y Psycopg 3. Úsalo SIEMPRE que el usuario hable de construir una plataforma que soporte múltiples sistemas/dominios sin rehacer la arquitectura, mencione "motor dinámico", "metamodelo", "sistemas-entidades-campos-registros", "validación dinámica con Pydantic", "create_model", "JSONB para campos variables", "sobre fijo + contenido dinámico", "Gestión Documental + Inventario + PQRS en una sola plataforma", o cualquier proyecto donde la definición del esquema (sistemas, entidades, campos, relaciones) deba vivir en base de datos en lugar de estar fijada en tablas concretas. También úsalo cuando el usuario pida ayuda con: diseñar tablas system_definition / entity_definition / field_definition / record / record_relation, construir modelos Pydantic en runtime con create_model() y TypeAdapter, decidir qué va en columnas reales versus columnas jsonb, índices GIN o de expresión sobre JSONB, búsqueda full-text en PostgreSQL con jsonb_to_tsvector, MutableDict para detectar cambios en JSONB, sesiones SQLAlchemy por request, migraciones con Alembic en proyectos metadata-driven, o uso de Psycopg 3 directo con COPY para cargas masivas. Aplica aunque el usuario no nombre el stack completo: si describe el problema de "no quiero crear tablas nuevas por cada módulo", este es el skill. NO usar para CRUD tradicional con esquema fijo conocido desde el día uno.
---

# Motor dinámico basado en metadatos

Este skill encapsula el conocimiento completo para diseñar, explicar y construir un **motor genérico metadata-driven** sobre el stack FastAPI + Pydantic v2 + SQLAlchemy 2.0 + PostgreSQL + Alembic + Psycopg 3. La fuente de este skill es un manual de estudio publicado el 19 de abril de 2026 que sintetiza la doctrina y los ejemplos canónicos del enfoque.

Versiones de referencia consultadas: FastAPI 0.136.0, Pydantic 2.13.0, SQLAlchemy 2.0.49, PostgreSQL 18.3, Alembic 1.18.4, Psycopg 3.

## Cuándo aplica este skill

Este skill aplica cuando el problema del usuario coincide con cualquiera de estos patrones:

- Quiere construir una plataforma que mañana soporte un dominio nuevo (Gestión Documental, Inventario de Activos, PQRS, etc.) sin crear tablas nuevas por cada dominio.
- Habla de "motor dinámico", "metamodelo", "metadata-driven", "low-code", "definir entidades en runtime".
- Pregunta cómo modelar `system_definition`, `entity_definition`, `field_definition`, `record`, `record_relation`.
- Pregunta cuándo usar columnas reales versus `jsonb`.
- Quiere validar payloads cuyos campos no se conocen en tiempo de compilación (validación dinámica con Pydantic v2 `create_model()` y `TypeAdapter`).
- Pregunta por índices GIN, índices de expresión sobre `data->>'campo'`, o full-text search con `jsonb_to_tsvector`.
- Pregunta por `MutableDict.as_mutable(JSONB)` y por qué importa.
- Pregunta cómo evolucionar el esquema con Alembic en este tipo de motor.
- Pregunta cuándo usar Psycopg 3 directo en lugar de SQLAlchemy.

NO aplica para CRUD clásico con esquema cerrado, ni para proyectos donde las entidades están todas decididas desde el inicio.

## El principio rector que nunca debe olvidarse

> **Sobre fijo, contenido dinámico.**

El error más común al construir un motor dinámico es querer que TODO sea dinámico. La doctrina correcta es la opuesta:

- El **sobre** de cada registro es estable: `id`, `system_id`, `entity_id`, `status`, `data`, `created_at`, `updated_at`. Estas son columnas reales.
- El **contenido** dentro de `data` es flexible: cambia entre entidades y entre sistemas. Vive en una columna `jsonb`.

Cualquier diseño que rompa esta regla (todo en JSONB, o todo en columnas fijas) es un anti-patrón documentado en el manual.

## Las seis definiciones fundamentales

Antes de cualquier código, asegúrate de que el usuario y tú compartan estas definiciones:

- **Sistema**: dominio funcional. Ejemplos: `gestion_documental`, `inventario_activos`, `pqrs`.
- **Entidad**: tipo de objeto dentro de un sistema. Ejemplo: dentro de `gestion_documental` existen `fondo_documental`, `trd`, `dependencia`, `serie`, `subserie`.
- **Campo**: propiedad de una entidad. Ejemplo: `codigo`, `nombre`, `activo`, `soporte`.
- **Relación**: vínculo entre entidades o entre registros. Ejemplo: una `trd` pertenece a un `fondo_documental`.
- **Registro**: instancia real de una entidad. Ejemplo: el Fondo Documental "Archivo Histórico".
- **Metamodelo**: el modelo que describe cómo se describen sistemas. Suena circular, pero es exactamente eso: define cómo se define un sistema, una entidad, un campo, una relación.

El motor entero vive sobre el metamodelo.

## El stack y la división de responsabilidades

| Pieza | Rol en el motor |
|---|---|
| FastAPI | Capa HTTP, OpenAPI, dependencias, contratos fijos de entrada/salida. |
| Pydantic v2 | Dos trabajos distintos: validar contratos fijos de la API, y validar contenido dinámico construido con `create_model()` desde la metadata. |
| SQLAlchemy 2.0 | ORM y acceso a datos con control fino sobre PostgreSQL, JSONB y `MutableDict`. |
| PostgreSQL | Fuente de verdad transaccional. Provee `jsonb`, GIN, índices de expresión y full-text search. |
| Alembic | Versionamiento de esquema. Migraciones revisadas a mano, nunca confianza ciega en autogenerate. |
| Psycopg 3 | Driver moderno. Solo se usa directo para cargas masivas con `COPY`. En CRUD normal vive debajo de SQLAlchemy. |

Quedan **deliberadamente fuera** del stack núcleo: SQLModel y Elasticsearch. Si el usuario los menciona, explica por qué no son necesarios para que el núcleo funcione bien.

## La arquitectura de carpetas correcta

```
app/
  main.py
  config.py
  db.py
  api/routers/        # systems.py, entities.py, records.py
  models/             # SQLAlchemy: persistencia
  schemas/            # Pydantic: contratos API
  services/           # lógica de negocio (metadata, validación, registros)
  repositories/       # consultas y escritura
  migrations/         # Alembic
```

**Regla irrompible**: `models/` es persistencia, `schemas/` es contrato API, `services/` es lógica, `repositories/` es acceso a datos. No mezcles los cuatro niveles. Esta separación es lo que hace que el motor escale conceptualmente.

## Cómo navegar este skill

El cuerpo del manual está dividido en archivos de referencia temáticos en `references/`. Lee únicamente los que sean relevantes a la pregunta del usuario. **No los leas todos por defecto**; usa el índice de abajo como ruteador.

| Si el usuario pregunta sobre... | Lee este archivo |
|---|---|
| Modelo de datos PostgreSQL, esquema base, JSONB, índices GIN, expresión, full-text | `references/postgresql-schema.md` |
| Pydantic v2: `BaseModel`, `Field`, strict mode, `TypeAdapter`, `JsonValue`, `create_model()`, validación dinámica | `references/pydantic-validation.md` |
| SQLAlchemy 2.0: Engine, Session, DeclarativeBase, `Mapped`, `MutableDict`, queries sobre JSONB, relaciones | `references/sqlalchemy-persistence.md` |
| FastAPI: routers, dependencias, `get_session`, `response_model`, `lifespan`, settings, testing | `references/fastapi-api.md` |
| Alembic: init, autogenerate, branches, flujo de migración | `references/alembic-migrations.md` |
| Psycopg 3 directo: cuándo usarlo, ejemplo de `COPY` | `references/psycopg-direct.md` |
| Ejemplo vertical end-to-end (de metadata a registro real, con SQL y código) | `references/example-vertical.md` |
| Ruta de aprendizaje, ejercicios, checklists, errores típicos, prototipo v0.1 | `references/study-path-and-checklists.md` |

## Reglas operativas que nunca debes romper al asesorar

Estas reglas vienen directamente de la doctrina del manual. Cuando un usuario te muestre código o diseño y veas alguna violación, señálala explícitamente.

1. **Una sesión SQLAlchemy por request, sin compartir entre tareas concurrentes.** `Session` y `AsyncSession` no son thread-safe ni task-safe. Usa `Depends(get_session)` con `with Session(engine) as session: yield session`.
2. **`MutableDict.as_mutable(JSONB)` es obligatorio** en la columna `data` del modelo ORM. Sin él, `record.data["nombre"] = "x"` puede no detectarse como cambio persistible. En un motor basado en JSONB, esto es crítico.
3. **JSONB sí, pero no para todo.** Un campo va a columna real si: participa en JOIN, necesita UNIQUE, se filtra en casi todas las consultas, se ordena frecuentemente por él, o es parte del sobre fijo. Va a `data jsonb` si: cambia entre entidades, varía entre sistemas, no participa en relaciones críticas, no necesita un índice específico desde el día uno.
4. **Las relaciones fuertes viven en `record_relation`, no dentro del JSON.** Si una `serie` pertenece a una `subserie`, esa relación se modela en tabla, no como una clave dentro de `data`.
5. **Strict mode en Pydantic para el contenido dinámico.** Sin strict, `"true"` puede convertirse en `bool True`. En un motor donde los tipos vienen de metadata, eso es una bomba silenciosa. Usa `model_validate(payload, strict=True)` o `TypeAdapter(...).validate_python(value, strict=True)`.
6. **`autogenerate` de Alembic produce candidatos, no verdad absoluta.** Siempre revisa a mano nombres de índices, defaults del servidor, columnas JSONB, constraints y operaciones destructivas antes de aplicar.
7. **No empieces complejo.** El prototipo v0.1 son: tablas base + tabla `record` + endpoint de creación de sistemas + de entidades + de registros + listador por entidad + búsqueda exacta por clave JSON + full-text simple + tests + Alembic. NO incluye: diseñador visual, workflows complejos, edición masiva, UI generada, permisos multinivel.

## El flujo canónico de creación de un registro

Memoriza este flujo. Cuando el usuario te pida construir un endpoint de alta, sigue exactamente estos pasos:

1. FastAPI recibe la URL con `system_code` y `entity_code` como path params, y un body con `{"data": {...}}`.
2. El servicio de metadata consulta `system_definition` por `code`. Si no existe → 404.
3. El servicio consulta `entity_definition` por `(system_id, code)`. Si no existe → 404.
4. El servicio carga `field_definition` para esa entidad.
5. El servicio de validación construye un modelo Pydantic dinámico con `create_model()` mapeando `data_type` → tipo Python (`string`→`str`, `integer`→`int`, `number`→`float`, `boolean`→`bool`).
6. Valida `body.data` contra ese modelo en strict mode. Si falla → 422 con detalle del error.
7. Crea un `Record` con `system_id`, `entity_id`, `data=validated.model_dump()`. `session.add()` + `session.commit()` + `session.refresh()`.
8. Devuelve un `RecordOut` (Pydantic con `JsonValue`) usando `response_model`. El sobre del response es estable: `{id, system_code, entity_code, status, data}`.

Para el código completo de este flujo y los ejemplos SQL/Python que lo acompañan, consulta `references/example-vertical.md`.

## Errores típicos a detectar en el código del usuario

Cuando revises código de un usuario que esté construyendo un motor de este tipo, busca activamente estos cinco anti-patrones:

1. **JSON libre sin metamodelo**: el usuario acepta cualquier `data` sin definir `field_definition`. Resultado: no sabe qué campos son válidos, cada payload es un caso especial.
2. **Todo en JSONB**: incluso `system_id` y `entity_id` están dentro de un único JSON gigante. Resultado: no hay FKs, no hay constraints, los índices son débiles.
3. **Sesión global compartida**: una `Session` definida a nivel de módulo y reutilizada. Resultado: errores transaccionales irreproducibles.
4. **Confianza ciega en `alembic revision --autogenerate`**: el usuario aplica directamente sin leer la migración. Resultado: drift, índices con nombres raros, defaults perdidos.
5. **Empezar con UI generada / workflows / permisos antes que con el núcleo transaccional**. Resultado: arquitectura pesada, comprensión superficial.

Para cada error detectado, da el diagnóstico Y la solución concreta del manual.

## Glosario corto

- **Metamodelo**: modelo que describe cómo se definen sistemas y entidades.
- **Sobre fijo**: bloque estable de información de cualquier registro (`id`, `system_id`, `entity_id`, `status`, `data`, timestamps).
- **Contenido dinámico**: el `data` JSONB validado contra metadata.
- **JSONB**: tipo PostgreSQL orientado a manipular e indexar JSON. Diferente de `json` plano.
- **GIN**: índice apto para JSONB y `tsvector`.
- **TypeAdapter**: herramienta Pydantic v2 para validar/serializar tipos sin definir un `BaseModel` fijo.
- **`response_model`**: mecanismo FastAPI para tipar, documentar, validar y filtrar respuestas.
- **Session (SQLAlchemy)**: unidad de trabajo transaccional, **no concurrente**, una por request.
- **Migration**: cambio versionado del esquema, gestionado por Alembic.

## Qué deberías haber comunicado al final de cualquier asesoría con este skill

Una sesión de asesoría con este skill se considera completa solo si el usuario sale entendiendo:

1. Que el motor no es un módulo, es una plataforma metadata-driven.
2. Que la arquitectura correcta separa definiciones (`*_definition`) y registros (`record`, `record_relation`).
3. Que el diseño sano es **híbrido**: columnas reales para el sobre + `jsonb` para lo variable.
4. Que Pydantic v2 sirve para contratos fijos Y para modelos dinámicos vía `create_model()`.
5. Que SQLAlchemy 2.0 da el control fino que el núcleo necesita (especialmente `MutableDict` y queries JSONB).
6. Que FastAPI expone el motor con contratos limpios vía `response_model` y dependencias claras vía `Depends`.
7. Que PostgreSQL ya resuelve mucho más de lo que parece, incluido full-text con `jsonb_to_tsvector` + `websearch_to_tsquery`.
8. Que Alembic es parte del motor, no un accesorio, y que las migraciones se revisan a mano.
9. Que Psycopg 3 importa principalmente como driver y para `COPY` en cargas masivas.
10. Que lo más importante no es escribir mucho código, sino entender bien el modelo.

Cuando el usuario entiende esto, ya no piensa "cómo hago una tabla más"; piensa como quien diseña un motor.
