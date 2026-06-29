/**
 * Mirror of the backend activity catalog and XP rules so the mobile preview
 * computes the exact same XP the server will award.
 * Source of truth: backend/src/modules/actividades/actividades.catalog.ts
 *                  shared/src/utils/xp.utils.ts
 */

export type AreaKey = 'rutinarias' | 'fisicas' | 'mentales' | 'economicas'

export type ActividadTipo =
  | 'sueno' | 'meditacion' | 'sol_matutino' | 'transporte' | 'musica_escucha'
  | 'ejercicio_fuerza' | 'ejercicio_cardio' | 'barras' | 'trote'
  | 'estudio' | 'trabajo' | 'musica_produccion'
  | 'ingreso' | 'egreso' | 'planificacion_financiera'

interface CatalogEntry {
  label: string
  area: AreaKey
  xpBase: (duracion: number) => number
  /** 1.2x when in the optimal window for this type, else 1.0 (uses UTC hours like the backend) */
  bonusHorario: (ts: Date) => number
  maxPorDia?: number
  /** extra fields the registration form must collect */
  campos?: ('grupo_muscular' | 'monto' | 'categoria')[]
}

function h(ts: Date) {
  return ts.getUTCHours()
}

export const ACTIVIDADES_CATALOG: Record<ActividadTipo, CatalogEntry> = {
  sueno:                    { label: 'Sueño',        area: 'rutinarias', xpBase: (d) => d >= 345 ? 20 : 10, bonusHorario: (ts) => (h(ts) >= 21 || h(ts) < 7) ? 1.2 : 1.0 },
  meditacion:               { label: 'Meditación',   area: 'rutinarias', xpBase: (d) => d >= 20 ? 20 : 10,  bonusHorario: (ts) => h(ts) < 9 ? 1.2 : 1.0 },
  sol_matutino:             { label: 'Sol matutino', area: 'rutinarias', xpBase: () => 15,                  bonusHorario: (ts) => h(ts) < 9 ? 1.2 : 1.0 },
  transporte:               { label: 'Transporte',   area: 'rutinarias', xpBase: () => 5,                   bonusHorario: () => 1.0 },
  musica_escucha:           { label: 'Música',       area: 'rutinarias', xpBase: () => 5,                   bonusHorario: () => 1.0, maxPorDia: 2 },
  ejercicio_fuerza:         { label: 'Fuerza',       area: 'fisicas',    xpBase: (d) => d >= 60 ? 15 : 5,   bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0, campos: ['grupo_muscular'] },
  ejercicio_cardio:         { label: 'Cardio',       area: 'fisicas',    xpBase: (d) => d >= 30 ? 15 : 5,   bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0 },
  barras:                   { label: 'Barras',       area: 'fisicas',    xpBase: (d) => d >= 30 ? 20 : 10,  bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0, campos: ['grupo_muscular'] },
  trote:                    { label: 'Trote',        area: 'fisicas',    xpBase: (d) => d >= 30 ? 20 : 10,  bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0 },
  estudio:                  { label: 'Estudio',      area: 'mentales',   xpBase: (d) => d >= 50 ? 25 : 10,  bonusHorario: (ts) => (h(ts) >= 8 && h(ts) < 14) ? 1.2 : 1.0 },
  trabajo:                  { label: 'Trabajo',      area: 'mentales',   xpBase: () => 10,                  bonusHorario: () => 1.0 },
  musica_produccion:        { label: 'Producción',   area: 'mentales',   xpBase: () => 20,                  bonusHorario: () => 1.0 },
  ingreso:                  { label: 'Ingreso',      area: 'economicas', xpBase: () => 10,                  bonusHorario: () => 1.0, campos: ['monto', 'categoria'] },
  egreso:                   { label: 'Egreso',       area: 'economicas', xpBase: () => 5,                   bonusHorario: () => 1.0, campos: ['monto', 'categoria'] },
  planificacion_financiera: { label: 'Planificación', area: 'economicas', xpBase: () => 15,                bonusHorario: () => 1.0 },
}

export const LIMITES_DIARIOS_XP: Record<AreaKey, number> = {
  rutinarias: 100,
  fisicas: 200,
  mentales: 200,
  economicas: 100,
}

export const TIPOS: ActividadTipo[] = Object.keys(ACTIVIDADES_CATALOG) as ActividadTipo[]

export const GRUPOS_MUSCULARES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core']
export const CATEGORIAS_ECO = ['Salario', 'Freelance', 'Inversión', 'Gasto fijo', 'Gasto variable', 'Ahorro']

/** Continuous streak multiplier, capped at 2.0x on day 91 (mirror of calcularBonusRacha) */
export function calcularBonusRacha(dias: number): number {
  return Math.min(1.0 + dias * 0.011, 2.0)
}

/** Mirror of shared calcularXPFinal: floor(base × racha × horario) */
export function calcularXPFinal(xpBase: number, bonusRacha: number, bonusHorario: number): number {
  return Math.floor(xpBase * bonusRacha * bonusHorario)
}

export interface XPPreview {
  base: number
  bonusRacha: number
  bonusHorario: number
  final: number
}

/**
 * Computes the XP preview exactly like the backend: base from the type's
 * duration tier, × streak multiplier, × time-of-day multiplier.
 */
export function calcularXPPreview(
  tipo: ActividadTipo,
  duracion: number,
  diasRacha: number,
  ts: Date = new Date(),
): XPPreview {
  const def = ACTIVIDADES_CATALOG[tipo]
  const base = def.xpBase(duracion)
  const bonusRacha = calcularBonusRacha(diasRacha)
  const bonusHorario = def.bonusHorario(ts)
  return {
    base,
    bonusRacha,
    bonusHorario,
    final: calcularXPFinal(base, bonusRacha, bonusHorario),
  }
}
