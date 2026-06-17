import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { buildApp } from '../../../test-utils/build-app'
import { db } from '../../../db/index'
import {
  usuarios,
  demeter_movimientos,
  demeter_presupuestos,
  kubera_productos,
  soberbio_lugares,
} from '../../../db/schema'

const EMAIL = `demeter-${Date.now()}@neurax-test.com`
const PASSWORD = 'Test1234'

let app: FastifyInstance
let accessToken: string
let userId: string

const AÑO_ACTUAL = new Date().getUTCFullYear()
const MES_ACTUAL = new Date().getUTCMonth() + 1

async function post(url: string, body: object, token?: string) {
  return app.inject({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

async function put(url: string, body: object, token: string) {
  return app.inject({
    method: 'PUT',
    url,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

async function get(url: string, token: string) {
  return app.inject({ method: 'GET', url, headers: { Authorization: `Bearer ${token}` } })
}

const AUTH = () => ({ Authorization: `Bearer ${accessToken}` })

async function limpiarDemeter() {
  await db.delete(demeter_movimientos).where(eq(demeter_movimientos.usuario_id, userId))
  await db.delete(demeter_presupuestos).where(eq(demeter_presupuestos.usuario_id, userId))
  await db.delete(kubera_productos).where(eq(kubera_productos.usuario_id, userId))
  await db.delete(soberbio_lugares).where(eq(soberbio_lugares.usuario_id, userId))
}

const PRESUPUESTO_BASE = {
  ingreso_esperado: 2_000_000,
  gastos_fijos: 800_000,
  fondos_especiales: [
    { nombre: 'Soberbio', objetivo: 200_000, porcentaje_asignacion: 10 },
    { nombre: 'Michelin', objetivo: 150_000, porcentaje_asignacion: 5 },
    { nombre: 'Odysseia', objetivo: 500_000, porcentaje_asignacion: 15 },
    { nombre: 'Nemesis', objetivo: 300_000, porcentaje_asignacion: 10 },
    { nombre: 'Kubera', objetivo: 400_000, porcentaje_asignacion: 10 },
  ],
}

beforeAll(async () => {
  app = await buildApp()
  await app.ready()

  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  const res = await post('/api/auth/register', {
    nombre: 'Demeter User',
    email: EMAIL,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  })
  const body = res.json()
  accessToken = body.access_token
  userId = body.user.id
})

afterAll(async () => {
  await db.delete(usuarios).where(eq(usuarios.email, EMAIL))
  await app.close()
})

beforeEach(async () => {
  await limpiarDemeter()
})

// ─── WIZARD DE PRESUPUESTO ────────────────────────────────────────────────────

describe('Wizard de presupuesto', () => {
  it('ingreso 2M, gastos_fijos 800k → disponible = 1.2M', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(parseFloat(body.disponible)).toBe(1_200_000)
  })

  it('disponible 1.2M con categorías default → Gastos variables = 480k (40%)', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const body = res.json()
    const cats = body.categorias as any[]
    const gv = cats.find((c: any) => c.nombre === 'Gastos variables')
    expect(gv).toBeDefined()
    expect(parseFloat(gv.monto)).toBe(480_000)
  })

  it('disponible 1.2M → Inversiones = 240k (20%)', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const body = res.json()
    const cats = body.categorias as any[]
    const inv = cats.find((c: any) => c.nombre === 'Inversiones')
    expect(parseFloat(inv.monto)).toBe(240_000)
  })

  it('disponible 1.2M → Entretenimiento = 180k (15%)', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const body = res.json()
    const cats = body.categorias as any[]
    const ent = cats.find((c: any) => c.nombre === 'Entretenimiento')
    expect(parseFloat(ent.monto)).toBe(180_000)
  })

  it('disponible 1.2M → Gastos Personales = 180k (15%)', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const body = res.json()
    const cats = body.categorias as any[]
    const gp = cats.find((c: any) => c.nombre === 'Gastos Personales')
    expect(parseFloat(gp.monto)).toBe(180_000)
  })

  it('disponible 1.2M → Otros = 120k (10%)', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const body = res.json()
    const cats = body.categorias as any[]
    const otros = cats.find((c: any) => c.nombre === 'Otros')
    expect(parseFloat(otros.monto)).toBe(120_000)
  })

  it('porcentajes que no suman 100% → 400', async () => {
    const res = await post('/api/demeter/presupuesto', {
      ingreso_esperado: 2_000_000,
      gastos_fijos: 800_000,
      categorias: [
        { nombre: 'A', porcentaje: 60 },
        { nombre: 'B', porcentaje: 30 },
      ],
    }, accessToken)
    expect(res.statusCode).toBe(400)
  })

  it('gastos_fijos > ingreso_esperado → 400', async () => {
    const res = await post('/api/demeter/presupuesto', {
      ingreso_esperado: 500_000,
      gastos_fijos: 800_000,
    }, accessToken)
    expect(res.statusCode).toBe(400)
  })

  it('UPSERT: re-configurar mismo mes actualiza valores', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const res2 = await put(
      `/api/demeter/presupuesto/${AÑO_ACTUAL}/${MES_ACTUAL}`,
      { ingreso_esperado: 3_000_000, gastos_fijos: 1_000_000 },
      accessToken
    )
    expect(res2.statusCode).toBe(200)
    expect(parseFloat(res2.json().disponible)).toBe(2_000_000)
  })

  it('5 fondos especiales son persistidos', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const body = res.json()
    const fondos = body.fondos_especiales as any[]
    expect(fondos.length).toBe(5)
    expect(fondos.map((f: any) => f.nombre).sort()).toEqual(
      ['Kubera', 'Michelin', 'Nemesis', 'Odysseia', 'Soberbio']
    )
  })

  it('fondos inician con acumulado 0', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const fondos = res.json().fondos_especiales as any[]
    expect(fondos.every((f: any) => f.acumulado === 0)).toBe(true)
  })

  it('sin auth → 401', async () => {
    const res = await post('/api/demeter/presupuesto', PRESUPUESTO_BASE)
    expect(res.statusCode).toBe(401)
  })
})

