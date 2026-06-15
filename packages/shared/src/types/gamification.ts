export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  xpReward: number
  unlockedAt?: string
}

export interface Streak {
  current: number
  longest: number
  lastActivityDate: string
}

export const LEVEL_THRESHOLDS: Record<string, number> = {
  superviviente: 0,
  aprendiz: 100,
  guerrero: 250,
  veterano: 500,
  campeon: 1000,
  imbatible: 2000,
}
