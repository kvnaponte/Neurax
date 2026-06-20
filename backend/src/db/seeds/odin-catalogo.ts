import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { odin_misiones_catalogo } from '../schema'
import type * as schema from '../schema'

type DB = PostgresJsDatabase<typeof schema>

const misiones = [
  // 10 Principales (1/día)
  { id: '11111111-0001-0001-0001-000000000001', nombre: 'Día Activo', descripcion: 'Completa 5 actividades registradas', tipo: 'principal', objetivo_tipo: 'actividades_count', objetivo_valor: 5, objetivo_filtro: null, xp_reward: 200, activa: true },
  { id: '11111111-0001-0001-0001-000000000002', nombre: 'Sesión Física', descripcion: 'Ejercicio mínimo 30 minutos', tipo: 'principal', objetivo_tipo: 'actividad_duracion', objetivo_valor: 30, objetivo_filtro: { area: 'leonidas' }, xp_reward: 150, activa: true },
  { id: '11111111-0001-0001-0001-000000000003', nombre: 'Mente Afilada', descripcion: 'Estudio mínimo 50 minutos', tipo: 'principal', objetivo_tipo: 'actividad_duracion', objetivo_valor: 50, objetivo_filtro: { area: 'prodigy' }, xp_reward: 180, activa: true },
  { id: '11111111-0001-0001-0001-000000000004', nombre: 'Descanso Óptimo', descripcion: 'Registra sueño de al menos 7 horas', tipo: 'principal', objetivo_tipo: 'actividad_duracion', objetivo_valor: 420, objetivo_filtro: { tipo: 'sueno' }, xp_reward: 130, activa: true },
  { id: '11111111-0001-0001-0001-000000000005', nombre: 'Mente Clara', descripcion: 'Sesión de meditación', tipo: 'principal', objetivo_tipo: 'actividad_count', objetivo_valor: 1, objetivo_filtro: { tipo: 'meditacion' }, xp_reward: 120, activa: true },
  { id: '11111111-0001-0001-0001-000000000006', nombre: 'Control Financiero', descripcion: 'Registra un movimiento en Demeter', tipo: 'principal', objetivo_tipo: 'demeter_movimiento', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 140, activa: true },
  { id: '11111111-0001-0001-0001-000000000007', nombre: 'Producción Musical', descripcion: 'Sesión musical mínimo 30 minutos', tipo: 'principal', objetivo_tipo: 'actividad_duracion', objetivo_valor: 30, objetivo_filtro: { area: 'proeza' }, xp_reward: 160, activa: true },
  { id: '11111111-0001-0001-0001-000000000008', nombre: 'Sol Matutino', descripcion: 'Registra exposición solar matutina', tipo: 'principal', objetivo_tipo: 'actividad_count', objetivo_valor: 1, objetivo_filtro: { tipo: 'sol' }, xp_reward: 110, activa: true },
  { id: '11111111-0001-0001-0001-000000000009', nombre: 'Guerrero Leonidas', descripcion: 'Sesión de entrenamiento registrada', tipo: 'principal', objetivo_tipo: 'leonidas_sesion', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 170, activa: true },
  { id: '11111111-0001-0001-0001-000000000010', nombre: 'Día Organizado', descripcion: 'Crea 3 eventos en Cronos', tipo: 'principal', objetivo_tipo: 'cronos_eventos_count', objetivo_valor: 3, objetivo_filtro: null, xp_reward: 150, activa: true },

  // 12 Secundarias (3-4/día)
  { id: '22222222-0002-0002-0002-000000000001', nombre: 'Lector Activo', descripcion: 'Lee 20 minutos hoy', tipo: 'secundaria', objetivo_tipo: 'actividad_duracion', objetivo_valor: 20, objetivo_filtro: { area: 'alejandria' }, xp_reward: 60, activa: true },
  { id: '22222222-0002-0002-0002-000000000002', nombre: 'Cinéfilo', descripcion: 'Registra una película vista', tipo: 'secundaria', objetivo_tipo: 'apolo_pelicula', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 50, activa: true },
  { id: '22222222-0002-0002-0002-000000000003', nombre: 'Chef en Casa', descripcion: 'Registra una receta preparada', tipo: 'secundaria', objetivo_tipo: 'michelin_receta', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 70, activa: true },
  { id: '22222222-0002-0002-0002-000000000004', nombre: 'Hidratación', descripcion: 'Registra consumo de agua diario', tipo: 'secundaria', objetivo_tipo: 'actividad_count', objetivo_valor: 1, objetivo_filtro: { tipo: 'hidratacion' }, xp_reward: 40, activa: true },
  { id: '22222222-0002-0002-0002-000000000005', nombre: 'Gamer', descripcion: 'Sesión de juego registrada', tipo: 'secundaria', objetivo_tipo: 'actividad_count', objetivo_valor: 1, objetivo_filtro: { area: 'nemesis' }, xp_reward: 55, activa: true },
  { id: '22222222-0002-0002-0002-000000000006', nombre: 'Explorador Gastronómico', descripcion: 'Registra lugar visitado en Soberbio', tipo: 'secundaria', objetivo_tipo: 'soberbio_visita', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 80, activa: true },
  { id: '22222222-0002-0002-0002-000000000007', nombre: 'Viajero', descripcion: 'Registra destino en Odysseia', tipo: 'secundaria', objetivo_tipo: 'odysseia_destino', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 65, activa: true },
  { id: '22222222-0002-0002-0002-000000000008', nombre: 'Madrugador', descripcion: 'Registra actividad antes de las 8am', tipo: 'secundaria', objetivo_tipo: 'actividad_horario', objetivo_valor: 1, objetivo_filtro: { antes_de: '08:00' }, xp_reward: 90, activa: true },
  { id: '22222222-0002-0002-0002-000000000009', nombre: 'Nocturno Productivo', descripcion: 'Completa 2 actividades después de las 8pm', tipo: 'secundaria', objetivo_tipo: 'actividad_horario', objetivo_valor: 2, objetivo_filtro: { despues_de: '20:00' }, xp_reward: 75, activa: true },
  { id: '22222222-0002-0002-0002-000000000010', nombre: 'Seguridad Financiera', descripcion: 'Revisa tu presupuesto Demeter', tipo: 'secundaria', objetivo_tipo: 'demeter_revision', objetivo_valor: 1, objetivo_filtro: null, xp_reward: 60, activa: true },
  { id: '22222222-0002-0002-0002-000000000011', nombre: 'Corredor', descripcion: 'Sesión de cardio mínimo 20 minutos', tipo: 'secundaria', objetivo_tipo: 'actividad_duracion', objetivo_valor: 20, objetivo_filtro: { tipo: 'cardio' }, xp_reward: 85, activa: true },
  { id: '22222222-0002-0002-0002-000000000012', nombre: 'Flexibilidad', descripcion: 'Sesión de estiramiento o yoga', tipo: 'secundaria', objetivo_tipo: 'actividad_count', objetivo_valor: 1, objetivo_filtro: { tipo: 'flexibilidad' }, xp_reward: 55, activa: true },

  // 5 Super Semanales
  { id: '33333333-0003-0003-0003-000000000001', nombre: 'Racha Semanal', descripcion: '7 días consecutivos con actividad', tipo: 'super_semanal', objetivo_tipo: 'racha_dias', objetivo_valor: 7, objetivo_filtro: null, xp_reward: 500, activa: true },
  { id: '33333333-0003-0003-0003-000000000002', nombre: 'Semana Estudiosa', descripcion: 'Acumula 10 horas de estudio en la semana', tipo: 'super_semanal', objetivo_tipo: 'actividad_duracion_total', objetivo_valor: 600, objetivo_filtro: { area: 'prodigy' }, xp_reward: 400, activa: true },
  { id: '33333333-0003-0003-0003-000000000003', nombre: 'Atleta Semanal', descripcion: '5 sesiones de entrenamiento en la semana', tipo: 'super_semanal', objetivo_tipo: 'leonidas_sesion', objetivo_valor: 5, objetivo_filtro: null, xp_reward: 450, activa: true },
  { id: '33333333-0003-0003-0003-000000000004', nombre: 'Semana Perfecta', descripcion: 'Completa todas las misiones principales 5 días', tipo: 'super_semanal', objetivo_tipo: 'misiones_principales_dias', objetivo_valor: 5, objetivo_filtro: null, xp_reward: 600, activa: true },
  { id: '33333333-0003-0003-0003-000000000005', nombre: 'Finanzas Semanal', descripcion: 'Registra movimiento Demeter cada día de la semana', tipo: 'super_semanal', objetivo_tipo: 'demeter_movimiento_dias', objetivo_valor: 7, objetivo_filtro: null, xp_reward: 400, activa: true },

  // 4 Super Mensuales
  { id: '44444444-0004-0004-0004-000000000001', nombre: 'Mes Activo', descripcion: '30 días con al menos una actividad registrada', tipo: 'super_mensual', objetivo_tipo: 'actividad_dias', objetivo_valor: 30, objetivo_filtro: null, xp_reward: 1000, activa: true },
  { id: '44444444-0004-0004-0004-000000000002', nombre: 'Acumulador XP', descripcion: 'Acumula 2000 XP en el mes', tipo: 'super_mensual', objetivo_tipo: 'xp_total', objetivo_valor: 2000, objetivo_filtro: null, xp_reward: 700, activa: true },
  { id: '44444444-0004-0004-0004-000000000003', nombre: 'Racha Mensual', descripcion: 'Mantén una racha de 30 días', tipo: 'super_mensual', objetivo_tipo: 'racha_dias', objetivo_valor: 30, objetivo_filtro: null, xp_reward: 900, activa: true },
  { id: '44444444-0004-0004-0004-000000000004', nombre: 'Polímata', descripcion: 'Activa 5 secciones diferentes en el mes', tipo: 'super_mensual', objetivo_tipo: 'secciones_activas', objetivo_valor: 5, objetivo_filtro: null, xp_reward: 700, activa: true },
]

export async function seedOdinCatalogo(db: DB) {
  await db.insert(odin_misiones_catalogo).values(misiones).onConflictDoNothing()
  console.log(`  ✓ odin_misiones_catalogo: ${misiones.length} registros`)
}