// ─── REGISTRO DE MOVIMIENTOS ──────────────────────────────────────────────────

describe('Registro de movimientos', () => {
  beforeEach(async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
  })

  it('registrar ingreso → xp_otorgado = 10', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'ingreso',
      monto: 500_000,
      categoria: 'salario',
    }, accessToken)
    expect(res.statusCode).toBe(201)
    expect(res.json().xp_otorgado).toBe(10)
  })

  it('registrar egreso → xp_otorgado = 5', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'egreso',
      monto: 50_000,
      categoria: 'Gastos variables',
    }, accessToken)
    expect(res.statusCode).toBe(201)
    expect(res.json().xp_otorgado).toBe(5)
  })

  it('registrar inversion → xp_otorgado = 15', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'inversion',
      monto: 100_000,
      categoria: 'Inversiones',
    }, accessToken)
    expect(res.statusCode).toBe(201)
    expect(res.json().xp_otorgado).toBe(15)
  })

  it('registrar transferencia → xp_otorgado = 0', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'transferencia',
      monto: 50_000,
      categoria: 'otros',
    }, accessToken)
    expect(res.statusCode).toBe(201)
    expect(res.json().xp_otorgado).toBe(0)
  })

  it('movimiento guardado con datos correctos', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'egreso',
      monto: 75_000,
      categoria: 'Gastos variables',
      descripcion: 'Mercado',
      metodo_pago: 'débito',
    }, accessToken)
    const mov = res.json().movimiento
    expect(mov.tipo).toBe('egreso')
    expect(parseFloat(mov.monto)).toBe(75_000)
    expect(mov.categoria).toBe('Gastos variables')
    expect(mov.descripcion).toBe('Mercado')
  })

  it('tipo inválido → 400', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'regalo',
      monto: 10_000,
      categoria: 'otros',
    }, accessToken)
    expect(res.statusCode).toBe(400)
  })

  it('monto negativo → 400', async () => {
    const res = await post('/api/demeter/movimientos', {
      tipo: 'egreso',
      monto: -5000,
      categoria: 'otros',
    }, accessToken)
    expect(res.statusCode).toBe(400)
  })

  it('movimiento con categoría de fondo actualiza acumulado', async () => {
    await post('/api/demeter/movimientos', {
      tipo: 'ingreso',
      monto: 100_000,
      categoria: 'Soberbio',
    }, accessToken)

    const res = await get('/api/demeter/fondos', accessToken)
    const fondos = res.json() as any[]
    const soberbio = fondos.find((f: any) => f.nombre === 'Soberbio')
    expect(soberbio.acumulado).toBe(100_000)
  })

  it('movimiento sin presupuesto en el mes no falla', async () => {
    await limpiarDemeter()
    const res = await post('/api/demeter/movimientos', {
      tipo: 'ingreso',
      monto: 50_000,
      categoria: 'salario',
    }, accessToken)
    expect(res.statusCode).toBe(201)
  })
})

