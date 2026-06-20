import { db } from '../../db/index.js'
import { kuberaProductos } from '../../db/schema/kubera.js'
import { demeterPresupuestos, demeterMovimientos } from '../../db/schema/demeter.js'
import { eq, and, isNull, desc } from 'drizzle-orm'

type ProductoData = {
  nombre: string
  categoria?: string
  precio_estimado?: string
  precio_real?: string
  enlace?: string
  estado?: string
  fecha_meta?: string
  foto_url?: string
  notas?: string
}

export async function registrarProducto(usuarioId: string, data: ProductoData) {
  const [producto] = await db
    .insert(kuberaProductos)
    .values({
      usuarioId,
      nombre: data.nombre,
      categoria: data.categoria,
      precioEstimado: data.precio_estimado,
      enlace: data.enlace,
      estado: data.estado ?? 'deseado',
      fechaMeta: data.fecha_meta ?? null,
      fotoUrl: data.foto_url,
      notas: data.notas,
    })
    .returning()
  return producto
}

export async function iniciarAhorro(usuarioId: string, productoId: string) {
  const [producto] = await db
    .select()
    .from(kuberaProductos)
    .where(and(eq(kuberaProductos.id, productoId), eq(kuberaProductos.usuarioId, usuarioId), isNull(kuberaProductos.deletedAt)))

  if (!producto) return null

  await db
    .update(kuberaProductos)
    .set({ estado: 'ahorrando', demeterFondoActivo: true, updatedAt: new Date() })
    .where(eq(kuberaProductos.id, productoId))

  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth() + 1

  const [presupuestoExistente] = await db
    .select()
    .from(demeterPresupuestos)
    .where(and(eq(demeterPresupuestos.usuarioId, usuarioId), eq(demeterPresupuestos.anio, anio), eq(demeterPresupuestos.mes, mes)))

  const fondoNuevo = {
    id: productoId,
    nombre: producto.nombre,
    objetivo: producto.precioEstimado ?? '0',
    acumulado: '0',
    activo: true,
  }

  if (presupuestoExistente) {
    const fondosActuales = (presupuestoExistente.fondosEspeciales as Record<string, unknown>[] ?? [])
    await db
      .update(demeterPresupuestos)
      .set({ fondosEspeciales: [...fondosActuales, fondoNuevo] })
      .where(eq(demeterPresupuestos.id, presupuestoExistente.id))
  } else {
    await db
      .insert(demeterPresupuestos)
      .values({
        usuarioId,
        anio,
        mes,
        fondosEspeciales: [fondoNuevo],
      })
  }

  return { producto_id: productoId, fondo_objetivo: producto.precioEstimado, estado: 'ahorrando' }
}

export async function adquirir(usuarioId: string, productoId: string, precioReal: string) {
  const [producto] = await db
    .select()
    .from(kuberaProductos)
    .where(and(eq(kuberaProductos.id, productoId), eq(kuberaProductos.usuarioId, usuarioId), isNull(kuberaProductos.deletedAt)))

  if (!producto) return null

  await db
    .update(kuberaProductos)
    .set({
      estado: 'adquirido',
      precioReal,
      fechaAdquisicion: new Date().toISOString().split('T')[0],
      demeterFondoActivo: false,
      updatedAt: new Date(),
    })
    .where(eq(kuberaProductos.id, productoId))

  // Cerrar fondo en Demeter
  const hoy = new Date()
  const [presupuesto] = await db
    .select()
    .from(demeterPresupuestos)
    .where(
      and(
        eq(demeterPresupuestos.usuarioId, usuarioId),
        eq(demeterPresupuestos.anio, hoy.getFullYear()),
        eq(demeterPresupuestos.mes, hoy.getMonth() + 1)
      )
    )

  if (presupuesto?.fondosEspeciales) {
    const fondos = presupuesto.fondosEspeciales as Record<string, unknown>[]
    const fondosActualizados = fondos.map((f) =>
      f.id === productoId ? { ...f, activo: false } : f
    )
    await db
      .update(demeterPresupuestos)
      .set({ fondosEspeciales: fondosActualizados })
      .where(eq(demeterPresupuestos.id, presupuesto.id))
  }

  // Registrar egreso en Demeter
  await db.insert(demeterMovimientos).values({
    usuarioId,
    tipo: 'egreso',
    monto: precioReal,
    categoria: 'kubera',
    descripcion: `Adquisición: ${producto.nombre}`,
    fechaMovimiento: hoy.toISOString().split('T')[0],
  })

  return { producto_id: productoId, precio_real: precioReal, estado: 'adquirido' }
}

export async function obtenerProductos(usuarioId: string, filtros: { estado?: string; categoria?: string } = {}) {
  const conditions = [eq(kuberaProductos.usuarioId, usuarioId), isNull(kuberaProductos.deletedAt)]
  if (filtros.estado) conditions.push(eq(kuberaProductos.estado, filtros.estado))
  if (filtros.categoria) conditions.push(eq(kuberaProductos.categoria, filtros.categoria))
  return db.select().from(kuberaProductos).where(and(...conditions)).orderBy(desc(kuberaProductos.createdAt))
}

export async function editarProducto(usuarioId: string, productoId: string, data: Partial<ProductoData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.categoria !== undefined) updates.categoria = data.categoria
  if (data.precio_estimado !== undefined) updates.precioEstimado = data.precio_estimado
  if (data.enlace !== undefined) updates.enlace = data.enlace
  if (data.estado !== undefined) updates.estado = data.estado
  if (data.fecha_meta !== undefined) updates.fechaMeta = data.fecha_meta
  if (data.foto_url !== undefined) updates.fotoUrl = data.foto_url
  if (data.notas !== undefined) updates.notas = data.notas
  const [producto] = await db
    .update(kuberaProductos)
    .set(updates)
    .where(and(eq(kuberaProductos.id, productoId), eq(kuberaProductos.usuarioId, usuarioId), isNull(kuberaProductos.deletedAt)))
    .returning()
  return producto
}

export async function eliminarProducto(usuarioId: string, productoId: string) {
  const [producto] = await db
    .update(kuberaProductos)
    .set({ deletedAt: new Date() })
    .where(and(eq(kuberaProductos.id, productoId), eq(kuberaProductos.usuarioId, usuarioId), isNull(kuberaProductos.deletedAt)))
    .returning()
  return producto
}
