# Ruta de estudio, ejercicios, checklists, errores y prototipo v0.1

Este archivo es la **brújula práctica** del motor. Cubre la ruta de aprendizaje en cuatro etapas, ejercicios concretos, checklists operativos para diseño/persistencia/API/evolución, los cinco errores típicos a evitar, y la composición exacta del prototipo v0.1.

Úsalo cuando el usuario pregunte:
- "¿Por dónde empiezo?"
- "¿Cómo estudio esto?"
- "¿Qué construyo primero?"
- "Dame ejercicios."
- "Dame un checklist antes de empezar."
- "¿Qué errores debo evitar?"

## Tabla de contenidos

1. Ruta de aprendizaje en cuatro etapas
2. Cinco ejercicios concretos
3. Checklist de diseño
4. Checklist de persistencia
5. Checklist de API
6. Checklist de evolución
7. Cinco errores típicos y cómo evitarlos
8. El prototipo v0.1: qué SÍ y qué NO
9. La pregunta de salud del motor

---

## 1. Ruta de aprendizaje en cuatro etapas

### Etapa 1 — Entender el modelo

**Objetivo**: poder explicar con tus propias palabras qué es un sistema, una entidad, un campo y un registro. Y la diferencia entre metamodelo y datos.

**Ejercicio**: en papel (no en código), modela DOS sistemas distintos usando el mismo metamodelo:
- Sistema A: `gestion_documental` → entidades `fondo_documental`, `trd`, `dependencia`.
- Sistema B: `inventario_activos` → entidades `activo`, `sede`, `mantenimiento`.

**Validación**: si puedes explicarle a alguien que no programa qué cambia entre A y B, y qué es exactamente lo mismo en ambos, completaste la etapa.

---

### Etapa 2 — Validar dinámicamente

**Objetivo**: construir un `create_model()` a partir de `field_definition`.

**Ejercicio**: valida tres payloads correctos y tres incorrectos. Mira el `ValidationError` exacto que produce Pydantic cuando:
- Falta un campo requerido.
- Llega un tipo incorrecto (string donde se espera bool).
- Llega un campo no declarado (con `extra="forbid"`).

**Validación**: cuando entiendes la estructura de los `ValidationError`, diseñar el handler 422 de FastAPI para devolver mensajes útiles al cliente se vuelve trivial.

---

### Etapa 3 — Persistir y consultar

**Objetivo**: guardar y consultar `record.data` correctamente, incluyendo mutaciones in-place.

**Ejercicio**:
1. Inserta diez registros de prueba.
2. Modifica `record.data["nombre"]` de uno con `MutableDict` y verifica que persistió con `psql`.
3. Busca con `Record.data.contains({...})`.
4. Busca con `Record.data.has_key(...)`.
5. Prueba una búsqueda full-text con `jsonb_to_tsvector`.

**Validación**: si los cinco pasos funcionan, dominas la mitad de la persistencia del motor. La otra mitad son las relaciones vía `record_relation`.

---

### Etapa 4 — Exponerlo por API

**Objetivo**: crear los cuatro endpoints básicos con FastAPI.

**Ejercicio**: en este orden exacto:
- `POST /systems` — alta de sistema.
- `POST /systems/{system_code}/entities` — alta de entidad.
- `POST /systems/{system_code}/entities/{entity_code}/records` — creación con validación dinámica.
- `GET /systems/{system_code}/entities/{entity_code}/records` — listado por entidad.

**Validación**: los cuatro funcionan con `response_model`, sesión por request, y errores 404/422 correctos.

---

## 2. Cinco ejercicios concretos

### Ejercicio 1 — Gestión Documental mínima

Construye:
- Sistema `gestion_documental`.
- Entidad `fondo_documental`.
- Campos: `codigo` (string, requerido), `nombre` (string, requerido), `activo` (boolean, requerido).

Crea dos registros vía API. Verifica en la BD que el sobre es correcto y `data` está poblado.

---

### Ejercicio 2 — Otro sistema distinto

