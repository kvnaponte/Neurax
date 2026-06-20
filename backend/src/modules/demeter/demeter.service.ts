import { eq, sql, and, gte, lte, isNull, desc } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import {
  demeter_movimientos,
  demeter_presupuestos,
  kubera_productos,
  soberbio_lugares,
} from '../../db/schema'
import { makeXpService } from '../gamification/xp.service'
import { notificationsQueue } from '../../jobs/queues'
import { crearNotificacion } from '../notifications/notifications.service'
import { getIo } from '../../shared/io'

type DB = PostgresJsDatabase<typeof schema>

const CATEGORIAS_DEFAULT = [
  { nombre: 'Gastos variables', porcentaje: 40 },
  { nombre: 'Inversiones', porcentaje: 20 },
  { nombre: 'Entretenimiento', porcentaje: 15 },
  { nombre: 'Gastos Personales', porcentaje: 15 },
  { nombre: 'Otros', porcentaje: 10 },
]

const XP_POR_TIPO: Record<string, number> = {
  ingreso: 10,
  egreso: 5,
  inversion: 15,
  transferencia: 0,
}

function calcularProximaFecha(fecha: string, frecuencia: string): string {
  const d = new Date(fecha)
  if (frecuencia === 'mensual') d.setMonth(d.getMonth() + 1)
  else if (frecuencia === 'semanal') d.setDate(d.getDate() + 7)
  else if (frecuencia === 'quincenal') d.setDate(d.getDate() + 15)
  else if (frecuencia === 'anual') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function makeDemeterService(db: DB) {
  const xpService = makeXpService(db)

  async function getPresupuesto(usuarioId: string, año: number, mes: number) {
    const [row] = await db
      .select()
      .from(demeter_presupuestos)
      .where(and(
        eq(demeter_presupuestos.usuario_id, usuarioId),
        eq(demeter_presupuestos.año, año),
        eq(demeter_presupuestos.mes, mes),
      ))
      .limit(1)
    return row ?? null
  }

  async function configurarPresupuesto(
    usuarioId: string,
    año: number,
    mes: number,
    data: {
      ingreso_esperado: number
      gastos_fijos: number
      categorias?: { nombre: string; porcentaje: number }[]
      fondos_especiales?: { nombre: string; objetivo: number; porcentaje_asignacion: number }[]
    }
  ) {
    const disponible = data.ingreso_esperado - data.gastos_fijos
    if (disponible < 0)
      throw Object.assign(new Error('Los gastos fijos superan el ingreso esperado'), { statusCode: 400 })

    const cats = data.categorias ?? CATEGORIAS_DEFAULT
    const totalPct = cats.reduce((s, c) => s + c.porcentaje, 0)
    if (Math.abs(totalPct - 100) > 0.01)
      throw Object.assign(new Error('Los porcentajes de categorías deben sumar 100%'), { statusCode: 400 })

    const categoriasConMonto = cats.map(c => ({
      nombre: c.nombre,
      porcentaje: c.porcentaje,
      monto: parseFloat(((c.porcentaje / 100) * disponible).toFixed(2)),
    }))

    const existing = await getPresupuesto(usuarioId, año, mes)
    const existingFondos: any[] = (existing?.fondos_especiales as any[]) ?? []

    const fondos = (data.fondos_especiales ?? []).map(f => {
      const prev = existingFondos.find((ef: any) => ef.nombre === f.nombre)
      return {
        nombre: f.nombre,
        objetivo: f.objetivo,
        acumulado: prev?.acumulado ?? 0,
        porcentaje_asignacion: f.porcentaje_asignacion,
        soberbio_notificado: prev?.soberbio_notificado ?? false,
      }
    })

    const [result] = await db
      .insert(demeter_presupuestos)
      .values({
        usuario_id: usuarioId,
        año,
        mes,
        ingreso_esperado: String(data.ingreso_esperado),
        gastos_fijos: String(data.gastos_fijos),
        disponible: String(disponible),
        categorias: categoriasConMonto,
        fondos_especiales: fondos,
      })
      .onConflictDoUpdate({
        target: [demeter_presupuestos.usuario_id, demeter_presupuestos.año, demeter_presupuestos.mes],
        set: {
          ingreso_esperado: sql`excluded.ingreso_esperado`,
          gastos_fijos: sql`excluded.gastos_fijos`,
          disponible: sql`excluded.disponible`,
          categorias: sql`excluded.categorias`,
          fondos_especiales: sql`excluded.fondos_especiales`,
        },
      })
      .returning()

    return result
  }

  async function registrarMovimiento(
    usuarioId: string,
    data: {
      tipo: string
      monto: number
      moneda?: string
      categoria: string
      descripcion?: string
      metodo_pago?: string
      es_recurrente?: boolean
      frecuencia_recurrente?: string
      fecha_movimiento?: string
    }
  ) {
    const hoy = data.fecha_movimiento ?? new Date().toISOString().slice(0, 10)

    const [mov] = await db
      .insert(demeter_movimientos)
      .values({
        usuario_id: usuarioId,
        tipo: data.tipo,
        monto: String(data.monto),
        moneda: data.moneda ?? 'COP',
        categoria: data.categoria,
        descripcion: data.descripcion,
        metodo_pago: data.metodo_pago,
        es_recurrente: data.es_recurrente ?? false,
        frecuencia_recurrente: data.frecuencia_recurrente,
        fecha_movimiento: hoy,
      })
      .returning()

    const xpBase = XP_POR_TIPO[data.tipo] ?? 0
    let xp_otorgado = 0
    if (xpBase > 0) {
      const xpResult = await xpService.otorgarXP({
        usuarioId,
        xpBase,
        bonusHorario: 1.0,
        bonusRacha: 1.0,
        fuente: 'demeter_movimiento',
        fuenteId: mov.id,
      })
      xp_otorgado = xpResult.xp_otorgado
    }

    if (data.es_recurrente && data.frecuencia_recurrente) {
      await notificationsQueue.add('demeter_recurrente', {
        usuarioId,
        movimientoId: mov.id,
        frecuencia: data.frecuencia_recurrente,
        proximaFecha: calcularProximaFecha(hoy, data.frecuencia_recurrente),
      })
    }

    // Actualizar acumulado de fondo si la categoría coincide
    const fechaObj = new Date(hoy + 'T12:00:00Z')
    const año = fechaObj.getUTCFullYear()
    const mes = fechaObj.getUTCMonth() + 1
    const presupuesto = await getPresupuesto(usuarioId, año, mes)
    if (presupuesto?.fondos_especiales) {
      const fondos: any[] = presupuesto.fondos_especiales as any[]
      const fondo = fondos.find((f: any) => f.nombre.toLowerCase() === data.categoria.toLowerCase())
      if (fondo) {
        fondo.acumulado = parseFloat(((fondo.acumulado ?? 0) + data.monto).toFixed(2))
        await db
          .update(demeter_presupuestos)
          .set({ fondos_especiales: fondos })
          .where(eq(demeter_presupuestos.id, presupuesto.id))
        await verificarFondosSoberbio(usuarioId)
        await verificarFondosKubera(usuarioId)
      }
    }

    return { movimiento: mov, xp_otorgado }
  }

  async function verificarFondosSoberbio(usuarioId: string) {
    const ahora = new Date()
    const año = ahora.getUTCFullYear()
    const mes = ahora.getUTCMonth() + 1
    const presupuesto = await getPresupuesto(usuarioId, año, mes)
    if (!presupuesto?.fondos_especiales) return null

    const fondos: any[] = presupuesto.fondos_especiales as any[]
    const fondo = fondos.find((f: any) => f.nombre === 'Soberbio')
    if (!fondo || fondo.acumulado < fondo.objetivo || fondo.soberbio_notificado) return null

    const lugares = await db
      .select()
      .from(soberbio_lugares)
      .where(and(
        eq(soberbio_lugares.usuario_id, usuarioId),
        eq(soberbio_lugares.estado, 'pendiente'),
        isNull(soberbio_lugares.deleted_at),
      ))
    if (lugares.length === 0) return null

    const lugar = lugares[Math.floor(Math.random() * lugares.length)]

    await crearNotificacion(db, getIo(), usuarioId, {
      tipo: 'meta_demeter',
      titulo: '¡Fondo Soberbio listo!',
      mensaje: `¡Ya tienes presupuesto para visitar ${lugar.nombre}!`,
      data: { lugar_id: lugar.id, subtipo: 'soberbio' },
    })

    fondo.soberbio_notificado = true
    await db
      .update(demeter_presupuestos)
      .set({ fondos_especiales: fondos })
      .where(eq(demeter_presupuestos.id, presupuesto.id))

    return lugar
  }

  async function verificarFondosKubera(usuarioId: string) {
    const ahora = new Date()
    const año = ahora.getUTCFullYear()
    const mes = ahora.getUTCMonth() + 1
    const presupuesto = await getPresupuesto(usuarioId, año, mes)
    if (!presupuesto?.fondos_especiales) return

    const fondos: any[] = presupuesto.fondos_especiales as any[]
    const fondoKubera = fondos.find((f: any) => f.nombre === 'Kubera')
    if (!fondoKubera) return

    const productos = await db
      .select()
      .from(kubera_productos)
      .where(and(
        eq(kubera_productos.usuario_id, usuarioId),
        eq(kubera_productos.demeter_fondo_activo, true),
        eq(kubera_productos.estado, 'pendiente'),
        isNull(kubera_productos.deleted_at),
      ))

    for (const producto of productos) {
      const objetivo = parseFloat(producto.precio_estimado ?? '0')
      if (fondoKubera.acumulado >= objetivo && objetivo > 0) {
        await db
          .update(kubera_productos)
          .set({ estado: 'listo_para_adquirir', updated_at: sql`now()` })
          .where(eq(kubera_productos.id, producto.id))

        await crearNotificacion(db, getIo(), usuarioId, {
          tipo: 'meta_demeter',
          titulo: '¡Producto Kubera listo!',
          mensaje: `Ya tienes presupuesto para adquirir ${producto.nombre}.`,
          data: { producto_id: producto.id, subtipo: 'kubera' },
        })
      }
    }
  }

  async function obtenerEstadoPresupuesto(usuarioId: string, año: number, mes: number) {
    const presupuesto = await getPresupuesto(usuarioId, año, mes)
    if (!presupuesto) return null

    const diasEnMes = new Date(año, mes, 0).getDate()
    const inicioMes = `${año}-${String(mes).padStart(2, '0')}-01`
    const finMes = `${año}-${String(mes).padStart(2, '0')}-${String(diasEnMes).padStart(2, '0')}`

    const rows = await db
      .select({
        categoria: demeter_movimientos.categoria,
        tipo: demeter_movimientos.tipo,
        total: sql<string>`sum(${demeter_movimientos.monto}::numeric)`,
      })
      .from(demeter_movimientos)
      .where(and(
        eq(demeter_movimientos.usuario_id, usuarioId),
        gte(demeter_movimientos.fecha_movimiento, inicioMes),
        lte(demeter_movimientos.fecha_movimiento, finMes),
        isNull(demeter_movimientos.deleted_at),
      ))
      .groupBy(demeter_movimientos.categoria, demeter_movimientos.tipo)

    const gastadoPorCategoria: Record<string, number> = {}
    for (const r of rows) {
      if (r.tipo === 'egreso') {
        gastadoPorCategoria[r.categoria] = (gastadoPorCategoria[r.categoria] ?? 0) + parseFloat(r.total ?? '0')
      }
    }

    const cats: any[] = (presupuesto.categorias as any[]) ?? []
    let alerta_general = false
    const categorias = cats.map((c: any) => {
      const gastado = gastadoPorCategoria[c.nombre] ?? 0
      const porcentaje_uso = c.monto > 0 ? gastado / c.monto : 0
      const alerta_80 = porcentaje_uso >= 0.8
      if (alerta_80) alerta_general = true
      return {
        nombre: c.nombre,
        presupuestado: parseFloat(c.monto),
        gastado: parseFloat(gastado.toFixed(2)),
        porcentaje_uso: parseFloat((porcentaje_uso * 100).toFixed(1)),
        alerta_80,
      }
    })

    const fondos: any[] = (presupuesto.fondos_especiales as any[]) ?? []
    const fondos_especiales = fondos.map((f: any) => ({
      nombre: f.nombre,
      objetivo: f.objetivo,
      acumulado: f.acumulado ?? 0,
      porcentaje: f.objetivo > 0 ? parseFloat(((f.acumulado ?? 0) / f.objetivo * 100).toFixed(1)) : 0,
      porcentaje_asignacion: f.porcentaje_asignacion,
    }))

    return {
      año,
      mes,
      ingreso_esperado: parseFloat(presupuesto.ingreso_esperado),
      gastos_fijos: parseFloat(presupuesto.gastos_fijos),
      disponible: parseFloat(presupuesto.disponible),
      categorias,
      fondos_especiales,
      alerta_general,
    }
  }

  async function revisarPresupuesto(usuarioId: string) {
    const hoy = new Date().toISOString().slice(0, 10)
    const [existing] = await db
      .select({ id: demeter_movimientos.id })
      .from(demeter_movimientos)
      .where(and(
        eq(demeter_movimientos.usuario_id, usuarioId),
        eq(demeter_movimientos.tipo, 'revision'),
        eq(demeter_movimientos.fecha_movimiento, hoy),
        isNull(demeter_movimientos.deleted_at),
      ))
      .limit(1)

    if (existing) return { ya_revisado: true, xp_otorgado: 0 }

    await db.insert(demeter_movimientos).values({
      usuario_id: usuarioId,
      tipo: 'revision',
      monto: '0',
      categoria: 'revision_diaria',
      fecha_movimiento: hoy,
    })

    const xpResult = await xpService.otorgarXP({
      usuarioId,
      xpBase: 10,
      bonusHorario: 1.0,
      bonusRacha: 1.0,
      fuente: 'demeter_revision',
    })

    return { ya_revisado: false, xp_otorgado: xpResult.xp_otorgado }
  }

  async function cerrarMes(usuarioId: string, año: number, mes: number) {
    const estado = await obtenerEstadoPresupuesto(usuarioId, año, mes)
    if (!estado) throw Object.assign(new Error('No hay presupuesto configurado para este mes'), { statusCode: 404 })

    const alguna_excedida = estado.categorias.some((c: any) => c.gastado > c.presupuestado)
    let xp_bonus = 0
    if (!alguna_excedida) {
      const xpResult = await xpService.otorgarXP({
        usuarioId,
        xpBase: 50,
        bonusHorario: 1.0,
        bonusRacha: 1.0,
        fuente: 'demeter_cierre_mes',
      })
      xp_bonus = xpResult.xp_otorgado
    }

    return { xp_bonus, alguna_categoria_excedida: alguna_excedida }
  }

  async function obtenerHistorialMovimientos(
    usuarioId: string,
    limit = 20,
    offset = 0,
    filtros?: { tipo?: string; categoria?: string; desde?: string; hasta?: string }
  ) {
    const conditions: any[] = [
      eq(demeter_movimientos.usuario_id, usuarioId),
      isNull(demeter_movimientos.deleted_at),
    ]
    if (filtros?.tipo) conditions.push(eq(demeter_movimientos.tipo, filtros.tipo))
    if (filtros?.categoria) conditions.push(eq(demeter_movimientos.categoria, filtros.categoria))
    if (filtros?.desde) conditions.push(gte(demeter_movimientos.fecha_movimiento, filtros.desde))
    if (filtros?.hasta) conditions.push(lte(demeter_movimientos.fecha_movimiento, filtros.hasta))

    return db
      .select()
      .from(demeter_movimientos)
      .where(and(...conditions))
      .orderBy(desc(demeter_movimientos.fecha_movimiento), desc(demeter_movimientos.created_at))
      .limit(limit)
      .offset(offset)
  }

  async function obtenerEstadisticas(usuarioId: string) {
    const ahora = new Date()
    const meses: { año: number; mes: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      meses.push({ año: d.getFullYear(), mes: d.getMonth() + 1 })
    }

    const inicio = `${meses[0].año}-${String(meses[0].mes).padStart(2, '0')}-01`

    const rows = await db
      .select({
        año: sql<number>`extract(year from ${demeter_movimientos.fecha_movimiento}::date)::int`,
        mes: sql<number>`extract(month from ${demeter_movimientos.fecha_movimiento}::date)::int`,
        tipo: demeter_movimientos.tipo,
        total: sql<string>`sum(${demeter_movimientos.monto}::numeric)`,
      })
      .from(demeter_movimientos)
      .where(and(
        eq(demeter_movimientos.usuario_id, usuarioId),
        isNull(demeter_movimientos.deleted_at),
        gte(demeter_movimientos.fecha_movimiento, inicio),
      ))
      .groupBy(
        sql`extract(year from ${demeter_movimientos.fecha_movimiento}::date)`,
        sql`extract(month from ${demeter_movimientos.fecha_movimiento}::date)`,
        demeter_movimientos.tipo,
      )

    const por_mes = meses.map(({ año, mes }) => {
      let ingresos = 0
      let egresos = 0
      for (const r of rows) {
        if (r.año === año && r.mes === mes) {
          if (r.tipo === 'ingreso') ingresos = parseFloat(r.total ?? '0')
          if (r.tipo === 'egreso') egresos = parseFloat(r.total ?? '0')
        }
      }
      return { año, mes, ingresos, egresos }
    })

    const distribRows = await db
      .select({
        categoria: demeter_movimientos.categoria,
        total: sql<string>`sum(${demeter_movimientos.monto}::numeric)`,
      })
      .from(demeter_movimientos)
      .where(and(
        eq(demeter_movimientos.usuario_id, usuarioId),
        eq(demeter_movimientos.tipo, 'egreso'),
        isNull(demeter_movimientos.deleted_at),
      ))
      .groupBy(demeter_movimientos.categoria)

    const distribucion_categorias = distribRows.map(r => ({
      categoria: r.categoria,
      total: parseFloat(r.total ?? '0'),
    }))

    const balance_total = por_mes.reduce((s, m) => s + m.ingresos - m.egresos, 0)

    const tendencia = por_mes.slice(1).map((m, i) => {
      const prev = por_mes[i]
      const ahorro = m.ingresos - m.egresos
      const variacion = ahorro - (prev.ingresos - prev.egresos)
      return { año: m.año, mes: m.mes, ahorro: parseFloat(ahorro.toFixed(2)), variacion: parseFloat(variacion.toFixed(2)) }
    })

    return { por_mes, distribucion_categorias, balance_total, tendencia }
  }

  return {
    configurarPresupuesto,
    registrarMovimiento,
    obtenerEstadoPresupuesto,
    verificarFondosSoberbio,
    verificarFondosKubera,
    revisarPresupuesto,
    cerrarMes,
    obtenerHistorialMovimientos,
    obtenerEstadisticas,
  }
}
