/**
 * Mirror of the backend energy propagation so the Cronos timeline can render
 * the energy gradient column even before the server round-trip, and overlay
 * the authoritative server values when available.
 * Source of truth: backend/src/modules/cronos/energia.service.ts
 */
import { colors } from '@/theme'
import type { CronosEvento } from './api'

const CONSUMO_ENERGIA: Record<string, number> = {
  sueno: -60,
  ejercicio_fuerza: 25,
  ejercicio_cardio: 20,
  estudio: 15,
  trabajo: 10,
  transporte: 5,
  meditacion: -10,
  musica_escucha: 2,
  descanso: -5,
  ocio_activo: 3,
}

export function calcularEnergiaEvento(tipo: string, duracionMin: number): number {
  const consumoPorHora = CONSUMO_ENERGIA[tipo] ?? 5
  return consumoPorHora * (duracionMin / 60)
}

function calcularEnergiaInicial(horasSueno: number): number {
  if (horasSueno < 5) return 50
  if (horasSueno < 6) return 65
  if (horasSueno < 7) return 75
  if (horasSueno < 8) return 90
  return 100
}

function durMin(ev: CronosEvento): number {
  return (new Date(ev.fin_at).getTime() - new Date(ev.inicio_at).getTime()) / 60_000
}

/**
 * Builds the energy level in effect at each hour [startHour, endHour).
 * - Initial energy comes from sleep events present in the day (defaults to
 *   100 / well-rested when no sleep is logged, matching the rested premise).
 * - When `serverEnergy` is provided (from GET /cronos/energy/:fecha) the
 *   authoritative post-event value overrides the local estimate.
 */
export function buildEnergyByHour(
  eventos: CronosEvento[],
  startHour: number,
  endHour: number,
  serverEnergy?: Map<string, number>,
): Record<number, number> {
  const horasSueno = eventos
    .filter((e) => e.tipo === 'sueno')
    .reduce((acc, e) => acc + durMin(e) / 60, 0)

  let energia = horasSueno > 0 ? calcularEnergiaInicial(horasSueno) : 100
  const sorted = [...eventos].sort(
    (a, b) => new Date(a.inicio_at).getTime() - new Date(b.inicio_at).getTime(),
  )

  const byHour: Record<number, number> = {}
  for (let hour = startHour; hour < endHour; hour++) {
    for (const ev of sorted) {
      if (new Date(ev.inicio_at).getHours() !== hour) continue
      const server = serverEnergy?.get(ev.id)
      energia =
        server != null
          ? server
          : Math.max(0, Math.min(100, energia - calcularEnergiaEvento(ev.tipo, durMin(ev))))
    }
    byHour[hour] = energia
  }
  return byHour
}

/** Maps an energy percentage (0–100) to its gradient color. */
export function energiaColor(pct: number): string {
  if (pct >= 90) return colors.energia[100]
  if (pct >= 65) return colors.energia[75]
  if (pct >= 40) return colors.energia[50]
  if (pct >= 15) return colors.energia[25]
  return colors.energia[0]
}