Sin tocar arquitectura, construye:
- Sistema `inventario_activos`.
- Entidad `activo`.
- Campos: `placa` (string, requerido), `descripcion` (string, requerido), `valor` (number, opcional).

Repite el flujo del Ejercicio 1.

**Verificación clave**: ¿creaste alguna tabla nueva? ¿Algún modelo SQLAlchemy nuevo? ¿Algún schema Pydantic nuevo? La respuesta debe ser **no** a las tres. Solo INSERTs de metadata. Si necesitaste tocar código, hay lógica hardcodeada que no debería estarlo.

---

### Ejercicio 3 — Campo opcional y strict

Agrega el campo opcional `soporte` (string, no requerido) a `fondo_documental`.

Prueba estos tres payloads:

1. **Sin `soporte`** → debe pasar. Es opcional.
2. **Con `soporte: "fisico"`** → debe pasar.
3. **Con `activo: "true"` (string en lugar de bool)** en strict mode → debe **fallar** con 422.

Si el caso 3 pasa sin error, el strict mode no está activo y debes corregirlo.

---

### Ejercicio 4 — Relación entre registros

1. Crea una `relation_definition` llamada `trd_aplica_a_dependencia`.
2. Inserta un registro de `trd` y uno de `dependencia`.
3. Crea la relación en `record_relation`.
4. Construye una query SQLAlchemy que, dado un `trd_id`, devuelva las `dependencia` asociadas vía JOIN entre `record` y `record_relation`.

**Verificación clave**: la FK del vínculo NO está dentro de `record.data`. Si está, releé la sección de relaciones de `sqlalchemy-persistence.md` y corrígelo.

---

### Ejercicio 5 — Índice de expresión

Crea el índice:

```sql
CREATE INDEX ix_record_codigo_expr ON record ((data->>'codigo'));
```

Compara con `EXPLAIN ANALYZE` antes y después:

```sql
EXPLAIN ANALYZE
SELECT * FROM record WHERE data->>'codigo' = 'FD-001';
```

Antes del índice deberías ver **Seq Scan**. Después deberías ver **Index Scan**. Con muchos registros, la diferencia es de órdenes de magnitud.

Este ejercicio hace concreto y observable lo que los índices de expresión aportan al motor.

---

## 3. Checklist de diseño

Antes de modelar cualquier entidad nueva, responde:

- [ ] ¿Qué parte del registro es **sobre fijo**? (`id`, `system_id`, `entity_id`, `status`, timestamps)
- [ ] ¿Qué parte es **contenido variable**? (los campos del dominio → van a `data jsonb`)
- [ ] ¿Cuáles campos van a **filtrarse mucho**? (candidatos a índice de expresión o columna real)
- [ ] ¿Cuáles campos necesitan **unicidad**? (probablemente columna real con UNIQUE constraint)
- [ ] ¿Hay **relaciones fuertes** entre registros? (van a `record_relation`, nunca dentro de `data`)
- [ ] ¿Qué campos deben ser **full-text searchable**? (marcar `searchable=true`, usar `jsonb_to_tsvector`)

Si no puedes responder a cinco de las seis, la entidad no está lista para implementarse.

---

## 4. Checklist de persistencia

- [ ] La tabla `record` tiene exactamente: `id`, `system_id`, `entity_id`, `status`, `data`, `created_at`, `updated_at`.
- [ ] Se usa `JSONB`, no `JSON` plano.
- [ ] La columna `data` usa `MutableDict.as_mutable(JSONB)` en el modelo ORM.
- [ ] Las relaciones fuertes viven en `record_relation`, no en `data`.
- [ ] La sesión SQLAlchemy vive **por request**, no compartida globalmente ni entre tareas.
- [ ] Hay un índice GIN sobre `record.data` desde el inicio.
- [ ] Hay índices B-tree sobre `entity_id` y `system_id`.
- [ ] Las migraciones pasaron por revisión manual antes de aplicarse.

---

## 5. Checklist de API

