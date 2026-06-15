export type ActivityArea = 'rutinaria' | 'fisica' | 'economica'

export type ActivityType =
  | 'sueno' | 'meditacion' | 'sol' | 'transporte' | 'musica'
  | 'fuerza' | 'cardio' | 'barras' | 'trote'
  | 'ingreso' | 'egreso' | 'planificacion'

export interface Activity {
  id: string
  userId: string
  type: ActivityType
  area: ActivityArea
  xpEarned: number
  durationMinutes?: number
  metadata?: Record<string, unknown>
  registeredAt: string
}
