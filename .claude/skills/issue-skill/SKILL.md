---
name: issue-skill
description: Guía corporativa para crear, documentar, auditar y cerrar issues (bugs, features, tareas o incidentes de seguridad) siguiendo un estándar de gobernanza con plantillas de apertura, checklist de Definition of Done, matriz RACI y plantillas de cierre. Úsala cuando el usuario pida redactar una issue nueva (título, labels, criterios de aceptación, DoD), el comentario final de cierre de una issue, verificar si una issue cumple los criterios para cerrarse, clasificar el tipo de cierre (resolved/duplicate/wontfix/cant-reproduce/stale), o necesite el formato exacto de la plantilla de apertura o de cierre de bug, feature o vulnerabilidad de seguridad.
license: MIT
---

# 🛠️ Manual Corporativo: Gobernanza, Apertura, Cierre y Documentación de Issues

Esta guía establece el estándar técnico institucional y obligatorio para crear, documentar, verificar, auditar y cerrar *issues* (incidencias, tareas, vulnerabilidades o características). El objetivo es garantizar el 100% de trazabilidad del ciclo de vida del software, mitigar el riesgo operativo, facilitar auditorías externas y optimizar las métricas de rendimiento del equipo.

Toda issue, desde que se crea hasta que se cierra, debe responder una pregunta simple:

> "Si un desarrollador abre esta issue dentro de seis meses, ¿sabrá exactamente qué hay que hacer, por qué importa, cómo se mide el éxito y dónde encaja dentro del proyecto?"

---

## 📊 1. Flujo de Trabajo y Ciclo de Vida del Cierre

El proceso de cierre no es un acto aislado; es la fase final de la entrega de valor. El ciclo sigue estrictamente el siguiente flujo:

[ Creación/Apertura ] ➔ [ En Revisión/QA ] ➔ [ Validación de Criterios ] ➔ [ Automatización/Merge ] ➔ [ Documentación (Plantilla) ] ➔ [ Cierre Oficial ]

> ℹ️ La plantilla de cierre se redacta **después** del merge: solo entonces existen el PR/commit final y las ramas a limpiar que la plantilla y el DoD requieren referenciar.

---

## 👥 2. Matriz de Responsabilidades (RACI)

Para evitar cierres huérfanos o inválidos, se define la siguiente asignación de roles dentro del flujo:


| Rol de Proyecto | Responsabilidad en el Cierre |
| :--- | :--- |
| **Desarrollador (Developer)** | **Responsable (R):** Ejecuta la solución, añade pruebas, documenta la plantilla técnica y vincula artefactos de código. |
| **QA / Tester** | **Aprobador (A):** Verifica la solución en ambientes de prueba, aporta la evidencia final y autoriza el paso a "Cerrado". |
| **Product Owner / PM** | **Consultado (C):** Valida que la solución cumpla con los criterios de aceptación del negocio en Features mayores. |
| **DevOps / SysAdmin** | **Informado (I):** Recibe notificaciones si el cierre implica configuraciones de infraestructura o cambios en pipelines. |

> 📐 **Criterio de "Feature mayor"** (para activar la consulta al PO): la tarea modifica un flujo visible para el usuario final, introduce *breaking changes*, o su esfuerzo estimado supera el umbral que el equipo defina como historia "grande" (p. ej. > 1 sprint o > N puntos). Si hay duda sobre si aplica, se trata como mayor.

> 🔁 Esta misma matriz aplica en sentido inverso durante la **apertura**: quien crea la issue (ver 3.3 "Autor") asume por defecto el rol de Responsable de aportar contexto, y el Product Owner se consulta cuando la solicitud cumple el criterio de "Feature mayor".

---

## 📥 3. Apertura y Documentación de Issues (Creación)

Una issue bien redactada desde el origen minimiza suposiciones, reduce el ida-y-vuelta innecesario entre roles y evita que el checklist de cierre (sección 4) se bloquee por falta de contexto.

### 3.1 Principios de una Buena Issue

