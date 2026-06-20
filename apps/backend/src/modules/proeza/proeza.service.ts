import { db } from '../../db/index.js'
import { proezaCanciones, proezaExploracionMusical } from '../../db/schema/proeza.js'
import { cronosEventos } from '../../db/schema/cronos.js'
import { eq, and, isNull, desc, ne } from 'drizzle-orm'

type CancionData = {
  nombre: string
  estado_pipeline?: string
  beatmaker?: string
  fecha_inicio?: string
  fecha_objetivo_lanzamiento?: string
  fecha_objetivo_mezcla?: string
  links?: string[]
}

const CIUDADES_POR_PAIS: Record<string, string[]> = {
  Colombia: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
  México: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla'],
  Argentina: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'],
  Brasil: ['São Paulo', 'Río de Janeiro', 'Salvador', 'Fortaleza'],
  España: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'],
  'Estados Unidos': ['Nueva York', 'Los Ángeles', 'Chicago', 'Houston'],
  Japón: ['Tokio', 'Osaka', 'Kioto', 'Sapporo'],
  Francia: ['París', 'Lyon', 'Marsella', 'Toulouse'],
  Nigeria: ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
  Jamaica: ['Kingston', 'Montego Bay', 'Portmore', 'Spanish Town'],
}

const PAISES = Object.keys(CIUDADES_POR_PAIS)

async function crearEventosCronos(usuarioId: string, cancionId: string, fechaBase: string, tipo: string) {
  const base = new Date(fechaBase)
  const offsets = [0, -1, -3, -7]
  const eventos = offsets.map((dias) => {
    const fecha = new Date(base)
    fecha.setDate(fecha.getDate() + dias)
    const fin = new Date(fecha)
    fin.setHours(fin.getHours() + 1)
    return {
      usuarioId,
      titulo: `Proeza – ${tipo} (${dias === 0 ? 'día exacto' : `${Math.abs(dias)} día${Math.abs(dias) > 1 ? 's' : ''} antes`})`,
      tipo: 'recordatorio',
      area: 'musica',
      inicioAt: fecha,
      finAt: fin,
      seccionOrigen: 'proeza',
      seccionRefId: cancionId,
    }
  })
  return db.insert(cronosEventos).values(eventos).returning()
}

export async function registrarCancion(usuarioId: string, data: CancionData) {
  const [cancion] = await db
    .insert(proezaCanciones)
    .values({
      usuarioId,
      nombre: data.nombre,
      estadoPipeline: data.estado_pipeline ?? 'idea',
      beatmaker: data.beatmaker,
      fechaInicio: data.fecha_inicio ?? null,
      fechaObjetivoLanzamiento: data.fecha_objetivo_lanzamiento ?? null,
      fechaObjetivoMezcla: data.fecha_objetivo_mezcla ?? null,
      links: data.links,
    })
    .returning()

  if (data.fecha_objetivo_lanzamiento) {
    await crearEventosCronos(usuarioId, cancion.id, data.fecha_objetivo_lanzamiento, 'Lanzamiento')
  }
  if (data.fecha_objetivo_mezcla) {
    await crearEventosCronos(usuarioId, cancion.id, data.fecha_objetivo_mezcla, 'Mezcla')
  }

  return cancion
}

