---
name: solve-issue
description: Resuelve un GitHub Issue al pie de la letra: lee su contenido completo, crea una rama desde la rama actual, implementa exactamente lo que el issue indica (ni más, ni menos), hace commit breve, push, y cierra el issue con issue-skill. Úsala con /solve-issue XX donde XX es el número de issue.
---

# Skill: solve-issue

## Propósito

Resolver un GitHub Issue de forma literal y trazable, sin inventar alcance, sin agregar funcionalidades extra, sin modificar nada fuera del scope del issue.

## Trigger

`/solve-issue <número>`

El argumento `<número>` es el número entero del issue a resolver (ej: `/solve-issue 42`).

---

## Protocolo de Ejecución — Paso a Paso Obligatorio

### PASO 1 — Leer el Issue completo

Ejecuta el siguiente comando para obtener el issue y todos sus comentarios. Usa ÚNICAMENTE datos reales devueltos por este comando — nunca inventes contenido:

```bash
gh issue view <número> --comments --json number,title,body,labels,comments,state,assignees
```

De la respuesta extrae y anota internamente:
- **Título** del issue (campo `title`)
- **Cuerpo** completo (campo `body`)
- **Labels** reales (campo `labels[].name`)
- **Comentarios** reales en orden (campo `comments[].body`) — pueden contener aclaraciones o cambios de alcance que modifican el issue original
- **Estado** (`state`) — si ya está `CLOSED`, detente e informa al usuario

> Regla absoluta: si el issue no existe o el comando falla, detente e informa al usuario. Nunca asumas su contenido.

---

### PASO 2 — Determinar el label de rama

Mapea el primer label de tipo reconocido del issue al prefijo de rama:

| Label del issue | Prefijo de rama |
|---|---|
| `feature`, `enhancement` | `feature` |
| `bug` | `fix` |
| `refactor` | `refactor` |
| `documentation`, `docs` | `docs` |
| `security` | `security` |
| `performance` | `perf` |
| `test` | `test` |
| Sin label reconocido | `chore` |

---

### PASO 3 — Construir el nombre de la rama

A partir del **título real** del issue (campo `title`):

1. Elimina el prefijo `[TYPE]` si existe (ej. `[FEATURE]`, `[BUG]`)
2. Traduce al inglés si el título está en otro idioma
3. Convierte a kebab-case: minúsculas, sin acentos, espacios → guiones
4. Toma exactamente **4 palabras** significativas (omite artículos, preposiciones y conectores como: a, an, the, of, for, in, to, and, or, with, on, at)
5. Si el título tiene menos de 4 palabras significativas, usa las que haya

Formato final: `<prefijo>/<palabra1>-<palabra2>-<palabra3>-<palabra4>`

Ejemplos:
- Issue: `[FEATURE] Implementar Middleware de Autenticación JWT` → `feature/implement-jwt-auth-middleware`
- Issue: `[BUG] Corregir cálculo incorrecto del total en factura` → `fix/incorrect-total-invoice-calculation`
- Issue: `[REFACTOR] Extraer validación de usuario a servicio dedicado` → `refactor/extract-user-validation-service`

---

### PASO 4 — Crear la rama desde la rama ACTUAL

**Nunca crear la rama desde `main` o `master`.** Crear siempre desde la rama en la que el usuario se encuentra en este momento.

```bash
git checkout -b <nombre-de-rama>
```

Confirma que la rama fue creada correctamente antes de continuar.

---

### PASO 5 — Analizar el alcance exacto del issue

Lee el cuerpo del issue y todos sus comentarios con atención crítica. Identifica:

- **Qué archivos** deben modificarse o crearse
- **Qué lógica** debe implementarse
- **Qué NO debe tocarse** (todo lo que el issue no menciona explícitamente)

> Regla de oro: Si el issue no lo pide, no lo implementes. No refactorices código que el issue no menciona. No corrijas bugs que no son el objetivo del issue. No agregues logging, tests, documentación o manejo de errores que el issue no indique expresamente.

---

### PASO 6 — Implementar exactamente lo que indica el issue

Ejecuta los cambios de código requeridos, archivo por archivo, siguiendo únicamente los requisitos, criterios de aceptación y detalles técnicos del issue.

Reglas durante la implementación:
- Usar únicamente datos, rutas, nombres de variables y configuraciones que existan realmente en el repositorio — verificar con `find`, `grep` o `Read` antes de asumir
- Si el issue menciona un archivo o función que no existe, detente e informa al usuario antes de continuar
- Si hay ambigüedad en el issue, informa al usuario y solicita aclaración antes de proceder

---

### PASO 7 — Commit breve y concreto

Una vez implementados los cambios, agrega solo los archivos modificados por el issue:

```bash
git add <archivos-modificados>
```

Crea un commit con mensaje breve (máximo 72 caracteres en la primera línea), en inglés, usando el formato convencional:

```
<tipo>: <descripción concisa> (#<número-issue>)
```

