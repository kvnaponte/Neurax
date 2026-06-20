import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'

export const iaConfig = pgTable('ia_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().unique(),
  clasificacionDionisio: boolean('clasificacion_dionisio').default(true).notNull(),
  sugerenciasLogros: boolean('sugerencias_logros').default(true).notNull(),
  sugerenciasMisiones: boolean('sugerencias_misiones').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
