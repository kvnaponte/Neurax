import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const auth_logs = pgTable('auth_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  event_type: varchar('event_type', { length: 100 }).notNull(),
  result: varchar('result', { length: 20 }).notNull(), // success | failure | blocked
  ip: varchar('ip', { length: 45 }),
  user_agent: text('user_agent'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_auth_logs_usuario_id': index('idx_auth_logs_usuario_id').on(t.usuario_id),
  'idx_auth_logs_created_at': index('idx_auth_logs_created_at').on(t.created_at),
}))
