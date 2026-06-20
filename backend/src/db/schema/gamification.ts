import { pgTable, uuid, varchar, integer, timestamp, boolean, date, decimal, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const xp_events = pgTable('xp_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  fuente: varchar('fuente', { length: 100 }).notNull(),
  fuente_id: uuid('fuente_id'),
  xp_amount: integer('xp_amount').notNull(),
  xp_base: integer('xp_base').notNull(),
  bonus_racha: decimal('bonus_racha', { precision: 3, scale: 2 }).default('1.00').notNull(),
  bonus_horario: decimal('bonus_horario', { precision: 3, scale: 2 }).default('1.00').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_xp_events_usuario': index('idx_xp_events_usuario').on(t.usuario_id, t.created_at),
}))

export const usuario_achievements = pgTable('usuario_achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  achievement_id: varchar('achievement_id', { length: 100 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(), // sistema/manual/ia
  progreso: integer('progreso').default(0).notNull(),
  total: integer('total').notNull(),
  desbloqueado: boolean('desbloqueado').default(false).notNull(),
  desbloqueado_at: timestamp('desbloqueado_at', { withTimezone: true }),
  xp_otorgado: integer('xp_otorgado').default(0).notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  descripcion: varchar('descripcion', { length: 500 }),
  icono: varchar('icono', { length: 255 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_usuario_achievements_usuario_id': index('idx_usuario_achievements_usuario_id').on(t.usuario_id),
}))

export const rachas = pgTable('rachas', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  fecha: date('fecha').notNull(),
  tiene_actividad: boolean('tiene_actividad').default(false).notNull(),
}, (t) => ({
  'idx_rachas_usuario_fecha': uniqueIndex('idx_rachas_usuario_fecha').on(t.usuario_id, t.fecha),
}))