// ─── FONDO SOBERBIO ───────────────────────────────────────────────────────────

describe('Fondo Soberbio', () => {
  it('fondo al 100% dispara notificación y retorna lugar', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)

    // Crear lugar pendiente en Soberbio
    const [lugar] = await db.insert(soberbio_lugares).values({
      usuario_id: userId,
      nombre: 'La Pepita',
      estado: 'pendiente',
    }).returning()

    // Inyectar el fondo al 100% (objetivo 200k)
    await post('/api/demeter/movimientos', {
      tipo: 'ingreso',
      monto: 200_000,
      categoria: 'Soberbio',
    }, accessToken)

    // Verificar que el fondo quedó notificado
    const [presupuesto] = await db
      .select()
      .from(demeter_presupuestos)
      .where(and(
        eq(demeter_presupuestos.usuario_id, userId),
        eq(demeter_presupuestos.año, AÑO_ACTUAL),
        eq(demeter_presupuestos.mes, MES_ACTUAL),
      ))
      .limit(1)

    const fondos = presupuesto.fondos_especiales as any[]
    const fondoSoberbio = fondos.find((f: any) => f.nombre === 'Soberbio')
    expect(fondoSoberbio.soberbio_notificado).toBe(true)
  })

  it('fondo al 100% sin lugares pendientes → no falla', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)

    const res = await post('/api/demeter/movimientos', {
      tipo: 'ingreso',
      monto: 200_000,
      categoria: 'Soberbio',
    }, accessToken)
    expect(res.statusCode).toBe(201)
  })

  it('fondo al 100% ya notificado → no re-notifica', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    await db.insert(soberbio_lugares).values({ usuario_id: userId, nombre: 'El Cielo', estado: 'pendiente' })

    // Primera vez: notifica y marca notificado
    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 200_000, categoria: 'Soberbio' }, accessToken)

    // Segunda vez: ya notificado, no debe cambiar
    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 50_000, categoria: 'Soberbio' }, accessToken)

    const [presupuesto] = await db
      .select()
      .from(demeter_presupuestos)
      .where(eq(demeter_presupuestos.usuario_id, userId))
      .limit(1)

    const fondos = presupuesto.fondos_especiales as any[]
    const soberbio = fondos.find((f: any) => f.nombre === 'Soberbio')
    expect(soberbio.soberbio_notificado).toBe(true)
    expect(soberbio.acumulado).toBe(250_000)
  })

  it('fondo < 100% → soberbio_notificado sigue false', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    await db.insert(soberbio_lugares).values({ usuario_id: userId, nombre: 'Casa de campo', estado: 'pendiente' })

    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 100_000, categoria: 'Soberbio' }, accessToken)

    const [presupuesto] = await db
      .select()
      .from(demeter_presupuestos)
      .where(eq(demeter_presupuestos.usuario_id, userId))
      .limit(1)

    const fondos = presupuesto.fondos_especiales as any[]
    const soberbio = fondos.find((f: any) => f.nombre === 'Soberbio')
    expect(soberbio.soberbio_notificado).toBe(false)
  })
})

