import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, time, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const notificaciones = pgTable('notificaciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  mensaje: varchar('mensaje', { length: 1000 }).notNull(),
  leida: boolean('leida').default(false).notNull(),
  data: jsonb('data'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_notificaciones_usuario_id': index('idx_notificaciones_usuario_id').on(t.usuario_id),
}))

export const notificaciones_config = pgTable('notificaciones_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }).unique(),
  hora_recordatorio: time('hora_recordatorio'),
  push_token: text('push_token'),
  push_type: varchar('push_type', { length: 20 }), // expo/web
  no_molestar_inicio: time('no_molestar_inicio'),
  no_molestar_fin: time('no_molestar_fin'),
  toggles: jsonb('toggles'),
}, (t) => ({
  'idx_notificaciones_config_usuario_id': uniqueIndex('idx_notificaciones_config_usuario_id').on(t.usuario_id),
}))

export const ia_config = pgTable('ia_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }).unique(),
  clasificacion_dionisio: boolean('clasificacion_dionisio').default(true).notNull(),
  sugerencias_logros: boolean('sugerencias_logros').default(true).notNull(),
  sugerencias_misiones: boolean('sugerencias_misiones').default(true).notNull(),
}, (t) => ({
  'idx_ia_config_usuario_id': uniqueIndex('idx_ia_config_usuario_id').on(t.usuario_id),
}))
