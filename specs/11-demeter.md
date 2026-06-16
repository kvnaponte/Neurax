# NEURAX — Sección Demeter (Finanzas y Patrimonio)

## Propósito
Demeter gestiona las finanzas personales del usuario: ingresos, egresos, inversiones y patrimonio. Opera con un sistema de presupuesto mensual por categorías y está conectada con Soberbio (experiencias) y Kubera (deseos materiales).

---

## Pantalla Principal de Demeter

### Mobile Layout
```
┌─────────────────────────────────────────┐
│  DEMETER                     [+ Reg.]  │
│  Patrimonio total: $X,XXX,XXX           │
├─────────────────────────────────────────┤
│  PRESUPUESTO JUNIO 2026                 │
│  Ingresado:  $XXX / $X,XXX objetivo     │
│  [████████░░░░░░░░░░] 68%               │
├─────────────────────────────────────────┤
│  DISTRIBUCIÓN DEL MES                   │
│                                         │
│  Gastos fijos    [████████████] 40%     │
│  Inversiones     [██████░░░░░░] 25%     │
│  Entretenimiento [████░░░░░░░░] 15%     │
│  Gastos pers.    [████░░░░░░░░] 15%     │
│  Otros           [█░░░░░░░░░░░]  5%     │
├─────────────────────────────────────────┤
│  ÚLTIMOS MOVIMIENTOS                    │
│  [↑] Salario     +$X,XXX    Hoy 09:00  │
│  [↓] Arriendo    -$XXX      Ayer 15:30  │
│  [↑] Freelance   +$XXX      Jun 14     │
│  [↓] Supermercado -$XXX     Jun 13     │
├─────────────────────────────────────────┤
│  FONDOS ESPECIALES                      │
│  [🍽️ Experiencias] $XXX / $XXX  [██░░]  │
│  [🛍️ Kubera]       $XXX / $XXX  [████]  │
└─────────────────────────────────────────┘
```

---

## Categorías de Presupuesto

### Categorías Predefinidas
| Categoría | Descripción | % Sugerido |
|-----------|-------------|-----------|
| **Gastos Fijos** | Arriendo, servicios, suscripciones | 40% |
| **Inversiones** | Ahorro, bolsa, cripto, fondo emergencia | 20% |
| **Entretenimiento** | Restaurantes, cine, salidas, viajes | 15% |
| **Gastos Personales** | Ropa, higiene, caprichos | 15% |
| **Otros** | Imprevistos, regalos, varios | 10% |

Los porcentajes son **sugerencias** — el usuario los define a su gusto. Deben sumar 100%.

### Fondos Especiales (dentro de Entretenimiento)
Todos los fondos especiales se configuran con un monto objetivo y se llenan automáticamente desde el % de Entretenimiento del mes:

| Fondo | Sección | Propósito |
|-------|---------|-----------|
| **Fondo Soberbio** | Soberbio | Presupuesto para visitar restaurantes y experiencias gastronómicas |
| **Fondo Michelin** | Michelin | Presupuesto para ingredientes de recetas por cocinar |
| **Fondo Odysseia** | Odysseia | Presupuesto para viajes y turismo |
| **Fondo Némesis** | Némesis | Presupuesto para compra de videojuegos o membresías de gaming |
| **Fondo Kubera** | Kubera | Ahorro hacia productos deseados en la lista de deseos |

Cuando un fondo alcanza su objetivo, el sistema dispara el flujo correspondiente: sugiere una receta (Michelin), propone fechas para el viaje (Odysseia × Cronnos), notifica que puede comprar el juego (Némesis), etc.

---

## Registro de Movimientos

### Tipos de Movimiento
| Tipo | Ícono | Descripción |
|------|-------|-------------|
| **Ingreso** | ↑ verde | Dinero que entra (salario, freelance, venta, regalo) |
| **Egreso** | ↓ rojo | Dinero que sale (pago, compra, deuda) |
| **Inversión** | ◈ azul | Dinero que se mueve a inversión |
| **Transferencia** | ↔ gris | Movimiento entre categorías o fondos |

### Campos de un Movimiento
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Tipo | Enum | Sí |
| Monto | Decimal (moneda local) | Sí |
| Categoría | Selector (lista de categorías) | Sí |
| Descripción | Texto libre | No |
| Fecha | Date | Sí (default: hoy) |
| Método de pago | Efectivo / Tarjeta / Transferencia / Otro | No |
| Recurrente | Boolean | No |
| Frecuencia (si recurrente) | Mensual / Quincenal / Semanal | Solo si recurrente |

---

## Configuración del Presupuesto Mensual

### Primera vez
La **primera vez que el usuario entra a la sección Demeter**, el sistema muestra un wizard de configuración:
1. Pregunta los **gastos fijos mensuales** (arriendo, servicios, suscripciones, deudas fijas)
2. Pregunta el **ingreso esperado del mes**
3. El sistema calcula automáticamente cuánto queda libre: `disponible = ingreso - gastos_fijos`
4. El usuario define los **porcentajes de las categorías variables** sobre el disponible (con sugerencias pre-cargadas)
5. El sistema calcula los montos absolutos: `monto = disponible × porcentaje`

