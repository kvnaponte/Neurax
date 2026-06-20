import { pgTable, uuid, varchar, text, decimal, boolean, date, timestamp } from 'drizzle-orm/pg-core'

export const kuberaProductos = pgTable('kubera_productos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  categoria: varchar('categoria', { length: 50 }),
  precioEstimado: decimal('precio_estimado', { precision: 15, scale: 2 }),
  precioReal: decimal('precio_real', { precision: 15, scale: 2 }),
  enlace: text('enlace'),
  estado: varchar('estado', { length: 30 }).default('deseado').notNull(),
  fechaMeta: date('fecha_meta'),
  fechaAdquisicion: date('fecha_adquisicion'),
  fotoUrl: text('foto_url'),
  notas: text('notas'),
  demeterFondoActivo: boolean('demeter_fondo_activo').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
