/** Multiplicador continuo de racha, capped en 2.0x al día 91 */
export function calcularBonusRacha(dias: number): number {
  return Math.min(1.0 + dias * 0.011, 2.0)
}

/**
 * Nivel del usuario según XP total:
 * 1: 0–27000 | 2: 27001–70000 | 3: 70001–140000
 * 4: 140001–250000 | 5: 250001–420000 | 6: 420001+
 */
export function calcularNivel(xpTotal: number): number {
  if (xpTotal <= 27000) return 1
  if (xpTotal <= 70000) return 2
  if (xpTotal <= 140000) return 3
  if (xpTotal <= 250000) return 4
  if (xpTotal <= 420000) return 5
  return 6
}

export function calcularXPFinal(xpBase: number, bonusRacha: number, bonusHorario: number): number {
  return Math.floor(xpBase * bonusRacha * bonusHorario)
}

/**
 * Ventanas horarias óptimas (1.2x) por tipo de actividad.
 * Usa horas UTC para consistencia en tests.
 */
export function esHorarioOptimo(tipo: string, timestamp: Date): boolean {
  const h = timestamp.getUTCHours()
  switch (tipo) {
    case 'ejercicios':  return h >= 6 && h < 10
    case 'estudio':     return h >= 8 && h < 14
    case 'sol_matutino':
    case 'meditacion':  return h < 9
    case 'sueno':       return h >= 21 || h < 7
    default:            return false
  }
}

/** Penalización Cronos: 15% de descuento si la tarea no fue puntual */
export function calcularXPConPenalizacionCronos(xpBase: number, fuePuntual: boolean): number {
  return fuePuntual ? xpBase : Math.floor(xpBase * 0.85)
}