// ─── FONDO KUBERA ─────────────────────────────────────────────────────────────

describe('Fondo Kubera', () => {
  it('fondo Kubera >= objetivo del producto → estado listo_para_adquirir', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)

    const [producto] = await db.insert(kubera_productos).values({
      usuario_id: userId,
      nombre: 'Monitor LG 27"',
      precio_estimado: '300000',
      estado: 'pendiente',
      demeter_fondo_activo: true,
    }).returning()

    // Inyectar 300k en fondo Kubera (objetivo del presupuesto = 400k, pero del producto = 300k)
    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 300_000, categoria: 'Kubera' }, accessToken)

    const [actualizado] = await db
      .select({ estado: kubera_productos.estado })
      .from(kubera_productos)
      .where(eq(kubera_productos.id, producto.id))
      .limit(1)

    expect(actualizado.estado).toBe('listo_para_adquirir')
  })

  it('fondo Kubera < precio_estimado → estado sigue pendiente', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)

    const [producto] = await db.insert(kubera_productos).values({
      usuario_id: userId,
      nombre: 'Macbook Pro',
      precio_estimado: '5000000',
      estado: 'pendiente',
      demeter_fondo_activo: true,
    }).returning()

    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 200_000, categoria: 'Kubera' }, accessToken)

    const [actualizado] = await db
      .select({ estado: kubera_productos.estado })
      .from(kubera_productos)
      .where(eq(kubera_productos.id, producto.id))
      .limit(1)

    expect(actualizado.estado).toBe('pendiente')
  })

  it('producto sin demeter_fondo_activo → no se procesa', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)

    const [producto] = await db.insert(kubera_productos).values({
      usuario_id: userId,
      nombre: 'Teclado',
      precio_estimado: '100000',
      estado: 'pendiente',
      demeter_fondo_activo: false,
    }).returning()

    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 200_000, categoria: 'Kubera' }, accessToken)

    const [actualizado] = await db
      .select({ estado: kubera_productos.estado })
      .from(kubera_productos)
      .where(eq(kubera_productos.id, producto.id))
      .limit(1)

    expect(actualizado.estado).toBe('pendiente')
  })
})

// ─── ESTADO DE PRESUPUESTO ────────────────────────────────────────────────────

