import { pgTable, uuid, varchar, text, decimal, date, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const soberbioLugares = pgTable('soberbio_lugares', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  tipoCocina: varchar('tipo_cocina', { length: 100 }),
  ubicacion: varchar('ubicacion', { length: 255 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  precioEstimado: decimal('precio_estimado', { precision: 15, scale: 2 }),
  fuente: varchar('fuente', { length: 30 }).default('manual'),
  fechaVisita: date('fecha_visita'),
  calificaciones: jsonb('calificaciones'),
  calificacionFinal: decimal('calificacion_final', { precision: 4, scale: 2 }),
  resena: text('resena'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