El wizard **no vuelve a aparecer automáticamente**. El presupuesto configurado se replica mes a mes.

### Re-distribución de Gastos
El botón **"Re-distribuir gastos"** (visible en la pantalla principal de Demeter) permite volver a ejecutar el wizard completo:
- Útil si los gastos fijos cambian (nuevo arriendo, nueva suscripción, etc.)
- Aplica desde el mes actual en adelante
- El historial de meses anteriores no se modifica

### Gestión Multi-mes
- El usuario puede modificar cualquier mes específico sin afectar los demás
- El sistema guarda el historial de presupuestos anteriores para comparativas

---

## Alertas de Demeter

| Alerta | Trigger | Acción |
|--------|---------|--------|
| Categoría al 80% | El gasto en una categoría llega al 80% del presupuesto | Notificación push |
| Categoría superada | El gasto supera el presupuesto de una categoría | Notificación + badge rojo |
| Fondo Soberbio listo | El fondo alcanza el objetivo para una experiencia | Trigger del flujo Cronnos |
| Fondo Kubera listo | El fondo alcanza el objetivo de un producto | Notificación a Kubera |
| Ingreso registrado | Cualquier ingreso > $X (configurable) | Opcional notificación |

---

## Gestión vía IA

El agente IA (via CLI, ver spec 02-tech-stack — Estrategia CLI) puede interactuar con Demeter a través de endpoints internos del sistema:
- Registrar ingresos y egresos enviados por el usuario en lenguaje natural
- Consultar el estado del presupuesto
- Generar reportes de gasto
- Los archivos de memoria del usuario incluyen contexto financiero para mejorar las respuestas con el tiempo

Ejemplos de comandos del usuario al agente:
- "Gasté 50.000 en el supermercado hoy" → registra egreso en Gastos Personales
- "Recibí el pago de $2.000.000" → registra ingreso
- "¿Cómo voy en entretenimiento este mes?" → retorna estado del presupuesto

---

## Estadísticas de Demeter

- **Gráfica de ingresos vs egresos**: barras mensuales, últimos 6 meses
- **Distribución de gastos**: donut chart por categoría
- **Tendencia de ahorro**: % de ingresos ahorrado/invertido mes a mes
- **Balance general**: patrimonio neto estimado (ingresos acumulados − egresos acumulados)
- **Gastos recurrentes**: lista de compromisos fijos del mes

---

## XP de Demeter

| Acción | XP |
|--------|-----|
| Registrar ingreso | 10 XP |
| Registrar egreso | 5 XP |
| Registrar inversión | 15 XP |
| Revisar presupuesto del mes | 10 XP (1 vez/día) |
| Cerrar mes sin exceder presupuesto | 50 XP (bonus mensual) |

---

## Base de Datos

```sql
CREATE TABLE demeter_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  
  tipo VARCHAR(20) NOT NULL,  -- 'ingreso', 'egreso', 'inversion', 'transferencia'
  monto DECIMAL(15,2) NOT NULL,
  moneda CHAR(3) DEFAULT 'COP',
  categoria VARCHAR(50) NOT NULL,
  descripcion TEXT,
  metodo_pago VARCHAR(30),
  
  es_recurrente BOOLEAN DEFAULT FALSE,
  frecuencia_recurrente VARCHAR(20),  -- 'mensual', 'quincenal', 'semanal'
  
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE demeter_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  
  año INTEGER NOT NULL,
  mes SMALLINT NOT NULL,  -- 1-12
  ingreso_esperado DECIMAL(15,2) NOT NULL,
  
  categorias JSONB NOT NULL,
  -- Ejemplo:
  -- {
  --   "gastos_fijos": {"pct": 40, "monto": 800000},
  --   "inversiones": {"pct": 20, "monto": 400000},
  --   "entretenimiento": {"pct": 15, "monto": 300000},
  --   "gastos_personales": {"pct": 15, "monto": 300000},
  --   "otros": {"pct": 10, "monto": 200000}
  -- }
  
  fondos_especiales JSONB DEFAULT '{}',
  -- {"soberbio": {"objetivo": 200000, "acumulado": 120000},
  --  "michelin": {"objetivo": 80000, "acumulado": 40000},
  --  "odysseia": {"objetivo": 500000, "acumulado": 200000},
  --  "nemesis": {"objetivo": 150000, "acumulado": 90000},
  --  "kubera": {"objetivo": 300000, "acumulado": 300000}}
  
  UNIQUE(usuario_id, año, mes),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demeter_usuario_fecha ON demeter_movimientos(usuario_id, fecha DESC);
CREATE INDEX idx_demeter_usuario_categoria ON demeter_movimientos(usuario_id, categoria, fecha DESC);
```
