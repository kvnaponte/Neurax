import { pgTable, uuid, varchar, text, integer, decimal, timestamp, date, index, boolean } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const proeza_canciones = pgTable('proeza_canciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 500 }).notNull(),
  artista: varchar('artista', { length: 255 }),
  album: varchar('album', { length: 255 }),
  genero: varchar('genero', { length: 100 }),
  año: integer('año'),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  notas: text('notas'),
  fecha_descubrimiento: date('fecha_descubrimiento'),
  fecha_objetivo_lanzamiento: date('fecha_objetivo_lanzamiento'),
  cronos_sincronizado: boolean('cronos_sincronizado').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_proeza_canciones_usuario_id': index('idx_proeza_canciones_usuario_id').on(t.usuario_id),
}))

export const proeza_exploracion_musical = pgTable('proeza_exploracion_musical', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  genero: varchar('genero', { length: 100 }).notNull(),
  artista: varchar('artista', { length: 255 }),
  descripcion: text('descripcion'),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fecha_exploracion: date('fecha_exploracion'),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_proeza_exploracion_usuario_id': index('idx_proeza_exploracion_usuario_id').on(t.usuario_id),
}))