1. **Claridad sobre brevedad** — preferir requisitos explícitos, expectativas claras y criterios de aceptación definidos, en lugar de descripciones ambiguas, objetivos vagos o contexto de negocio ausente. Una issue corta que carece de contexto genera retrasos, no velocidad.
2. **Una issue = un entregable** — cada issue representa una única unidad de trabajo.
   - ❌ `Crear sistema de autenticación / Crear dashboard / Implementar notificaciones`
   - ✅ `Implementar middleware de autenticación JWT`
   - Si una solicitud agrupa varios entregables, divídela en issues independientes y enlázalas como dependencias (ver 3.4, punto 8).
3. **Definir el "por qué"** — toda issue debe explicar por qué existe, qué problema resuelve, quién se beneficia de ella y qué ocurre si no se implementa.

### 3.2 Título

Formato obligatorio:

```text
[TYPE] Descripción breve, específica y orientada a la acción
```

Ejemplos válidos:
```text
[FEATURE] Implementar middleware de autenticación JWT
[BUG] Corregir cálculo incorrecto del total en el resumen de factura
[REFACTOR] Extraer la validación de usuario a un servicio dedicado
[DOCS] Crear guía de autenticación de API
```

Evitar títulos genéricos que no son rastreables ni buscables: `Fix login`, `Dashboard`, `Update code`.

### 3.3 Metadata de Apertura

#### Autor
El autor es quien crea la issue. GitHub registra automáticamente esta información en el historial del proyecto, por lo que no se requiere un campo adicional. Sus responsabilidades:
- Aportar el contexto completo (negocio + técnico).
- Definir el resultado esperado.
- Asignar las etiquetas correctas.
- Enlazar recursos y dependencias relacionadas.

#### Etiquetas (Labels)

> ⚠️ **Evitar colisión de espacios de nombres:** el prefijo `status:` está **reservado** para los resultados de cierre definidos en la sección 7 (`status: resolved`, `status: duplicate`, `status: wontfix`, `status: cant-reproduce`, `status: stale`). Las etiquetas de "Estado del flujo" listadas abajo describen el progreso del trabajo **mientras la issue sigue abierta** y deben usarse sin ese prefijo (`ready`, `in-progress`, …) — o, si el equipo lo prefiere, con un prefijo distinto como `flow:` — para que ambos sistemas de clasificación nunca se confundan en reportes ni dashboards.

| Categoría | Valores sugeridos | Uso |
| :--- | :--- | :--- |
| **Tipo** | `feature` `bug` `enhancement` `refactor` `documentation` `security` `performance` `test` `research` | Clasifica la naturaleza del trabajo. |
| **Prioridad** | `priority:critical` `priority:high` `priority:medium` `priority:low` | `critical` se reserva para cuando producción está afectada. |
| **Área** | `frontend` `backend` `database` `devops` `mobile` `api` `security` `analytics` | Indica el dominio técnico impactado. |
| **Estado del flujo** | `ready` `in-progress` `blocked` `review` `qa` `done` | Progreso operativo mientras la issue está abierta (no confundir con las etiquetas de cierre de la sección 7). |

Ejemplo de combinación habitual de etiquetas en una sola issue:
```text
feature, backend, api, priority:high
```

#### Proyectos
Toda issue debe pertenecer a un proyecto cuando exista uno, para favorecer el seguimiento de progreso, la planeación de sprints y la visibilidad del roadmap.
```text
Project: Customer Portal V2
Project: AI Prediction Engine
Project: Infrastructure Modernization
```

#### Milestones
Representan fechas límite o releases (`v1.0.0`, `MVP Release`, `Sprint 12`, `Q4 Objectives`). Toda issue debe asociarse al milestone donde se espera su entrega.

#### Asignados
Cada issue requiere **un responsable principal (owner)**. Opcionalmente puede sumar revisores adicionales, QA responsable o tech lead — roles que coinciden con la matriz RACI de la sección 2.
```text
Assignee:
- @developer1
```
Las issues sin asignar tienden a quedar abandonadas: nunca dejar este campo vacío.

