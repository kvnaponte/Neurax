export type UserLevel = 'superviviente' | 'aprendiz' | 'guerrero' | 'veterano' | 'campeon' | 'imbatible'

export interface User {
  id: string
  email: string
  username: string
  level: UserLevel
  xpTotal: number
  xpPercent: number
  streakDays: number
  createdAt: string
}
