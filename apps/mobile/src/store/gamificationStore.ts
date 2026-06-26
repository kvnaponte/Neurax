import { create } from 'zustand'

interface GamificationState {
  xp_total: number
  xp_nivel_actual: number
  xp_siguiente_nivel: number
  nivel: number
  nombre_nivel: string
  racha_actual: number
  mejor_racha: number
  bonus_xp: number
  xp_hoy: number
  notifications_count: number
  setGamification: (data: Partial<Omit<GamificationState, 'setGamification' | 'incrementNotifications'>>) => void
  incrementNotifications: () => void
}

export const useGamificationStore = create<GamificationState>((set) => ({
  xp_total: 0,
  xp_nivel_actual: 0,
  xp_siguiente_nivel: 500,
  nivel: 1,
  nombre_nivel: 'Superviviente',
  racha_actual: 0,
  mejor_racha: 0,
  bonus_xp: 1.0,
  xp_hoy: 0,
  notifications_count: 0,

  setGamification: (data) => set((state) => ({ ...state, ...data })),

  incrementNotifications: () =>
    set((state) => ({ notifications_count: state.notifications_count + 1 })),
}))