Donde `<tipo>` es: `feat`, `fix`, `refactor`, `docs`, `perf`, `test`, o `chore` según corresponda.

Ejemplo:
```
feat: add jwt auth middleware (#42)
```

**No uses `git add .` ni `git add -A`.** Solo agrega los archivos que el issue requirió cambiar.

---

### PASO 8 — Push a la rama creada

```bash
git push -u origin <nombre-de-rama>
```

Confirma que el push fue exitoso antes de continuar.

---

### PASO 8.5 — Verificar el Definition of Done ANTES de cerrar

> ⛔ **Regla crítica: NO cerrar el issue hasta que esta verificación esté completa.** El cierre es irreversible en términos de trazabilidad. Un issue cerrado con DoD incompleto es un defecto de gobernanza, no solo un error técnico.

Lee los ítems del **Definition of Done** del issue y clasifica cada uno:

#### Categoría A — Verificable ahora (hazlo tú mismo)
Ejemplos: tests unitarios pasan, archivos existen, lógica implementada, imports funcionan, outputs de scripts reales.

Para cada ítem de categoría A:
- Ejecuta la verificación real (correr tests, inspeccionar archivos, ejecutar scripts)
- Muestra la salida real al usuario
- Si falla: **detente**, reporta el fallo, corrige antes de continuar

#### Categoría B — Requiere entorno externo (detente y pregunta)
Ejemplos: conexión a broker real (MT5, IBKR), base de datos en producción, servicio externo (Redis, API), OS específico (MT5 solo corre en Windows), credenciales reales, hardware específico.

Para cada ítem de categoría B:
1. **Detente aquí**
2. Informa al usuario exactamente qué ítem no pudo verificarse y por qué (entorno, credenciales, OS, servicio externo)
3. Proporciona instrucciones precisas de cómo el usuario puede verificarlo manualmente
4. Espera confirmación explícita del usuario: **"verifiqué X y funciona"** o **"apruebo cerrar sin verificar X por razón Y"**
5. Solo después de esa confirmación procede al PASO 9

#### Ejemplo de bloqueo correcto
```
Issue #31 DoD — estado de verificación:
  [✓] src/brokers/mt5_connector.py implementado → verificado (archivo existe)
  [✓] 15/15 unit tests pasando → verificado (pytest output real)
  [⚠] Precios almacenados en Redis verificados con redis-cli → NO VERIFICADO
      Razón: Redis no está corriendo en este entorno.
  [⚠] Tests de integración con cuenta demo MT5 real → NO VERIFICADO
      Razón: MetaTrader5 es Windows-only; este entorno es Linux/WSL2.

¿Confirmas que verificaste estos ítems manualmente antes de cerrar?
```

> No inventes evidencia. No marques como verificado algo que no ejecutaste. Si el entorno no lo permite, dilo explícitamente.

---

### PASO 9 — Cerrar el Issue con issue-skill

Invoca el skill `issue-skill` para redactar y publicar el comentario de cierre oficial en GitHub.

El comentario debe usar la plantilla correspondiente al tipo de issue (Opción A para bugs, Opción B para features/tareas, Opción C para seguridad), completando todos los campos con datos reales:
- Hash corto del commit realizado (7 caracteres)
- Archivos reales modificados
- Fecha real de cierre (hoy)
- Responsable real

Publica el comentario en el issue:

```bash
gh issue comment <número> --body "<comentario-de-cierre>"
```

Luego agrega la etiqueta de cierre y cierra el issue:

```bash
gh issue edit <número> --add-label "status: resolved"
gh issue close <número>
```

---

### PASO 10 — Confirmar al usuario

Reporta de forma concisa:
- Rama creada: `<nombre-rama>`
- Commit: `<hash-corto>` — `<mensaje>`
- Push: exitoso
- Issue #XX: cerrado con `status: resolved`

---

## Restricciones absolutas

- **Nunca** leer el issue desde memoria o suposición — siempre usar `gh issue view`
- **Nunca** crear la rama desde `main`/`master`
- **Nunca** crear un Pull Request
- **Nunca** modificar archivos fuera del alcance del issue
- **Nunca** usar datos inventados o ficticios al ejecutar tests, correr scripts o cualquier operación que dependa de un dataset — los datos deben ser reales (archivos existentes, registros reales de la base de datos, salidas reales de scripts previos). Si no se dispone de datos reales, detente e informa al usuario antes de continuar
- **Nunca** cerrar el issue sin haber hecho push exitoso primero
- **Nunca** cerrar el issue sin haber ejecutado el PASO 8.5 completo — todo ítem del DoD debe estar verificado o el usuario debe haber confirmado explícitamente que acepta cerrar con ítems pendientes y por qué
- **Nunca** marcar como verificado un ítem del DoD que no fue ejecutado en este entorno — si no se pudo ejecutar, reportarlo como pendiente y esperar confirmación del usuario
- Si cualquier paso falla, detente, reporta el error al usuario y espera instrucciones
