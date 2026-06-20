import { count, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { odin_misiones_catalogo } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

interface CatalogEntry {
  nombre: string
  descripcion?: string
  tipo: string
  objetivo_tipo: string
  objetivo_valor: number
  objetivo_filtro?: Record<string, unknown>
  xp_reward: number
}

export const CATALOG: CatalogEntry[] = [
  // Misiones principales
  { nombre: 'consistency_5', tipo: 'principal', descripcion: 'Registra 5 actividades hoy',
    objetivo_tipo: 'actividades_count', objetivo_valor: 5, xp_reward: 200, objetivo_filtro: {} },
  { nombre: 'full_day', tipo: 'principal', descripcion: 'Registra actividades en 3 áreas diferentes',
    objetivo_tipo: 'areas_count', objetivo_valor: 3, xp_reward: 250 },
  { nombre: 'early_warrior', tipo: 'principal', descripcion: 'Registra una actividad antes de las 8:00 AM',
    objetivo_tipo: 'actividades_count', objetivo_valor: 1, xp_reward: 150, objetivo_filtro: { before_hour: 8 } },
  { nombre: 'study_focus', tipo: 'principal', descripcion: 'Estudia 2 horas hoy',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 120, xp_reward: 200, objetivo_filtro: { tipo: 'estudio' } },
  { nombre: 'body_mind', tipo: 'principal', descripcion: 'Ejercicio + Meditación o Sol matutino en el mismo día',
    objetivo_tipo: 'actividades_count', objetivo_valor: 2, xp_reward: 250,
    objetivo_filtro: { tipos: ['ejercicio_fuerza','ejercicio_cardio','barras','trote','meditacion','sol_matutino'] } },
  { nombre: 'financial_check', tipo: 'principal', descripcion: 'Registra en Demeter',
    objetivo_tipo: 'actividades_count', objetivo_valor: 1, xp_reward: 150, objetivo_filtro: { area: 'economicas' } },
  { nombre: 'productivity_max', tipo: 'principal', descripcion: 'Trabajo + Estudio sumando 4 horas',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 240, xp_reward: 250, objetivo_filtro: { tipos: ['trabajo','estudio'] } },
  { nombre: 'recovery_day', tipo: 'principal', descripcion: 'Sueño 7h+',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 420, xp_reward: 175, objetivo_filtro: { tipo: 'sueno' } },
  { nombre: 'leonidas_day', tipo: 'principal', descripcion: '2 sesiones de ejercicio en el día',
    objetivo_tipo: 'actividades_count', objetivo_valor: 2, xp_reward: 200, objetivo_filtro: { area: 'fisicas' } },
  { nombre: 'perfect_sleep', tipo: 'principal', descripcion: 'Duerme entre 7 y 9 horas',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 420, xp_reward: 150, objetivo_filtro: { tipo: 'sueno', max_min: 540 } },
  // Misiones secundarias
  { nombre: 'exercise_30', tipo: 'secundaria', descripcion: '1 sesión física ≥ 30 min',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 30, xp_reward: 100, objetivo_filtro: { area: 'fisicas' } },
  { nombre: 'study_new', tipo: 'secundaria', descripcion: '1 sesión de estudio ≥ 30 min',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 30, xp_reward: 40, objetivo_filtro: { tipo: 'estudio' } },
  { nombre: 'sleep_good', tipo: 'secundaria', descripcion: 'Registro de sueño ≥ 7h',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 420, xp_reward: 40, objetivo_filtro: { tipo: 'sueno' } },
  { nombre: 'finance_log', tipo: 'secundaria', descripcion: '1 registro en Demeter',
    objetivo_tipo: 'actividades_count', objetivo_valor: 1, xp_reward: 40, objetivo_filtro: { area: 'economicas' } },
  { nombre: 'music_session', tipo: 'secundaria', descripcion: '1 registro de música',
    objetivo_tipo: 'actividades_count', objetivo_valor: 1, xp_reward: 40,
    objetivo_filtro: { tipos: ['musica_escucha','musica_produccion'] } },
  { nombre: 'transport_log', tipo: 'secundaria', descripcion: '1 registro de transporte',
    objetivo_tipo: 'actividades_count', objetivo_valor: 1, xp_reward: 30, objetivo_filtro: { tipo: 'transporte' } },
  { nombre: 'morning_sun', tipo: 'secundaria', descripcion: 'Sol antes de 9:00 AM',
    objetivo_tipo: 'actividades_count', objetivo_valor: 1, xp_reward: 50,
    objetivo_filtro: { tipo: 'sol_matutino', before_hour: 9 } },
  { nombre: 'meditation', tipo: 'secundaria', descripcion: '1 sesión de meditación ≥ 10 min',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 10, xp_reward: 60, objetivo_filtro: { tipo: 'meditacion' } },
  { nombre: 'work_productive', tipo: 'secundaria', descripcion: '1 registro de trabajo ≥ 1h',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 60, xp_reward: 40, objetivo_filtro: { tipo: 'trabajo' } },
  { nombre: 'leonidas_set', tipo: 'secundaria', descripcion: '1 sesión Leonidas ≥ 45 min',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 45, xp_reward: 100, objetivo_filtro: { area: 'fisicas' } },
  { nombre: 'reading', tipo: 'secundaria', descripcion: 'Sesión de estudio/lectura',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 30, xp_reward: 50, objetivo_filtro: { tipo: 'estudio' } },
  { nombre: 'complete_cronnos', tipo: 'secundaria', descripcion: 'Completa 3 tareas de Cronnos puntualmente',
    objetivo_tipo: 'cronos_puntual', objetivo_valor: 3, xp_reward: 80 },
  // Super semanales
  { nombre: 'weekly_streak', tipo: 'super_semanal', descripcion: '7 días con actividad esta semana',
    objetivo_tipo: 'dias_activos', objetivo_valor: 7, xp_reward: 500 },
  { nombre: 'weekly_study_10h', tipo: 'super_semanal', descripcion: 'Estudia 10 horas durante la semana',
    objetivo_tipo: 'minutos_tipo', objetivo_valor: 600, xp_reward: 400, objetivo_filtro: { tipo: 'estudio' } },
  { nombre: 'weekly_exercise_5', tipo: 'super_semanal', descripcion: '5 sesiones de ejercicio en la semana',
    objetivo_tipo: 'actividades_count', objetivo_valor: 5, xp_reward: 450, objetivo_filtro: { area: 'fisicas' } },
  { nombre: 'weekly_full_odin', tipo: 'super_semanal', descripcion: 'Completa todas las misiones diarias 5 días',
    objetivo_tipo: 'dias_odin_completo', objetivo_valor: 5, xp_reward: 600 },
  { nombre: 'weekly_finance', tipo: 'super_semanal', descripcion: 'Registra en Demeter todos los días',
    objetivo_tipo: 'dias_activos_area', objetivo_valor: 7, xp_reward: 400, objetivo_filtro: { area: 'economicas' } },
  // Super mensuales
  { nombre: 'monthly_30_active', tipo: 'super_mensual', descripcion: '30 días con actividad este mes',
    objetivo_tipo: 'dias_activos', objetivo_valor: 30, xp_reward: 1000 },
  { nombre: 'monthly_xp_2000', tipo: 'super_mensual', descripcion: 'Gana 2000 XP en el mes',
    objetivo_tipo: 'xp_acumulado', objetivo_valor: 2000, xp_reward: 700 },
  { nombre: 'monthly_streak', tipo: 'super_mensual', descripcion: 'Mantén racha 30 días',
    objetivo_tipo: 'racha_dias', objetivo_valor: 30, xp_reward: 900 },
  { nombre: 'monthly_5_sections', tipo: 'super_mensual', descripcion: 'Usa 5 secciones diferentes este mes',
    objetivo_tipo: 'secciones_distintas', objetivo_valor: 5, xp_reward: 700 },
]

let _catalogMap: Map<string, string> | null = null

export async function getCatalogMap(db: DB): Promise<Map<string, string>> {
  if (_catalogMap && _catalogMap.size > 0) return _catalogMap

  const [{ c }] = await db.select({ c: count() }).from(odin_misiones_catalogo)

  if (Number(c) === 0) {
    const inserted = await db.insert(odin_misiones_catalogo).values(
      CATALOG.map(entry => ({
        nombre: entry.nombre,
        descripcion: entry.descripcion,
        tipo: entry.tipo,
        objetivo_tipo: entry.objetivo_tipo,
        objetivo_valor: entry.objetivo_valor,
        objetivo_filtro: entry.objetivo_filtro ?? null,
        xp_reward: entry.xp_reward,
        activa: true,
      }))
    ).returning({ id: odin_misiones_catalogo.id, nombre: odin_misiones_catalogo.nombre })

    _catalogMap = new Map(inserted.map(r => [r.nombre, r.id]))
  } else {
    const existing = await db.select({ id: odin_misiones_catalogo.id, nombre: odin_misiones_catalogo.nombre })
      .from(odin_misiones_catalogo)
    _catalogMap = new Map(existing.map(r => [r.nombre, r.id]))
  }

  return _catalogMap
}

export function resetCatalogCache() {
  _catalogMap = null
}
