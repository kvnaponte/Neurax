import { pgTable, uuid, varchar, boolean, integer, timestamp, decimal, jsonb, date, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { text } from 'drizzle-orm/pg-core'
import { usuarios } from './core'

export const demeter_movimientos = pgTable('demeter_movimientos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 30 }).notNull(), // ingreso/egreso/inversion/transferencia
  monto: decimal('monto', { precision: 15, scale: 2 }).notNull(),
  moneda: varchar('moneda', { length: 10 }).default('COP').notNull(),
  categoria: varchar('categoria', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  metodo_pago: varchar('metodo_pago', { length: 100 }),
  es_recurrente: boolean('es_recurrente').default(false).notNull(),
  frecuencia_recurrente: varchar('frecuencia_recurrente', { length: 50 }),
  fecha_movimiento: date('fecha_movimiento').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_demeter_movimientos_usuario_id': index('idx_demeter_movimientos_usuario_id').on(t.usuario_id),
}))

export const demeter_presupuestos = pgTable('demeter_presupuestos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  año: integer('año').notNull(),
  mes: integer('mes').notNull(), // 1-12
  ingreso_esperado: decimal('ingreso_esperado', { precision: 15, scale: 2 }).notNull(),
  gastos_fijos: decimal('gastos_fijos', { precision: 15, scale: 2 }).notNull(),
  disponible: decimal('disponible', { precision: 15, scale: 2 }).notNull(),
  categorias: jsonb('categorias'),
  fondos_especiales: jsonb('fondos_especiales'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_demeter_presupuestos_usuario_año_mes': uniqueIndex('idx_demeter_presupuestos_usuario_año_mes').on(t.usuario_id, t.año, t.mes),
}))
