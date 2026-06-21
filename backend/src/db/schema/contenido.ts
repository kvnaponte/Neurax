import { pgTable, uuid, varchar, text, integer, decimal, boolean, timestamp, date, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const alejandria_libros = pgTable('alejandria_libros', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 500 }).notNull(),
  autor: varchar('autor', { length: 255 }),
  genero: varchar('genero', { length: 100 }),
  año: integer('año'),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fecha_inicio: date('fecha_inicio'),
  fecha_fin: date('fecha_fin'),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_alejandria_libros_usuario_id': index('idx_alejandria_libros_usuario_id').on(t.usuario_id),
}))

export const michelin_recetas = pgTable('michelin_recetas', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 500 }).notNull(),
  tipo_cocina: varchar('tipo_cocina', { length: 100 }),
  dificultad: varchar('dificultad', { length: 50 }),
  tiempo_minutos: integer('tiempo_minutos'),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fecha_preparacion: date('fecha_preparacion'),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  url_referencia: text('url_referencia'),
  foto_url: text('foto_url'),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_michelin_recetas_usuario_id': index('idx_michelin_recetas_usuario_id').on(t.usuario_id),
}))

export const odysseia_destinos = pgTable('odysseia_destinos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 500 }).notNull(),
  pais: varchar('pais', { length: 100 }),
  tipo: varchar('tipo', { length: 100 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fecha_visita: date('fecha_visita'),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_odysseia_destinos_usuario_id': index('idx_odysseia_destinos_usuario_id').on(t.usuario_id),
}))

export const nemesis_juegos = pgTable('nemesis_juegos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 500 }).notNull(),
  plataforma: varchar('plataforma', { length: 100 }),
  genero: varchar('genero', { length: 100 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fecha_inicio: date('fecha_inicio'),
  fecha_fin: date('fecha_fin'),
  horas_jugadas: decimal('horas_jugadas', { precision: 7, scale: 1 }),
  completado: boolean('completado').default(false).notNull(),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  cover_url: text('cover_url'),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_nemesis_juegos_usuario_id': index('idx_nemesis_juegos_usuario_id').on(t.usuario_id),
}))
