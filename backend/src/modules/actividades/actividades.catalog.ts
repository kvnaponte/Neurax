export type ActividadTipo =
  | 'sueno' | 'meditacion' | 'sol_matutino' | 'transporte' | 'musica_escucha'
  | 'ejercicio_fuerza' | 'ejercicio_cardio' | 'barras' | 'trote'
  | 'estudio' | 'trabajo' | 'musica_produccion'
  | 'ingreso' | 'egreso' | 'planificacion_financiera'

type CatalogEntry = {
  area: 'rutinarias' | 'fisicas' | 'mentales' | 'economicas'
  xpBase: (duracion: number) => number
  bonusHorario: (ts: Date) => number
  maxPorDia?: number
}

function h(ts: Date) { return ts.getUTCHours() }

export const ACTIVIDADES_CATALOG: Record<ActividadTipo, CatalogEntry> = {
  sueno:                    { area: 'rutinarias', xpBase: (d) => d >= 345 ? 20 : 10, bonusHorario: (ts) => (h(ts) >= 21 || h(ts) < 7) ? 1.2 : 1.0 },
  meditacion:               { area: 'rutinarias', xpBase: (d) => d >= 20 ? 20 : 10, bonusHorario: (ts) => h(ts) < 9 ? 1.2 : 1.0 },
  sol_matutino:             { area: 'rutinarias', xpBase: () => 15, bonusHorario: (ts) => h(ts) < 9 ? 1.2 : 1.0 },
  transporte:               { area: 'rutinarias', xpBase: () => 5, bonusHorario: () => 1.0 },
  musica_escucha:           { area: 'rutinarias', xpBase: () => 5, bonusHorario: () => 1.0, maxPorDia: 2 },
  ejercicio_fuerza:         { area: 'fisicas', xpBase: (d) => d >= 60 ? 15 : 5, bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0 },
  ejercicio_cardio:         { area: 'fisicas', xpBase: (d) => d >= 30 ? 15 : 5, bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0 },
  barras:                   { area: 'fisicas', xpBase: (d) => d >= 30 ? 20 : 10, bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0 },
  trote:                    { area: 'fisicas', xpBase: (d) => d >= 30 ? 20 : 10, bonusHorario: (ts) => (h(ts) >= 6 && h(ts) < 10) ? 1.2 : 1.0 },
  estudio:                  { area: 'mentales', xpBase: (d) => d >= 50 ? 25 : 10, bonusHorario: (ts) => (h(ts) >= 8 && h(ts) < 14) ? 1.2 : 1.0 },
  trabajo:                  { area: 'mentales', xpBase: () => 10, bonusHorario: () => 1.0 },
  musica_produccion:        { area: 'mentales', xpBase: () => 20, bonusHorario: () => 1.0 },
  ingreso:                  { area: 'economicas', xpBase: () => 10, bonusHorario: () => 1.0 },
  egreso:                   { area: 'economicas', xpBase: () => 5, bonusHorario: () => 1.0 },
  planificacion_financiera: { area: 'economicas', xpBase: () => 15, bonusHorario: () => 1.0 },
}

export const LIMITES_DIARIOS_XP: Record<string, number> = {
  rutinarias: 100,
  fisicas: 200,
  mentales: 200,
  economicas: 100,
}

export const TIPOS_VALIDOS = Object.keys(ACTIVIDADES_CATALOG) as ActividadTipo[]
