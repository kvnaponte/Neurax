import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const dionisio_videos = pgTable('dionisio_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  titulo: varchar('titulo', { length: 500 }),
  thumbnail_url: text('thumbnail_url'),
  fuente: varchar('fuente', { length: 100 }),
  categoria: varchar('categoria', { length: 100 }),
  subcategoria: varchar('subcategoria', { length: 100 }),
  nota: text('nota'),
  estado: varchar('estado', { length: 30 }).default('guardado').notNull(), // guardado/procesando/accionado/archivado/descartado
  transcripcion: text('transcripcion'),
  pipeline_estado: varchar('pipeline_estado', { length: 50 }),
  pipeline_error: text('pipeline_error'),
  seccion_destino: varchar('seccion_destino', { length: 100 }),
  seccion_ref_id: uuid('seccion_ref_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_dionisio_videos_usuario_id': index('idx_dionisio_videos_usuario_id').on(t.usuario_id),
}))
