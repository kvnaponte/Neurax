---
name: solve-issue
description: Resuelve un GitHub Issue al pie de la letra: lee su contenido completo, crea una rama desde la rama actual, implementa exactamente lo que el issue indica (ni más, ni menos), hace commit breve, push, y cierra el issue. Úsala con /solve-issue XX donde XX es el número de issue.
---

# Skill: solve-issue

## Trigger

`/solve-issue <número>`

---

## Pasos

### 1 — Leer el issue

```bash
gh issue view <número> --comments --json number,title,body,labels,comments,state,assignees
```

Extrae: título, cuerpo, primer label, comentarios (pueden modificar el alcance), estado. Si `state == CLOSED`, detente.

---

### 2 — Crear la rama

**Prefijo según label:** `feature`/`enhancement` → `feature` | `bug` → `fix` | `refactor` → `refactor` | `documentation`/`docs` → `docs` | `security` → `security` | `performance` → `perf` | `test` → `test` | sin label → `chore`

**Nombre:** elimina `[TYPE]`, traduce al inglés, kebab-case, 4 palabras significativas (omite artículos y preposiciones). Formato: `<prefijo>/<p1>-<p2>-<p3>-<p4>`

Crea la rama **desde la rama actual** (nunca desde `main`/`master`):
```bash
git checkout -b <nombre-de-rama>
```

---

### 3 — Implementar

Lee el cuerpo y comentarios. Implementa únicamente lo que el issue pide — sin refactors, sin features extra, sin manejo de errores no solicitado. Verifica con `find`/`grep`/`Read` que los archivos y funciones mencionados existan antes de asumir.

---

### 4 — Commit y push

```bash
git add <solo-archivos-del-issue>
git commit -m "<tipo>: <descripción concisa> (#<número>)"
git push -u origin <nombre-de-rama>
```

---

### 5 — Verificar DoD

Clasifica cada ítem del Definition of Done:

**Categoría A (verificable ahora):** ejecútalo, muestra la salida real. Si falla, corrige antes de continuar.

**Categoría B (requiere entorno externo):** informa qué ítem, por qué no es verificable, cómo hacerlo manualmente. Espera confirmación explícita del usuario antes de continuar.

---

### 6 — Cerrar el issue

Publica el comentario de cierre con la plantilla correspondiente, luego:

```bash
gh issue edit <número> --add-label "status: resolved"
gh issue close <número>
```

**Encabezado estándar (siempre primero):**
```markdown
## 📌 ENCABEZADO ESTÁNDAR
- **ID de Issue:** #
- **Tipo:** `[Bug / Feature / Tarea / Seguridad]`
- **Prioridad / Severidad:** `[Baja / Media / Alta / Crítica]`
- **Responsable del cierre:** [usuario]
- **Pull Request / Commit:** `<hash-7-chars>`
- **Fecha de cierre:** `AAAA-MM-DD`
```

**Plantilla A — Bug:**
```markdown
## 🐛 CIERRE DE BUG
### 🔍 Causa Raíz
- **¿Por qué ocurría?:** [explicación técnica]
- **Impacto detectado:** [degradación, error, inconsistencia]
### 💡 Solución Aplicada
- **Cambios realizados:** [archivos y lógica]
- **Deuda Técnica:** [Sí → issue # / No]
### 🧪 Verificación
- [ ] Pruebas de regresión añadidas
- **Evidencia:** [log, screenshot, output real]
### 🔗 Telemetría
- **Alertas vinculadas:** [Sentry/Datadog ID o N/A]
```

**Plantilla B — Feature / Tarea:**
```markdown
## 🚀 CIERRE DE FEATURE / TAREA
### 📋 Resumen de Implementación
- **Criterios cumplidos:** [cómo satisface la necesidad]
### 🧪 Verificación
- [ ] Pruebas añadidas
- **Evidencia:** [output real o N/A]
### ⚙️ Impacto Operativo
- **Migraciones:** [Sí / No]
- **Variables de Entorno:** [nombres o N/A]
- **Estrategia de Despliegue:** [Estándar / Manual / Ventana de mantenimiento]
- **Breaking Changes:** [Sí → plan / No]
### 📚 Entregables
- **Archivos modificados/creados:** [lista]
```

**Plantilla C — Seguridad:**
```markdown
## 🛡️ CIERRE DE INCIDENTE DE SEGURIDAD
### ⚠️ Vulnerabilidad Mitigada
- **ID:** [CVE o reporte interno]
- **Severidad:** `[Baja / Media / Alta / Crítica]`
### 🛠️ Acción Correctiva
- **Descripción:** [qué se hizo]
### 🔒 Monitoreo Posterior
- **Plan:** [revisión de logs X días o N/A]
```

---

### 7 — Confirmar al usuario

```
Rama: <nombre-rama>
Commit: <hash> — <mensaje>
Push: exitoso
Issue #XX: cerrado con status: resolved
```

---

## Restricciones

- Nunca leer el issue desde memoria — siempre `gh issue view`
- Nunca crear la rama desde `main`/`master`
- Nunca crear Pull Request
- Nunca modificar archivos fuera del scope del issue
- Nunca cerrar sin push exitoso y DoD verificado (o confirmación explícita del usuario)
