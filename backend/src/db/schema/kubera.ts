import { pgTable, uuid, varchar, text, integer, decimal, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const kubera_productos = pgTable('kubera_productos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 500 }).notNull(),
  categoria: varchar('categoria', { length: 100 }),
  descripcion: text('descripcion'),
  precio_estimado: decimal('precio_estimado', { precision: 15, scale: 2 }),
  moneda: varchar('moneda', { length: 10 }).default('COP').notNull(),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  url: text('url'),
  demeter_fondo_activo: boolean('demeter_fondo_activo').default(false).notNull(),
  adquirido_at: timestamp('adquirido_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_kubera_productos_usuario_id': index('idx_kubera_productos_usuario_id').on(t.usuario_id),
}))