- [ ] Todos los endpoints tienen contratos de request y response declarados explícitamente.
- [ ] Todos usan `response_model` en el decorator del endpoint.
- [ ] El `data` dinámico se valida contra metadata con `create_model()` **antes** de persistir.
- [ ] La validación es en **strict mode**.
- [ ] Los errores de validación devuelven `exc.errors()`, no `str(exc)`.
- [ ] Hay 404 explícito para sistema o entidad no encontrada.
- [ ] Hay 422 explícito para validación dinámica fallida.
- [ ] Las dependencias (`get_session`, `get_settings`) se pueden sustituir en tests con `dependency_overrides`.

---

## 6. Checklist de evolución

- [ ] Toda tabla y todo cambio de esquema relevante pasa por Alembic.
- [ ] Cada migración generada por `--autogenerate` se revisa manualmente antes de aplicar.
- [ ] Se entiende qué es un branch de migración y cómo resolverlo con `alembic merge`.
- [ ] Las migraciones contienen solo DDL; el DML semántico (seeds de metadata) va en scripts separados.
- [ ] El CI corre `alembic upgrade head` sobre una BD limpia para validar que cada migración funciona desde cero.

---

## 7. Cinco errores típicos y cómo evitarlos

### Error 1 — JSON libre sin metamodelo

**Síntoma**: el endpoint acepta y guarda cualquier `data` sin validarlo contra `field_definition`.

**Consecuencias**:
- No hay criterio para saber qué campos son válidos.
- No se puede construir UI ni validación coherente.
- Cada payload se vuelve un caso especial imposible de escalar.

**Solución**: define `system_definition`, `entity_definition` y `field_definition` desde el inicio. Sin metamodelo no tienes un motor; tienes un saco de JSON sin forma.

---

### Error 2 — Todo en JSONB

**Síntoma**: incluso `system_id` y `entity_id` están dentro de un JSON gigante. No hay columnas reales.

**Consecuencias**:
- Consultas lentas (no hay índices eficientes sobre el sobre).
- No hay FK reales, por lo que la integridad referencial no existe.
- El modelo es opaco: nadie entiende `\d record` porque no hay columnas.

**Solución**: diseño híbrido. El sobre va en columnas reales con FKs. Solo el contenido variable va en `data jsonb`.

---

### Error 3 — Sesión compartida entre requests o tareas

**Síntoma**: una `Session` definida a nivel de módulo e importada por todos los endpoints.

**Consecuencias**:
- Errores intermitentes y casi imposibles de reproducir.
- Estados transaccionales cruzados.
- Bugs que solo aparecen en producción bajo carga concurrente.

**Solución**: una sesión por request, gestionada con `Depends(get_session)` y context manager. Sin excepciones.

---

### Error 4 — Confianza ciega en `autogenerate`

**Síntoma**: el desarrollador corre `alembic revision --autogenerate` y aplica directo con `alembic upgrade head` sin leer el archivo generado.

**Consecuencias**:
- Índices con nombres incorrectos o faltantes (autogenerate no infiere GIN ni índices de expresión).
- `server_default` perdidos.
- Renombres detectados como drop+add, destruyendo datos.
- Drift progresivo entre el código y la BD real.

**Solución**: cada migración autogenerada es un **borrador**. Revisión manual obligatoria. Trátala como un PR: no se aplica sin code review.

---

### Error 5 — Empezar demasiado complejo

**Síntoma**: el día 1 el desarrollador quiere workflows, diseñador visual, permisos multinivel, UI generada, multi-tenant. Todo antes de tener los cuatro endpoints básicos funcionando.

**Consecuencias**:
- Arquitectura pesada que nadie entiende.
- Aprendizaje superficial del núcleo.
- Más piezas operativas que comprensión real.
- Cuando el núcleo falla, la complejidad encima lo hace inencontrable.

**Solución**: primero el núcleo transaccional (los diez componentes del v0.1). Todo lo demás viene después, construido sobre una base demostrada.

---

## 8. El prototipo v0.1: qué SÍ y qué NO

### Los diez componentes obligatorios del v0.1

