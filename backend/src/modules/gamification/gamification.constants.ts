export const NIVELES = [
  { nivel: 1, nombre: 'Superviviente', color: '#34d399', xpMin: 0,      xpMax: 27000  },
  { nivel: 2, nombre: 'Aprendiz',      color: '#fb923c', xpMin: 27001,  xpMax: 70000  },
  { nivel: 3, nombre: 'Guerrero',      color: '#a855f7', xpMin: 70001,  xpMax: 140000 },
  { nivel: 4, nombre: 'Veterano',      color: '#60a5fa', xpMin: 140001, xpMax: 250000 },
  { nivel: 5, nombre: 'Campeón',       color: '#f472b6', xpMin: 250001, xpMax: 420000 },
  { nivel: 6, nombre: 'Imbatible',     color: '#fbbf24', xpMin: 420001, xpMax: Infinity },
] as const

export function getNivelInfo(nivel: number) {
  return NIVELES.find((n) => n.nivel === nivel) ?? NIVELES[0]
}

export function getXpParaSiguienteNivel(nivel: number, xpTotal: number): number {
  if (nivel >= 6) return 0
  const current = getNivelInfo(nivel)
  return current.xpMax + 1 - xpTotal
}

export function getPorcentajeNivel(nivel: number, xpTotal: number): number {
  if (nivel >= 6) return 100
  const current = getNivelInfo(nivel)
  const range = current.xpMax - current.xpMin
  const progress = xpTotal - current.xpMin
  return Math.min(100, Math.floor((progress / range) * 100))
}
