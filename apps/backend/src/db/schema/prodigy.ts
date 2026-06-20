import { pgTable, uuid, varchar, integer, decimal, boolean, timestamp } from 'drizzle-orm/pg-core'

export const prodigyCursos = pgTable('prodigy_cursos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  categoria: varchar('categoria', { length: 50 }),
  plataforma: varchar('plataforma', { length: 100 }),
  estado: varchar('estado', { length: 20 }).default('por_empezar').notNull(),
  porcentajeCompletado: integer('porcentaje_completado').default(0),
  fechaInicio: timestamp('fecha_inicio', { withTimezone: true }),
  fechaLimite: timestamp('fecha_limite', { withTimezone: true }),
  horasTotales: decimal('horas_totales', { precision: 6, scale: 1 }),
  otorgaCertificado: boolean('otorga_certificado').default(false),
  calificacion: integer('calificacion'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const prodigyEntregas = pgTable('prodigy_entregas', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  cursoId: uuid('curso_id').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  fechaEntrega: timestamp('fecha_entrega', { withTimezone: true }).notNull(),
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(),
  prioridad: integer('prioridad').default(2),
  cronosEventoId: uuid('cronos_evento_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