describe('Estado de presupuesto', () => {
  beforeEach(async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
  })

  it('GET /status → retorna estado del mes actual', async () => {
    const res = await get('/api/demeter/status', accessToken)
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.año).toBe(AÑO_ACTUAL)
    expect(body.mes).toBe(MES_ACTUAL)
    expect(body.categorias).toHaveLength(5)
  })

  it('sin presupuesto → GET /status devuelve 404', async () => {
    await limpiarDemeter()
    const res = await get('/api/demeter/status', accessToken)
    expect(res.statusCode).toBe(404)
  })

  it('categoría con 82% de uso → alerta_80 true', async () => {
    // Gastos variables: presupuestado = 480k. 82% = ~393.6k
    await post('/api/demeter/movimientos', {
      tipo: 'egreso', monto: 394_000, categoria: 'Gastos variables',
    }, accessToken)

    const res = await get('/api/demeter/status', accessToken)
    const cats = res.json().categorias as any[]
    const gv = cats.find((c: any) => c.nombre === 'Gastos variables')
    expect(gv.alerta_80).toBe(true)
  })

  it('categoría con 79% de uso → alerta_80 false', async () => {
    // 79% de 480k = 379.2k
    await post('/api/demeter/movimientos', {
      tipo: 'egreso', monto: 379_000, categoria: 'Gastos variables',
    }, accessToken)

    const res = await get('/api/demeter/status', accessToken)
    const cats = res.json().categorias as any[]
    const gv = cats.find((c: any) => c.nombre === 'Gastos variables')
    expect(gv.alerta_80).toBe(false)
  })

  it('alerta_general: true cuando alguna categoría ≥ 80%', async () => {
    await post('/api/demeter/movimientos', {
      tipo: 'egreso', monto: 400_000, categoria: 'Gastos variables',
    }, accessToken)

    const res = await get('/api/demeter/status', accessToken)
    expect(res.json().alerta_general).toBe(true)
  })

  it('alerta_general: false cuando ninguna categoría ≥ 80%', async () => {
    const res = await get('/api/demeter/status', accessToken)
    expect(res.json().alerta_general).toBe(false)
  })

  it('GET /status/:año/:mes → retorna presupuesto de mes específico', async () => {
    const res = await get(`/api/demeter/status/${AÑO_ACTUAL}/${MES_ACTUAL}`, accessToken)
    expect(res.statusCode).toBe(200)
    expect(parseFloat(res.json().disponible)).toBe(1_200_000)
  })

  it('GET /status mes sin presupuesto → 404', async () => {
    const res = await get('/api/demeter/status/2020/1', accessToken)
    expect(res.statusCode).toBe(404)
  })

  it('ingresos no cuentan como gasto de categoría', async () => {
    await post('/api/demeter/movimientos', {
      tipo: 'ingreso', monto: 500_000, categoria: 'Gastos variables',
    }, accessToken)

    const res = await get('/api/demeter/status', accessToken)
    const cats = res.json().categorias as any[]
    const gv = cats.find((c: any) => c.nombre === 'Gastos variables')
    expect(gv.gastado).toBe(0)
    expect(gv.alerta_80).toBe(false)
  })
})

// ─── GET FONDOS ───────────────────────────────────────────────────────────────

describe('GET /fondos', () => {
  it('retorna los 5 fondos con sus acumulados', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    const res = await get('/api/demeter/fondos', accessToken)
    expect(res.statusCode).toBe(200)
    const fondos = res.json() as any[]
    expect(fondos).toHaveLength(5)
    expect(fondos.every((f: any) => 'objetivo' in f && 'acumulado' in f && 'porcentaje' in f)).toBe(true)
  })

  it('sin presupuesto → 404', async () => {
    const res = await get('/api/demeter/fondos', accessToken)
    expect(res.statusCode).toBe(404)
  })
})

// ─── REVISIÓN DIARIA ──────────────────────────────────────────────────────────

describe('Revisión diaria', () => {
  it('primera revisión del día → xp_otorgado = 10, ya_revisado = false', async () => {
    const res = await post('/api/demeter/revisar', {}, accessToken)
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.ya_revisado).toBe(false)
    expect(body.xp_otorgado).toBe(10)
  })

  it('segunda revisión del mismo día → ya_revisado = true, xp = 0', async () => {
    await post('/api/demeter/revisar', {}, accessToken)
    const res2 = await post('/api/demeter/revisar', {}, accessToken)
    expect(res2.statusCode).toBe(200)
    const body = res2.json()
    expect(body.ya_revisado).toBe(true)
    expect(body.xp_otorgado).toBe(0)
  })

  it('idempotente: 3 llamadas → xp total solo de 1', async () => {
    for (let i = 0; i < 3; i++) {
      await post('/api/demeter/revisar', {}, accessToken)
    }
    const revisiones = await db
      .select()
      .from(demeter_movimientos)
      .where(and(
        eq(demeter_movimientos.usuario_id, userId),
        eq(demeter_movimientos.tipo, 'revision'),
      ))
    expect(revisiones.length).toBe(1)
  })
})

// ─── LISTAR MOVIMIENTOS ───────────────────────────────────────────────────────