### 3.4 Plantilla de Descripción

Toda issue nueva debe documentarse con las siguientes secciones, en este orden:

1. **Summary** — explicación breve del objetivo.
   > Implementar middleware de autenticación JWT para proteger los endpoints de la API y validar los tokens de acceso antes de procesar la solicitud.

2. **Business Context** — por qué es necesario el trabajo.
   > Actualmente las rutas de la API son de acceso público. Se requiere autenticación antes del lanzamiento a producción.

3. **Problem Statement** — descripción del problema actual.
   > Los usuarios pueden acceder a recursos protegidos sin verificación de identidad.

4. **Expected Outcome** — descripción de qué significa el éxito.
   > Solo los usuarios autenticados con un token JWT válido pueden acceder a los endpoints protegidos.

5. **Technical Requirements** — lista de requisitos de implementación.
   ```text
   - Validar la firma del JWT
   - Validar la expiración del token
   - Rechazar tokens inválidos
   - Soportar claims de rol
   - Integrar con el middleware de Express
   ```

6. **Acceptance Criteria** — la sección más importante; cada requisito debe ser verificable, en formato `Given / When / Then`.
   ```text
   Given un JWT válido
   When se envía una solicitud
   Then se concede el acceso

   Given un JWT expirado
   When se envía una solicitud
   Then se deniega el acceso con HTTP 401

   Given un JWT inválido
   When se envía una solicitud
   Then se deniega el acceso
   ```

7. **Definition of Done (apertura)** — condiciones de alcance funcional que el autor espera ver cumplidas para considerar la issue completa. No sustituye al checklist operativo de cierre de la sección 4 (que valida el proceso de fusión, cobertura, SAST y limpieza); aquí se declara *qué* debe quedar terminado, allá se valida *cómo* se entregó.
   ```text
   - Código implementado
   - Pruebas pasando
   - Documentación actualizada
   - Código revisado
   - CI/CD exitoso
   - Criterios de aceptación satisfechos
   ```

8. **Dependencies** — bloqueos e issues relacionadas.
   ```text
   Depends on: #120 Modelo de Autenticación de Usuario
   Blocked by: #85 Migración de Base de Datos
   ```

9. **Related Resources** — referencias externas (Figma, documentación, arquitectura).
   ```text
   Figma: https://...
   Documentación: https://...
   Arquitectura: https://...
   ```

10. **Risk Assessment** *(opcional, recomendado)* — nivel de riesgo e impacto potencial.
    ```text
    Risk Level: Medium
    Potential impact: un fallo de autenticación podría impedir el acceso de los usuarios a la plataforma.
    ```

11. **Estimation** — story points o esfuerzo estimado.
    ```text
    Story Points: 3
    ```
    o
    ```text
    Estimated Effort: 2 días-persona de desarrollo
    ```

### 3.5 Ejemplo Completo de Issue

```text
Title: [FEATURE] Implementar Middleware de Autenticación JWT
Labels: feature, backend, security, priority:high
Project: Customer Portal V2
Milestone: v1.0.0
Assignee: @john-doe

Summary
Implementar middleware de autenticación JWT para los endpoints protegidos de la API.

Business Context
La plataforma expone actualmente endpoints sin autenticación. El despliegue a
producción requiere control de acceso seguro.

Problem Statement
Usuarios no autenticados pueden acceder a recursos protegidos.

Expected Outcome
Solo los usuarios autenticados pueden acceder a las rutas protegidas.

Technical Requirements
- Validar firmas JWT
- Verificar fechas de expiración
- Soportar claims de rol
- Devolver HTTP 401 ante fallos

Acceptance Criteria
Given un token válido / When se ejecuta una solicitud / Then se concede el acceso
Given un token expirado / When se ejecuta una solicitud / Then se devuelve HTTP 401
Given un token inválido / When se ejecuta una solicitud / Then se devuelve HTTP 401

Definition of Done
- Middleware implementado
- Pruebas unitarias creadas
- Pruebas de integración pasando
- Documentación actualizada
- PR aprobado

Dependencies
Depends on #120

Story Points
5
```

