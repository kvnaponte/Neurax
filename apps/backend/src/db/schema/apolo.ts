import { pgTable, uuid, integer, varchar, date, decimal, timestamp } from 'drizzle-orm/pg-core'

export const apoloPeliculas = pgTable('apolo_peliculas', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  year: integer('year'),
  movie: varchar('movie', { length: 255 }).notNull(),
  director: varchar('director', { length: 255 }),
  country: varchar('country', { length: 100 }),
  producer: varchar('producer', { length: 255 }),
  distributed: varchar('distributed', { length: 255 }),
  genre: varchar('genre', { length: 100 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fechaVisualizacion: date('fecha_visualizacion'),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  stars: decimal('stars', { precision: 3, scale: 1 }),
  category: varchar('category', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
