import { pgTable, uuid, varchar, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const cronosEventos = pgTable('cronos_eventos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  tipo: varchar('tipo', { length: 50 }),
  area: varchar('area', { length: 50 }),
  inicioAt: timestamp('inicio_at', { withTimezone: true }).notNull(),
  finAt: timestamp('fin_at', { withTimezone: true }).notNull(),
  prioridad: varchar('prioridad', { length: 10 }).default('2'),
  completado: boolean('completado').default(false),
  seccionOrigen: varchar('seccion_origen', { length: 50 }),
  seccionRefId: uuid('seccion_ref_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
