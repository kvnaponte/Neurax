import { and, gte, lte, eq, asc, isNull } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../db/schema'
import { cronos_eventos } from '../../db/schema'

type DB = PostgresJsDatabase<typeof schema>

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

export function makeEnergiaService(db: DB) {
  async function propagarEnergiaDelDia(usuarioId: string, fecha: string) {
    const startOfDay = new Date(`${fecha}T00:00:00.000Z`)
    const endOfDay = new Date(`${fecha}T23:59:59.999Z`)

    const eventos = await db
      .select()
      .from(cronos_eventos)
      .where(and(
        eq(cronos_eventos.usuario_id, usuarioId),
        gte(cronos_eventos.inicio_at, startOfDay),
        lte(cronos_eventos.inicio_at, endOfDay),
        isNull(cronos_eventos.deleted_at),
      ))
      .orderBy(asc(cronos_eventos.inicio_at))

    // Sueño nocturno: desde las 18h del día anterior hasta las 10h del día actual
    const prevDay = new Date(`${fecha}T00:00:00.000Z`)
    prevDay.setDate(prevDay.getDate() - 1)
    const prevNight18h = new Date(prevDay)
    prevNight18h.setUTCHours(18, 0, 0, 0)
    const today10h = new Date(`${fecha}T10:00:00.000Z`)

    const sleepEvents = await db
      .select({ duracion_minutos: cronos_eventos.duracion_minutos })
      .from(cronos_eventos)
      .where(and(
        eq(cronos_eventos.usuario_id, usuarioId),
        eq(cronos_eventos.tipo, 'sueno'),
        gte(cronos_eventos.inicio_at, prevNight18h),
        lte(cronos_eventos.fin_at, today10h),
        isNull(cronos_eventos.deleted_at),
      ))

    const horasSueno = sleepEvents.reduce((acc, ev) => acc + ev.duracion_minutos / 60, 0)
    let energiaActual = calcularEnergiaInicial(horasSueno)

    const resultado: { evento_id: string; energia_acumulada_despues: number }[] = []

    for (const evento of eventos) {
      const consumo = calcularEnergiaEvento(evento.tipo, evento.duracion_minutos)
      energiaActual = Math.max(0, Math.min(100, energiaActual - consumo))

      await db
        .update(cronos_eventos)
        .set({ energia_consumida: String(consumo.toFixed(2)), updated_at: new Date() })
        .where(eq(cronos_eventos.id, evento.id))

      resultado.push({ evento_id: evento.id, energia_acumulada_despues: energiaActual })
    }

    return resultado
  }

  return { calcularEnergiaEvento, propagarEnergiaDelDia }
}

export type EnergiaService = ReturnType<typeof makeEnergiaService>
