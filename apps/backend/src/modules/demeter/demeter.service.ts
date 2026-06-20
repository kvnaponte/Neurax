import { db } from '../../db/index.js'
import { demeterPresupuestos } from '../../db/schema/demeter.js'
import { eq, desc } from 'drizzle-orm'
import { seleccionarAleatorio } from '../soberbio/soberbio.service.js'

type FondoEspecial = {
  nombre: string
  objetivo: number
  actual: number
}

export async function verificarFondosSoberbio(usuarioId: string) {
  const [presupuesto] = await db
    .select()
    .from(demeterPresupuestos)
    .where(eq(demeterPresupuestos.usuarioId, usuarioId))
    .orderBy(desc(demeterPresupuestos.createdAt))
    .limit(1)

  if (!presupuesto?.fondosEspeciales) return null

  const fondos = presupuesto.fondosEspeciales as Record<string, FondoEspecial>
  const fondoSoberbio = fondos['soberbio']

  if (!fondoSoberbio) return null
  if (fondoSoberbio.actual < fondoSoberbio.objetivo) return null

  const lugar = await seleccionarAleatorio(usuarioId)
  if (!lugar) return null

  // Stub: notifications module (#22) not yet implemented
  // notifications.crearNotificacion(usuarioId, { titulo: `¡Ya tienes presupuesto! 🍽️ Esta vez le toca a ${lugar.nombre}`, tipo: 'soberbio', ref_id: lugar.id })

  return { lugar, fondo: fondoSoberbio }
}
