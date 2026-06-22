import { and, eq, isNull, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { kubera_productos } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

export function makeKuberaService(db: DB) {
  return {
    async listarProductos(usuarioId: string) {
      return db.select().from(kubera_productos)
        .where(and(eq(kubera_productos.usuario_id, usuarioId), isNull(kubera_productos.deleted_at)))
    },

    async crearProducto(usuarioId: string, data: {
      nombre: string
      categoria?: string
      descripcion?: string
      precio_estimado?: number
      moneda?: string
      url?: string
    }) {
      const [producto] = await db.insert(kubera_productos).values({
        usuario_id: usuarioId,
        nombre: data.nombre,
        categoria: data.categoria ?? null,
        descripcion: data.descripcion ?? null,
        precio_estimado: data.precio_estimado != null ? String(data.precio_estimado) : null,
        moneda: data.moneda ?? 'COP',
        url: data.url ?? null,
      }).returning()
      return producto
    },

    async actualizarProducto(usuarioId: string, productoId: string, data: {
      nombre?: string
      categoria?: string
      descripcion?: string
      precio_estimado?: number
      moneda?: string
      url?: string
      estado?: string
    }) {
      const [existing] = await db.select().from(kubera_productos)
        .where(and(eq(kubera_productos.id, productoId), eq(kubera_productos.usuario_id, usuarioId), isNull(kubera_productos.deleted_at)))
        .limit(1)
      if (!existing) throw Object.assign(new Error('Producto no encontrado'), { statusCode: 404 })

      const set: Record<string, unknown> = { updated_at: sql`now()` }
      if (data.nombre !== undefined) set.nombre = data.nombre
      if (data.categoria !== undefined) set.categoria = data.categoria
      if (data.descripcion !== undefined) set.descripcion = data.descripcion
      if (data.precio_estimado !== undefined) set.precio_estimado = String(data.precio_estimado)
      if (data.moneda !== undefined) set.moneda = data.moneda
      if (data.url !== undefined) set.url = data.url
      if (data.estado !== undefined) set.estado = data.estado

      const [updated] = await db.update(kubera_productos).set(set as any)
        .where(eq(kubera_productos.id, productoId)).returning()
      return updated
    },

    async toggleFondoDemeter(usuarioId: string, productoId: string, activo: boolean) {
      const [existing] = await db.select().from(kubera_productos)
        .where(and(eq(kubera_productos.id, productoId), eq(kubera_productos.usuario_id, usuarioId), isNull(kubera_productos.deleted_at)))
        .limit(1)
      if (!existing) throw Object.assign(new Error('Producto no encontrado'), { statusCode: 404 })

      const [updated] = await db.update(kubera_productos)
        .set({ demeter_fondo_activo: activo, updated_at: sql`now()` })
        .where(eq(kubera_productos.id, productoId))
        .returning()
      return updated
    },

    async eliminarProducto(usuarioId: string, productoId: string) {
      const [existing] = await db.select().from(kubera_productos)
        .where(and(eq(kubera_productos.id, productoId), eq(kubera_productos.usuario_id, usuarioId), isNull(kubera_productos.deleted_at)))
        .limit(1)
      if (!existing) throw Object.assign(new Error('Producto no encontrado'), { statusCode: 404 })

      await db.update(kubera_productos)
        .set({ deleted_at: sql`now()` })
        .where(eq(kubera_productos.id, productoId))
    },
  }
}

export type KuberaService = ReturnType<typeof makeKuberaService>
