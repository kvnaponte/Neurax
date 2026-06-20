import { pgTable, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core'

export const proezaCanciones = pgTable('proeza_canciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  estadoPipeline: varchar('estado_pipeline', { length: 20 }).default('idea').notNull(),
  beatmaker: varchar('beatmaker', { length: 255 }),
  fechaInicio: date('fecha_inicio'),
  fechaObjetivoLanzamiento: date('fecha_objetivo_lanzamiento'),
  fechaObjetivoMezcla: date('fecha_objetivo_mezcla'),
  links: text('links').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const proezaExploracionMusical = pgTable('proeza_exploracion_musical', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  pais: varchar('pais', { length: 100 }).notNull(),
  ciudad: varchar('ciudad', { length: 100 }).notNull(),
  estado: varchar('estado', { length: 20 }).default('asignado').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
