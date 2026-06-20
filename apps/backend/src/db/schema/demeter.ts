import { pgTable, uuid, integer, decimal, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const demeterPresupuestos = pgTable('demeter_presupuestos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  anio: integer('anio').notNull(),
  mes: integer('mes').notNull(),
  ingresoEsperado: decimal('ingreso_esperado', { precision: 15, scale: 2 }),
  gastosFijos: decimal('gastos_fijos', { precision: 15, scale: 2 }),
  disponible: decimal('disponible', { precision: 15, scale: 2 }),
  categorias: jsonb('categorias'),
  fondosEspeciales: jsonb('fondos_especiales'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const demeterMovimientos = pgTable('demeter_movimientos', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  monto: decimal('monto', { precision: 15, scale: 2 }).notNull(),
  moneda: varchar('moneda', { length: 10 }).default('COP'),
  categoria: varchar('categoria', { length: 100 }),
  descripcion: varchar('descripcion', { length: 500 }),
  fechaMovimiento: varchar('fecha_movimiento', { length: 10 }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
