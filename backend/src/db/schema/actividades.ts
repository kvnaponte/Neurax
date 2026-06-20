import { pgTable, uuid, varchar, integer, timestamp, boolean, decimal, jsonb, text, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const actividades = pgTable('actividades', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  area: varchar('area', { length: 100 }).notNull(),
  duracion_minutos: integer('duracion_minutos').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  xp_base: integer('xp_base').notNull(),
  xp_generado: integer('xp_generado').notNull(),
  bonus_racha: decimal('bonus_racha', { precision: 3, scale: 2 }).default('1.00').notNull(),
  bonus_horario: decimal('bonus_horario', { precision: 3, scale: 2 }).default('1.00').notNull(),
  limite_excedido: boolean('limite_excedido').default(false).notNull(),
  metadata: jsonb('metadata'),
  descripcion: text('descripcion'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_actividades_usuario_timestamp': index('idx_actividades_usuario_timestamp').on(t.usuario_id, t.timestamp),
}))
