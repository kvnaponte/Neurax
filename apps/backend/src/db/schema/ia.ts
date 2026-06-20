import { pgTable, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const usuarioAchievements = pgTable('usuario_achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  achievementId: varchar('achievement_id', { length: 100 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  progreso: integer('progreso').default(0).notNull(),
  total: integer('total').notNull(),
  desbloqueado: boolean('desbloqueado').default(false).notNull(),
  desbloqueadoAt: timestamp('desbloqueado_at', { withTimezone: true }),
  xpOtorgado: integer('xp_otorgado').default(0).notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  descripcion: varchar('descripcion', { length: 500 }),
  icono: varchar('icono', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const iaConfig = pgTable('ia_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().unique(),
  clasificacionDionisio: boolean('clasificacion_dionisio').default(true).notNull(),
  sugerenciasLogros: boolean('sugerencias_logros').default(true).notNull(),
  sugerenciasMisiones: boolean('sugerencias_misiones').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
