import { pgTable, uuid, varchar, integer, timestamp, boolean, decimal, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { usuarios } from './core'

export const cronos_eventos = pgTable('cronos_eventos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  area: varchar('area', { length: 100 }),
  inicio_at: timestamp('inicio_at', { withTimezone: true }).notNull(),
  fin_at: timestamp('fin_at', { withTimezone: true }).notNull(),
  duracion_minutos: integer('duracion_minutos').generatedAlwaysAs(
    sql`EXTRACT(EPOCH FROM (fin_at - inicio_at)) / 60`
  ).notNull(),
  prioridad: integer('prioridad').default(2).notNull(),
  energia_consumida: decimal('energia_consumida', { precision: 5, scale: 2 }),
  completado: boolean('completado').default(false).notNull(),
  completado_at: timestamp('completado_at', { withTimezone: true }),
  xp_penalizacion_impuntualidad: boolean('xp_penalizacion_impuntualidad').default(false).notNull(),
  seccion_origen: varchar('seccion_origen', { length: 100 }),
  seccion_ref_id: uuid('seccion_ref_id'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_cronos_eventos_usuario_fecha': index('idx_cronos_eventos_usuario_fecha').on(t.usuario_id, t.inicio_at),
}))

export const cronos_api_keys = pgTable('cronos_api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  key_hash: varchar('key_hash', { length: 255 }).notNull().unique(),
  permisos: jsonb('permisos'),
  activa: boolean('activa').default(true).notNull(),
  last_used_at: timestamp('last_used_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_cronos_api_keys_usuario_id': index('idx_cronos_api_keys_usuario_id').on(t.usuario_id),
  'idx_cronos_api_keys_key_hash': uniqueIndex('idx_cronos_api_keys_key_hash').on(t.key_hash),
}))