export async function editarCancion(usuarioId: string, cancionId: string, data: Partial<CancionData>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.nombre !== undefined) updates.nombre = data.nombre
  if (data.estado_pipeline !== undefined) updates.estadoPipeline = data.estado_pipeline
  if (data.beatmaker !== undefined) updates.beatmaker = data.beatmaker
  if (data.fecha_inicio !== undefined) updates.fechaInicio = data.fecha_inicio
  if (data.links !== undefined) updates.links = data.links

  const [cancion] = await db
    .update(proezaCanciones)
    .set(updates)
    .where(and(eq(proezaCanciones.id, cancionId), eq(proezaCanciones.usuarioId, usuarioId), isNull(proezaCanciones.deletedAt)))
    .returning()

  if (data.fecha_objetivo_lanzamiento) {
    await db
      .update(proezaCanciones)
      .set({ fechaObjetivoLanzamiento: data.fecha_objetivo_lanzamiento })
      .where(eq(proezaCanciones.id, cancionId))
    await crearEventosCronos(usuarioId, cancionId, data.fecha_objetivo_lanzamiento, 'Lanzamiento')
  }
  if (data.fecha_objetivo_mezcla) {
    await db
      .update(proezaCanciones)
      .set({ fechaObjetivoMezcla: data.fecha_objetivo_mezcla })
      .where(eq(proezaCanciones.id, cancionId))
    await crearEventosCronos(usuarioId, cancionId, data.fecha_objetivo_mezcla, 'Mezcla')
  }

  return cancion
}

export async function obtenerCanciones(usuarioId: string) {
  return db
    .select()
    .from(proezaCanciones)
    .where(and(eq(proezaCanciones.usuarioId, usuarioId), isNull(proezaCanciones.deletedAt)))
    .orderBy(desc(proezaCanciones.createdAt))
}

export async function eliminarCancion(usuarioId: string, cancionId: string) {
  const [cancion] = await db
    .update(proezaCanciones)
    .set({ deletedAt: new Date() })
    .where(and(eq(proezaCanciones.id, cancionId), eq(proezaCanciones.usuarioId, usuarioId), isNull(proezaCanciones.deletedAt)))
    .returning()
  return cancion
}

export async function obtenerExploracionActual(usuarioId: string) {
  const [actual] = await db
    .select()
    .from(proezaExploracionMusical)
    .where(
      and(
        eq(proezaExploracionMusical.usuarioId, usuarioId),
        ne(proezaExploracionMusical.estado, 'explorado')
      )
    )
    .orderBy(desc(proezaExploracionMusical.createdAt))
    .limit(1)

  if (actual) return actual

  // Asignar nueva combinación aleatoria distinta a la última explorada
  const ultima = await db
    .select()
    .from(proezaExploracionMusical)
    .where(eq(proezaExploracionMusical.usuarioId, usuarioId))
    .orderBy(desc(proezaExploracionMusical.createdAt))
    .limit(1)

  let pais: string
  let ciudad: string
  do {
    pais = PAISES[Math.floor(Math.random() * PAISES.length)]
    const ciudades = CIUDADES_POR_PAIS[pais]
    ciudad = ciudades[Math.floor(Math.random() * ciudades.length)]
  } while (ultima[0] && ultima[0].pais === pais && ultima[0].ciudad === ciudad)

  const [nueva] = await db
    .insert(proezaExploracionMusical)
    .values({ usuarioId, pais, ciudad, estado: 'asignado' })
    .returning()

  return nueva
}

export async function completarExploracion(usuarioId: string) {
  const [actual] = await db
    .select()
    .from(proezaExploracionMusical)
    .where(and(eq(proezaExploracionMusical.usuarioId, usuarioId), ne(proezaExploracionMusical.estado, 'explorado')))
    .orderBy(desc(proezaExploracionMusical.createdAt))
    .limit(1)

  if (!actual) return null

  await db
    .update(proezaExploracionMusical)
    .set({ estado: 'explorado', updatedAt: new Date() })
    .where(eq(proezaExploracionMusical.id, actual.id))

  // Asignar nueva combinación aleatoria distinta
  let pais: string
  let ciudad: string
  do {
    pais = PAISES[Math.floor(Math.random() * PAISES.length)]
    const ciudades = CIUDADES_POR_PAIS[pais]
    ciudad = ciudades[Math.floor(Math.random() * ciudades.length)]
  } while (pais === actual.pais && ciudad === actual.ciudad)

  const [nueva] = await db
    .insert(proezaExploracionMusical)
    .values({ usuarioId, pais, ciudad, estado: 'asignado' })
    .returning()

  return nueva
}
