import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, date, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const odin_misiones_catalogo = pgTable('odin_misiones_catalogo', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  descripcion: varchar('descripcion', { length: 1000 }),
  tipo: varchar('tipo', { length: 50 }).notNull(), // principal/secundaria/super_semanal/super_mensual
  objetivo_tipo: varchar('objetivo_tipo', { length: 100 }).notNull(),
  objetivo_valor: integer('objetivo_valor').notNull(),
  objetivo_filtro: jsonb('objetivo_filtro'),
  xp_reward: integer('xp_reward').notNull(),
  activa: boolean('activa').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const odin_misiones_usuario = pgTable('odin_misiones_usuario', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  catalogo_id: uuid('catalogo_id').notNull().references(() => odin_misiones_catalogo.id, { onDelete: 'cascade' }),
  periodo_tipo: varchar('periodo_tipo', { length: 50 }).notNull(),
  periodo_inicio: date('periodo_inicio').notNull(),
  periodo_fin: date('periodo_fin').notNull(),
  progreso: integer('progreso').default(0).notNull(),
  total: integer('total').notNull(),
  estado: varchar('estado', { length: 20 }).default('activa').notNull(), // activa/completada/expirada
  completada_at: timestamp('completada_at', { withTimezone: true }),
  xp_otorgado: integer('xp_otorgado').default(0).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_odin_misiones_usuario_activas': index('idx_odin_misiones_usuario_activas').on(t.usuario_id, t.estado, t.periodo_fin),
  'idx_odin_misiones_usuario_catalogo_id': index('idx_odin_misiones_usuario_catalogo_id').on(t.catalogo_id),
}))

export const odin_cofres = pgTable('odin_cofres', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 20 }).notNull(), // bronce/plata/dorado/epico
  semana_numero: integer('semana_numero').notNull(),
  xp_otorgado: integer('xp_otorgado').notNull(),
  abierto_at: timestamp('abierto_at', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_odin_cofres_usuario_id': index('idx_odin_cofres_usuario_id').on(t.usuario_id),
}))
