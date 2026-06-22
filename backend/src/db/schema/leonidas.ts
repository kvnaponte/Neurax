import { pgTable, pgView, uuid, varchar, text, integer, smallint, boolean, timestamp, decimal, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { usuarios } from './core'
import { actividades } from './actividades'

export const leonidas_ejercicios_catalogo = pgTable('leonidas_ejercicios_catalogo', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  grupo_muscular: varchar('grupo_muscular', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Ejercicios/rutinas guardados por el usuario desde Dionisio (videos accionados)
export const leonidas_referencias = pgTable('leonidas_referencias', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 500 }).notNull(),
  url_referencia: text('url_referencia'),
  thumbnail_url: text('thumbnail_url'),
  grupo_muscular: varchar('grupo_muscular', { length: 100 }), // desconocido desde un video
  estado: varchar('estado', { length: 20 }).default('pendiente').notNull(), // pendiente/probado/descartado
  fuente: varchar('fuente', { length: 50 }).default('manual').notNull(), // manual/dionisio
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  'idx_leonidas_referencias_usuario_id': index('idx_leonidas_referencias_usuario_id').on(t.usuario_id),
}))

export const leonidas_plan_semanal = pgTable('leonidas_plan_semanal', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  dia_semana: smallint('dia_semana').notNull(), // 0-6
  tipo: varchar('tipo', { length: 100 }).notNull(),
  grupos_planeados: text('grupos_planeados').array().notNull(),
  activo: boolean('activo').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_leonidas_plan_semanal_usuario_dia': uniqueIndex('idx_leonidas_plan_semanal_usuario_dia').on(t.usuario_id, t.dia_semana),
}))

export const leonidas_sesiones = pgTable('leonidas_sesiones', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  actividad_id: uuid('actividad_id').notNull().references(() => actividades.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  grupos_trabajados: text('grupos_trabajados').array().notNull(),
  duracion_minutos: integer('duracion_minutos').notNull(),
  intensidad: smallint('intensidad').notNull(), // 1-5
  notas: text('notas'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_leonidas_sesiones_usuario': index('idx_leonidas_sesiones_usuario').on(t.usuario_id, t.timestamp),
  'idx_leonidas_sesiones_actividad_id': index('idx_leonidas_sesiones_actividad_id').on(t.actividad_id),
}))

export const leonidas_ejercicios_sesion = pgTable('leonidas_ejercicios_sesion', {
  id: uuid('id').defaultRandom().primaryKey(),
  sesion_id: uuid('sesion_id').notNull().references(() => leonidas_sesiones.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  grupo_muscular: varchar('grupo_muscular', { length: 100 }).notNull(),
  series: integer('series').notNull(),
  repeticiones: integer('repeticiones').notNull(),
  peso_kg: decimal('peso_kg', { precision: 6, scale: 2 }),
  notas: text('notas'),
  orden: smallint('orden').default(0).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  'idx_leonidas_ejercicios_sesion_id': index('idx_leonidas_ejercicios_sesion_id').on(t.sesion_id),
}))

export const leonidas_disponibilidad_muscular = pgView('leonidas_disponibilidad_muscular', {
  usuario_id: uuid('usuario_id').notNull(),
  dia_semana: smallint('dia_semana').notNull(),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  grupos_planeados: text('grupos_planeados').array().notNull(),
  disponible: boolean('disponible').notNull(),
}).as(sql`
  SELECT
    lps.usuario_id,
    lps.dia_semana,
    lps.tipo,
    lps.grupos_planeados,
    CASE
      WHEN MAX(ls.timestamp) > NOW() - INTERVAL '48 hours' THEN false
      ELSE true
    END AS disponible
  FROM leonidas_plan_semanal lps
  LEFT JOIN leonidas_sesiones ls
    ON ls.usuario_id = lps.usuario_id
    AND ls.grupos_trabajados && lps.grupos_planeados
  WHERE lps.activo = true
  GROUP BY lps.usuario_id, lps.dia_semana, lps.tipo, lps.grupos_planeados
`)
