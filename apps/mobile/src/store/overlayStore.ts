import { create } from 'zustand'
import { colors } from '@/theme'

const NIVEL_NOMBRES: Record<number, string> = {
  1: 'Superviviente',
  2: 'Aprendiz',
  3: 'Guerrero',
  4: 'Veterano',
  5: 'Campeón',
  6: 'Imbatible',
}

interface LevelUpData {
  nivel: number
  nombreNivel: string
  colorNivel: string
}

interface XPRiseItem {
  id: string
  xp: number
}

interface OverlayState {
  levelUp: LevelUpData | null
  xpRises: XPRiseItem[]
  showLevelUp: (nivel: number) => void
  hideLevelUp: () => void
  addXPRise: (xp: number) => void
  removeXPRise: (id: string) => void
}

let _xpRiseCounter = 0

export const useOverlayStore = create<OverlayState>((set) => ({
  levelUp: null,
  xpRises: [],

  showLevelUp: (nivel) => set({
    levelUp: {
      nivel,
      nombreNivel: NIVEL_NOMBRES[nivel] ?? `Nivel ${nivel}`,
      colorNivel: (colors.niveles as Record<number, string>)[nivel] ?? colors.purple[300],
    },
  }),

  hideLevelUp: () => set({ levelUp: null }),

  addXPRise: (xp) => set((state) => ({
    xpRises: [...state.xpRises, { id: `xp-${++_xpRiseCounter}`, xp }],
  })),

  removeXPRise: (id) => set((state) => ({
    xpRises: state.xpRises.filter((r) => r.id !== id),
  })),
}))
