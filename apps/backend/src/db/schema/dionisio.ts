import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const dionisioVideos = pgTable('dionisio_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  url: text('url').notNull(),
  titulo: varchar('titulo', { length: 500 }),
  thumbnailUrl: text('thumbnail_url'),
  fuente: varchar('fuente', { length: 50 }),
  categoria: varchar('categoria', { length: 50 }),
  subcategoria: varchar('subcategoria', { length: 100 }),
  destinoSugerido: varchar('destino_sugerido', { length: 50 }),
  estado: varchar('estado', { length: 30 }).default('guardado').notNull(),
  pipelineEstado: varchar('pipeline_estado', { length: 30 }).default('manual').notNull(),
  pipelineError: text('pipeline_error'),
  seccionDestino: varchar('seccion_destino', { length: 50 }),
  seccionRefId: uuid('seccion_ref_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