describe('GET /movimientos', () => {
  beforeEach(async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 500_000, categoria: 'salario' }, accessToken)
    await post('/api/demeter/movimientos', { tipo: 'egreso', monto: 50_000, categoria: 'Gastos variables' }, accessToken)
    await post('/api/demeter/movimientos', { tipo: 'inversion', monto: 100_000, categoria: 'Inversiones' }, accessToken)
  })

  it('retorna lista paginada', async () => {
    const res = await get('/api/demeter/movimientos', accessToken)
    expect(res.statusCode).toBe(200)
    const body = res.json() as any[]
    expect(body.length).toBeGreaterThanOrEqual(3)
  })

  it('filtro por tipo', async () => {
    const res = await get('/api/demeter/movimientos?tipo=ingreso', accessToken)
    const body = res.json() as any[]
    expect(body.every((m: any) => m.tipo === 'ingreso')).toBe(true)
  })

  it('filtro por categoria', async () => {
    const res = await get('/api/demeter/movimientos?categoria=Inversiones', accessToken)
    const body = res.json() as any[]
    expect(body.every((m: any) => m.categoria === 'Inversiones')).toBe(true)
  })

  it('paginación: limit=1', async () => {
    const res = await get('/api/demeter/movimientos?limit=1', accessToken)
    expect(res.json().length).toBe(1)
  })
})

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────

describe('GET /estadisticas', () => {
  it('retorna estructura correcta', async () => {
    const res = await get('/api/demeter/estadisticas', accessToken)
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('por_mes')
    expect(body).toHaveProperty('distribucion_categorias')
    expect(body).toHaveProperty('balance_total')
    expect(body).toHaveProperty('tendencia')
  })

  it('por_mes tiene 6 entradas', async () => {
    const res = await get('/api/demeter/estadisticas', accessToken)
    expect(res.json().por_mes).toHaveLength(6)
  })

  it('balance_total = ingresos - egresos', async () => {
    await post('/api/demeter/movimientos', { tipo: 'ingreso', monto: 1_000_000, categoria: 'salario' }, accessToken)
    await post('/api/demeter/movimientos', { tipo: 'egreso', monto: 300_000, categoria: 'gastos' }, accessToken)

    const res = await get('/api/demeter/estadisticas', accessToken)
    expect(res.json().balance_total).toBeGreaterThan(0)
  })
})

// ─── CIERRE DE MES ────────────────────────────────────────────────────────────

describe('Cierre de mes', () => {
  // Tested via service directly (no route exposed — internal use)
  it('sin exceder categorías → xp_bonus = 50', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    // No movements → nothing exceeded
    const { makeDemeterService } = await import('../demeter.service')
    const service = makeDemeterService(db)
    const result = await service.cerrarMes(userId, AÑO_ACTUAL, MES_ACTUAL)
    expect(result.xp_bonus).toBe(50)
    expect(result.alguna_categoria_excedida).toBe(false)
  })

  it('categoría excedida → xp_bonus = 0', async () => {
    await post('/api/demeter/presupuesto', PRESUPUESTO_BASE, accessToken)
    // Superar Gastos variables (480k): gastar 600k
    await post('/api/demeter/movimientos', { tipo: 'egreso', monto: 600_000, categoria: 'Gastos variables' }, accessToken)

    const { makeDemeterService } = await import('../demeter.service')
    const service = makeDemeterService(db)
    const result = await service.cerrarMes(userId, AÑO_ACTUAL, MES_ACTUAL)
    expect(result.xp_bonus).toBe(0)
    expect(result.alguna_categoria_excedida).toBe(true)
  })

  it('sin presupuesto configurado → error 404', async () => {
    const { makeDemeterService } = await import('../demeter.service')
    const service = makeDemeterService(db)
    await expect(service.cerrarMes(userId, 2020, 1)).rejects.toMatchObject({ statusCode: 404 })
  })
})
