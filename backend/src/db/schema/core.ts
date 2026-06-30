import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashed_password: text('hashed_password').notNull(),
  secret_answer_hash: text('secret_answer_hash'),
  secret_activated: boolean('secret_activated').default(false).notNull(),
  recovery_answer_1_hash: text('recovery_answer_1_hash'),
  recovery_answer_2_hash: text('recovery_answer_2_hash'),
  xp_total: integer('xp_total').default(0).notNull(),
  nivel: integer('nivel').default(1).notNull(),
  avatar_url: text('avatar_url'),
  active: boolean('active').default(true).notNull(),
  last_login_at: timestamp('last_login_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
})

export const refresh_tokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  token_hash: text('token_hash').notNull(),
  device_info: jsonb('device_info'),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revoked_at: timestamp('revoked_at', { withTimezone: true }),
}, (t) => ({
  'idx_refresh_tokens_usuario_id': index('idx_refresh_tokens_usuario_id').on(t.usuario_id),
}))
