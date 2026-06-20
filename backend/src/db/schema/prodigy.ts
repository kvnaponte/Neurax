import { pgTable, uuid, varchar, text, integer, decimal, boolean, timestamp, date, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'
import { cronos_eventos } from './cronos'

export const prodigy_cursos = pgTable('prodigy_cursos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 500 }).notNull(),
  plataforma: varchar('plataforma', { length: 100 }),
  instructor: varchar('instructor', { length: 255 }),
  categoria: varchar('categoria', { length: 100 }),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  fecha_inicio: date('fecha_inicio'),
  fecha_fin: date('fecha_fin'),
  progreso: integer('progreso').default(0).notNull(), // 0-100
  total_horas: decimal('total_horas', { precision: 6, scale: 1 }),
  horas_completadas: decimal('horas_completadas', { precision: 6, scale: 1 }).default('0').notNull(),
  certificado: boolean('certificado').default(false).notNull(),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_prodigy_cursos_usuario_id': index('idx_prodigy_cursos_usuario_id').on(t.usuario_id),
}))

export const prodigy_entregas = pgTable('prodigy_entregas', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  curso_id: uuid('curso_id').notNull().references(() => prodigy_cursos.id, { onDelete: 'cascade' }),
  cronos_evento_id: uuid('cronos_evento_id').references(() => cronos_eventos.id, { onDelete: 'set null' }),
  titulo: varchar('titulo', { length: 500 }).notNull(),
  descripcion: text('descripcion'),
  fecha_limite: date('fecha_limite'),
  completado: boolean('completado').default(false).notNull(),
  completado_at: timestamp('completado_at', { withTimezone: true }),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_prodigy_entregas_curso_id': index('idx_prodigy_entregas_curso_id').on(t.curso_id),
  'idx_prodigy_entregas_cronos_id': index('idx_prodigy_entregas_cronos_id').on(t.cronos_evento_id),
}))