1. **Tablas base del metamodelo**: `system_definition`, `entity_definition`, `field_definition`, `relation_definition`, `record`, `record_relation`. Todas vía Alembic, con índices GIN y B-tree correctos.
2. **Modelo ORM de `Record`** con `MutableDict.as_mutable(JSONB)` en la columna `data`.
3. **`POST /systems`** — crear un sistema.
4. **`POST /systems/{system_code}/entities`** — crear una entidad con sus campos.
5. **`POST /systems/{system_code}/entities/{entity_code}/records`** — crear un registro con validación dinámica completa.
6. **`GET /systems/{system_code}/entities/{entity_code}/records`** — listar registros por entidad, con paginación básica (`limit`/`offset`).
7. **Búsqueda exacta por contenido JSON** (`data @> {...}`).
8. **Búsqueda full-text simple** vía `jsonb_to_tsvector` + `websearch_to_tsquery`.
9. **Tests básicos** con `dependency_overrides` y BD de test real (PostgreSQL, no SQLite).
10. **Migraciones con Alembic** desde el primer commit.

### Lo que NO entra en v0.1

| Lo que se quiere agregar | Por qué espera |
|---|---|
| Diseñador visual de formularios | Es UI, viene después, vive en otro repo. |
| Workflows y transiciones de estado | Complejidad de dominio; primero el CRUD sano. |
| Edición masiva sofisticada | Optimización; primero el camino individual. |
| UI generada automáticamente desde metadata | Depende de que el motor esté estable. |
| Permisos multinivel (RBAC + ABAC) | Aumenta la complejidad transversal desde el día 1. |
| Eventos, webhooks, colas | Infraestructura adicional innecesaria en v0.1. |
| AsyncIO en toda la app | Sin carga real que lo justifique, solo agrega complejidad. |
| Caché de modelos Pydantic dinámicos | Optimización de v2, no un requisito de v1. |
| Multi-tenant formal | La estructura ya lo soporta nativamente; formalizarlo es v2+. |

### La razón filosófica

El motor v0.1 debe **demostrar que el patrón funciona**: puedes crear dos sistemas radicalmente distintos sin tocar el código. Si logras eso, probaste el concepto. Todo lo demás es construir sobre esa base demostrada.

Si v0.1 ya incluye workflows y permisos antes de tener ese núcleo sólido, estarás optimizando algo que todavía no funciona bien.

---

## 9. La pregunta de salud del motor

En cualquier etapa del desarrollo, hazte esta pregunta:

> **¿Puedo agregar un sistema completamente nuevo mañana, sin tocar el código, solo insertando metadata?**

- Si la respuesta es **sí**: el motor está sano.
- Si la respuesta es **no**: hay algo en el código que asume la forma de los datos en lugar de leerla de la metadata. Encuéntralo y muévelo a `field_definition` o `entity_definition`.

Esta es la pregunta de regresión conceptual más importante del motor. No la pierdas de vista en ninguna iteración.

---

## La estructura mínima del proyecto de estudio

Para quien empieza desde cero, esta es la estructura de carpetas con la que deberías arrancar:

```
motor-estudio/
  app/
    main.py
    db.py
    config.py
    api/
      routers/
        systems.py
        entities.py
        records.py
    models/
      base.py
      system.py
      entity.py
      field.py
      relation.py
      record.py
    schemas/
      systems.py
      records.py
    services/
      metadata_service.py
      validation_service.py
      record_service.py
    repositories/
      systems_repo.py
      entities_repo.py
      records_repo.py
  migrations/
  tests/
    test_systems.py
    test_entities.py
    test_records.py
  alembic.ini
  pyproject.toml
  .env
  scripts/
    imports/        ← seeds y cargas masivas, separados del motor
```

El objetivo de este proyecto de estudio es poder:
- Definir un sistema desde la API.
- Definir una entidad con sus campos.
- Crear registros dinámicos contra esa entidad.
- Buscarlos por filtros básicos.
- Probarlos con `TestClient`.

Con eso, el núcleo está demostrado y puedes extender confiado.
