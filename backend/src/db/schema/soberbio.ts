import { pgTable, uuid, varchar, text, decimal, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const soberbio_lugares = pgTable('soberbio_lugares', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  tipo_cocina: varchar('tipo_cocina', { length: 100 }),
  ubicacion: varchar('ubicacion', { length: 500 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(), // pendiente/visitado
  precio_estimado: decimal('precio_estimado', { precision: 10, scale: 2 }),
  fuente: varchar('fuente', { length: 50 }).default('manual').notNull(), // manual/dionisio/recomendacion
  fecha_visita: date('fecha_visita'),
  calificaciones: jsonb('calificaciones'), // 5 criterios
  calificacion_final: decimal('calificacion_final', { precision: 3, scale: 2 }),
  resena: text('resena'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_soberbio_lugares_usuario_id': index('idx_soberbio_lugares_usuario_id').on(t.usuario_id),
}))
