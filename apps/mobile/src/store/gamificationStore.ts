import { create } from 'zustand'

interface GamificationState {
  xp_total: number
  nivel: number
  racha_actual: number
  bonus_racha: number
  setGamification: (data: Partial<Omit<GamificationState, 'setGamification'>>) => void
}

export const useGamificationStore = create<GamificationState>((set) => ({
  xp_total: 0,
  nivel: 1,
  racha_actual: 0,
  bonus_racha: 0,
  setGamification: (data) => set((state) => ({ ...state, ...data })),
}))
