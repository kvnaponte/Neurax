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
- **Fondo de Experiencias (Soberbio)**: presupuesto dedicado a visitar restaurantes
- **Fondo Kubera**: ahorro hacia productos deseados en Kubera
- Ambos se configuran con un monto objetivo mensual y se llenan automáticamente desde el % de Entretenimiento

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

Al inicio de cada mes (o la primera vez):
1. El sistema pregunta el **ingreso esperado del mes**
2. El usuario define los **porcentajes por categoría** (con sugerencias pre-cargadas)
3. El sistema calcula los montos absolutos: `monto = ingreso × porcentaje`
4. El usuario puede ajustar los montos absolutos directamente (recalcula los porcentajes)

### Gestión Multi-mes
- El presupuesto se puede configurar para replicarse automáticamente mes a mes
- El usuario puede modificar cualquier mes específico
- El sistema guarda el historial de presupuestos anteriores

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

El agente IA (Claude) puede interactuar con Demeter vía API Key:
- Registrar ingresos y egresos enviados por el usuario en chat
- Consultar el estado del presupuesto
- Generar reportes de gasto

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
  -- {"soberbio": {"objetivo": 200000, "acumulado": 120000}, "kubera": {...}}
  
  UNIQUE(usuario_id, año, mes),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demeter_usuario_fecha ON demeter_movimientos(usuario_id, fecha DESC);
CREATE INDEX idx_demeter_usuario_categoria ON demeter_movimientos(usuario_id, categoria, fecha DESC);
```
