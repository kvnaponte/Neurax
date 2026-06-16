import { pgTable, uuid, varchar, integer, decimal, timestamp, date, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const apolo_peliculas = pgTable('apolo_peliculas', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  year: integer('year'),
  movie: varchar('movie', { length: 500 }).notNull(),
  director: varchar('director', { length: 255 }),
  country: varchar('country', { length: 255 }),
  producer: varchar('producer', { length: 255 }),
  distributed: varchar('distributed', { length: 255 }),
  genre: varchar('genre', { length: 100 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(), // pendiente/vista
  fecha_visualizacion: date('fecha_visualizacion'),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  stars: decimal('stars', { precision: 3, scale: 1 }),
  category: varchar('category', { length: 20 }), // DIAMOND/GOLD/PLATINUM/GOOD/ACEPTABLE/BAD
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_apolo_peliculas_usuario_id': index('idx_apolo_peliculas_usuario_id').on(t.usuario_id),
}))
