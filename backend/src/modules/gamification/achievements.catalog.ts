export const ACHIEVEMENTS_CATALOG = [
  { id: 'first_step',       nombre: 'Primer Paso',            xp: 25,  total: 1,   criterio_tipo: 'actividades_total',    descripcion: 'Registra tu primera actividad' },
  { id: 'consistent_3',     nombre: 'Constante',              xp: 50,  total: 3,   criterio_tipo: 'racha_minima',         descripcion: 'Mantén una racha de 3 días' },
  { id: 'consistent_7',     nombre: 'Semana Perfecta',        xp: 100, total: 7,   criterio_tipo: 'racha_minima',         descripcion: 'Mantén una racha de 7 días' },
  { id: 'consistent_30',    nombre: 'Mes de Hierro',          xp: 350, total: 30,  criterio_tipo: 'racha_minima',         descripcion: 'Mantén una racha de 30 días' },
  { id: 'consistent_60',    nombre: 'Dos Meses sin Excusas',  xp: 500, total: 60,  criterio_tipo: 'racha_minima',         descripcion: 'Mantén una racha de 60 días' },
  { id: 'early_bird',       nombre: 'Madrugador',             xp: 50,  total: 1,   criterio_tipo: 'hora_temprana',        descripcion: 'Registra una actividad antes de las 7AM' },
  { id: 'night_owl',        nombre: 'Búho Nocturno',          xp: 30,  total: 1,   criterio_tipo: 'hora_nocturna',        descripcion: 'Registra una actividad después de las 11PM' },
  { id: 'gym_warrior',      nombre: 'Guerrero del Gym',       xp: 75,  total: 7,   criterio_tipo: 'sesiones_fisicas',     descripcion: '7 sesiones físicas completadas' },
  { id: 'study_10h',        nombre: '10 Horas de Estudio',    xp: 75,  total: 600, criterio_tipo: 'horas_estudio',        descripcion: '600 minutos de estudio acumulados' },
  { id: 'sleep_5',          nombre: 'Descansado',             xp: 60,  total: 5,   criterio_tipo: 'dias_sueno',           descripcion: '5 noches con al menos 7 horas de sueño' },
  { id: 'marathon',         nombre: 'Maratonista',            xp: 100, total: 50,  criterio_tipo: 'actividades_total',    descripcion: '50 actividades registradas' },
  { id: 'level_3',          nombre: 'Ascendido',              xp: 150, total: 3,   criterio_tipo: 'nivel_minimo',         descripcion: 'Alcanza el nivel 3' },
  { id: 'level_6',          nombre: 'Imbatible',              xp: 500, total: 6,   criterio_tipo: 'nivel_minimo',         descripcion: 'Alcanza el nivel máximo (6)' },
  { id: 'all_types',        nombre: 'Polímata',               xp: 200, total: 1,   criterio_tipo: 'actividades_tipo',     descripcion: 'Registra al menos 1 actividad de cada tipo principal' },
  { id: 'perfect_day',      nombre: 'Día Perfecto',           xp: 150, total: 1,   criterio_tipo: 'cronos_100',           descripcion: 'Completa el 100% de tu agenda Cronos en un día' },
  { id: 'leonidas_month',   nombre: 'Mes Leonidas',           xp: 200, total: 20,  criterio_tipo: 'sesiones_fisicas_mes', descripcion: '20 sesiones físicas en un mes' },
  { id: 'financial_streak', nombre: 'Control Financiero',     xp: 150, total: 30,  criterio_tipo: 'registros_demeter',    descripcion: '30 registros en Demeter' },
] as const

export type AchievementId = typeof ACHIEVEMENTS_CATALOG[number]['id']

/** Tipos de actividad requeridos para el logro all_types */
export const TIPOS_REQUERIDOS = ['ejercicios', 'estudio', 'sueno', 'meditacion', 'sol_matutino'] as const

export function getCatalogEntry(id: string) {
  return ACHIEVEMENTS_CATALOG.find((a) => a.id === id)
}