### 3.6 Instrucciones para Agentes de IA al Crear Issues

Al generar una issue nueva, el agente debe:

1. Incluir siempre el contexto de negocio.
2. Incluir siempre criterios de aceptación verificables.
3. Definir siempre resultados medibles.
4. Asignar siempre las etiquetas correctas (tipo, prioridad, área, estado del flujo) respetando la separación de espacios de nombres de la sección 3.3.
5. Identificar siempre las dependencias.
6. Especificar siempre la Definition of Done de apertura.
7. Nunca crear issues vagas.
8. Nunca asumir requisitos implícitos.
9. Preferir requisitos verificables/ejecutables sobre descripciones genéricas.
10. Redactar de forma que un ingeniero ajeno al proyecto pueda completar el trabajo sin necesitar contexto adicional.

---

## 📌 4. Lista de Verificación de Calidad (Definition of Done - DoD)

> ⚠️ **Alcance:** este checklist aplica únicamente a issues que se cierran con la etiqueta `status: resolved` (es decir, con código entregado). Los cierres por `duplicate`, `wontfix`, `cant-reproduce` o `stale` siguen su propio protocolo, descrito en la sección 7, y no requieren cumplir estos puntos.

Una *issue* con `status: resolved` **no puede ser cerrada** bajo ninguna circunstancia si no cumple con el 100% de los siguientes puntos:

- [ ] **Fusión de Código:** Código integrado en la rama productiva (`main` / `master`) mediante Pull Request aprobado.
- [ ] **Calidad de Código:** Cuando el cambio incluya código de producción, cobertura de pruebas unitarias mínima del 80% (o el estándar del proyecto) y cero errores de *linter*.
- [ ] **Seguridad estática (SAST):** El pipeline de CI/CD confirma que no se introdujeron vulnerabilidades ni credenciales expuestas (*secrets*).
- [ ] **Limpieza:** Ramas temporales locales y remotas eliminadas (ej. `feature/*` o `bugfix/*` ya integradas).
- [ ] **Documentación Externa:** Documentación de API (Swagger/Postman) actualizada si hubo cambios en los *endpoints*.

---

## 📝 5. Plantillas Avanzadas de Documentación de Cierre

Copia y pega la plantilla exacta que corresponda al tipo de tarea realizada en el comentario final de la *issue*. **Toda plantilla debe iniciar con el encabezado estándar siguiente**, que unifica los parámetros mínimos para métricas de *velocity* e Inflow/Outflow (sección 7):

```markdown
## 📌 ENCABEZADO ESTÁNDAR
- **ID de Issue:** #
- **Tipo:** `[Bug / Feature / Tarea / Seguridad]`
- **Prioridad / Severidad:** `[Baja / Media / Alta / Crítica]`
- **Responsable del cierre:** [usuario o nombre]
- **Pull Request / Commit:** `org/repo#NNN` (o hash corto de 7 caracteres si no hubo PR)
- **Fecha de cierre:** `AAAA-MM-DD`
```

### Opción A: Corrección de Errores (Bugs)
```markdown
## 🐛 CIERRE DE BUG

### 🔍 Causa Raíz (Root Cause Analysis - RCA)
- **¿Por qué ocurría?:** [Explicación técnica detallada del fallo original en el sistema]
- **Impacto detectado:** [Ej. Degradación de rendimiento, error 500, inconsistencia en BD]

### 💡 Solución Aplicada
- **Cambios realizados:** [Detalle de los archivos modificados y la lógica implementada]
- **Deuda Técnica:** [¿Se generó deuda técnica temporal para esta solución? Sí/No. Si es sí, enlace a la nueva issue creada: #]

### 🧪 Verificación y Pruebas
- [ ] Pruebas unitarias/regresión añadidas para evitar reincidencias.
- [ ] Validado en el entorno de: `[Staging / Producción]`
- **Evidencia de éxito:** [Enlace a captura de pantalla, video, log limpio o reporte del Analista QA]

### 🔗 Telemetría
- **Alertas vinculadas:** [ID de Sentry, Datadog o New Relic si aplica]
```

### Opción B: Nuevas Características (Features / Tasks)
```markdown
## 🚀 CIERRE DE FEATURE / TAREA

### 📋 Resumen de Implementación
- **Criterios cumplidos:** [Breve descripción de cómo la solución satisface la necesidad del negocio]

### 🧪 Verificación y Pruebas
- [ ] Pruebas unitarias/integración añadidas según el estándar de cobertura del proyecto.
- [ ] Validado en el entorno de: `[Staging / Producción]`
- **Evidencia de éxito:** [Enlace a captura de pantalla, video o reporte del Analista QA]

### ⚙️ Impacto Operativo e Infraestructura
- **Cambios en Base de Datos (Migraciones):** `[Sí (Adjuntar archivo de migración) / No]`
- **Variables de Entorno (.env / Secrets):** `[Especificar nombres sin revelar valores, o escribir N/A]`
- **Estrategia de Despliegue:** `[Estándar por CI/CD / Requiere script manual / Requiere ventana de mantenimiento]`
- **Breaking Changes:** `[Sí (especificar plan de contingencia) / No]`

### 📚 Entregables de Conocimiento
- **Wiki / Confluence / Notion:** [Enlace al artículo de arquitectura o guía de usuario]
- **Especificación de API:** [Enlace a Swagger / Postman / Redoc]
```

### Opción C: Incidentes de Seguridad / Parches de Vulnerabilidad
```markdown
## 🛡️ CIERRE DE INCIDENTE DE SEGURIDAD

### ⚠️ Vulnerabilidad Mitigada
- **ID de Vulnerabilidad:** [CVE-XXXX-XXXX o reporte interno de SecOps]
- **Nivel de Severidad:** `[Baja / Media / Alta / Crítica]`

### 🛠️ Acción Correctiva
- **Descripción:** [Actualización de dependencia, sanitización de inputs, restricción de CORS, etc.]

### 🔒 Monitoreo Posterior
- **Plan de vigilancia:** [Especificar si requiere revisión de logs de accesos en los próximos X días]
```

---

## 🤖 6. Reglas de Automatización y Sintaxis

Utiliza palabras clave universales en tus mensajes de *commit* o descripciones de Pull Request para activar los triggers de cierre automático del repositorio:

* **Para GitHub / GitLab:** `Fixes #123`, `Closes #123`, `Resolves #123`.
* **Para Jira (Integración Bitbucket/GitHub):** Escribe el código de la tarea al inicio del commit. Ej: `[PROY-456] Refactorización de componentes de autenticación`.

---

## 🗂️ 7. Políticas de Clasificación de Cierre (Gobernanza)

No todas las issues se cierran porque el código fue completado: la tabla cubre tanto el cierre exitoso (`status: resolved`) como las rutas de cierre alternativas, que **no** pasan por el checklist DoD de la sección 4. Usa las siguientes etiquetas estandarizadas para mantener métricas de velocidad de equipo (*Velocity* e *Inflow/Outflow*) transparentes:


| Etiqueta | Estado de la Solución | Protocolo Requerido para el Cierre |
| :--- | :--- | :--- |
| `status: resolved` | Solución exitosa. | Requiere cualquiera de las plantillas de la sección 5. |
| `status: duplicate` | Caso repetido. | Obligatorio comentar: *"Duplicado de la issue #[Número]".* |
| `status: wontfix` | Descartado intencionalmente. | Requiere aprobación escrita del Product Owner en los comentarios detallando el cambio de prioridad comercial. |
| `status: cant-reproduce`| No replicable. | El desarrollador y QA deben documentar al menos 3 intentos variando entornos, configuraciones, sistemas operativos/navegadores (frontend) o datasets/infraestructura (backend) antes de usar este tag. |
| `status: stale` | Inactiva / Obsoleta. | Tras 30 días sin interacción del reportante, se notifica una vez; si no hay respuesta en 7 días adicionales, se cierra automáticamente. |
