import * as SecureStore from 'expo-secure-store'

// For dev: 10.0.2.2 = Android emulator localhost, change to device IP for physical device
const BASE_URL = 'http://10.0.2.2:3000/api'

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-type': 'mobile',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  const data = await res.json()

  if (!res.ok) {
    const err: any = new Error(data.error ?? 'Error desconocido')
    err.statusCode = res.status
    err.retryAfter = res.headers.get('Retry-After')
    throw err
  }

  return data as T
}

export interface GamificationStatus {
  xp_total: number
  xp_nivel_actual: number
  xp_siguiente_nivel: number
  nivel: number
  nombre_nivel: string
  racha_actual: number
  mejor_racha: number
  bonus_xp: number
  xp_hoy: number
}

export interface ActividadHoy {
  id: string
  tipo: string
  area: 'rutinarias' | 'fisicas' | 'economicas' | 'otras'
  hora: string
  duracion: number
  xp: number
}

// Raw activity row as returned by the backend (actividades table)
export interface ActividadRow {
  id: string
  tipo: string
  area: 'rutinarias' | 'fisicas' | 'mentales' | 'economicas'
  duracion_minutos: number
  timestamp: string
  xp_base: number
  xp_generado: number
  limite_excedido: boolean
  descripcion?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ActividadesListResponse {
  data: ActividadRow[]
  total: number
  page: number
  limit: number
}

// Mirrors backend RegistrarSchema (POST /actividades)
export interface RegistrarActividadPayload {
  tipo: string
  duracion_minutos: number
  timestamp?: string
  descripcion?: string
  metadata?: Record<string, unknown>
}

export interface RegistrarActividadResponse {
  actividad: ActividadRow
  xp_otorgado: number
  nivel_nuevo?: number
  racha_actual: number
  limite_excedido: boolean
}

// Raw cronos event row (cronos_eventos table)
export interface CronosEvento {
  id: string
  titulo: string
  tipo: string
  area?: 'rutinarias' | 'fisicas' | 'mentales' | 'economicas' | null
  inicio_at: string
  fin_at: string
  duracion_minutos?: number
  prioridad?: number
  energia_consumida?: string | null
  completado: boolean
  completado_at?: string | null
  seccion_origen?: string | null
  seccion_ref_id?: string | null
  metadata?: Record<string, unknown> | null
}

export interface CrearEventoPayload {
  titulo: string
  tipo: string
  area?: string
  inicio_at: string
  fin_at: string
  prioridad?: number
}

// Mirrors backend MoverEventoSchema (POST /cronos/events/:id/move)
export type MoverOpcion = 'reemplazar' | 'deslizar' | 'intercambiar'
export interface MoverEventoPayload {
  nuevo_inicio: string
  opcion: MoverOpcion
}

export interface CompletarEventoResponse {
  completado: boolean
  impuntual: boolean
  xp_delta: number
  action?: string
}

export interface EnergiaPunto {
  evento_id: string
  energia_acumulada_despues: number
}

// ─── Odin types ─────────────────────────────────────────────────────────────

export interface MisionPrincipal {
  id: string
  nombre: string
  descripcion: string
  progreso_actual: number
  objetivo: number
  xp_reward: number
}

export interface MisionSecundaria {
  id: string
  nombre: string
  xp_reward: number
  completada: boolean
}

export interface OdinDayData {
  mision_principal: MisionPrincipal | null
  misiones_secundarias: MisionSecundaria[]
  cofre_desbloqueado: boolean
  cofre_xp: number
}

export interface CalendarioDia {
  fecha: string
  estado: 'completado' | 'parcial' | 'ninguna' | 'sin_datos'
}

// ─── Leonidas types ──────────────────────────────────────────────────────────

export interface EjercicioPlan {
  id: string
  nombre: string
  series_objetivo: number
  reps_objetivo: number
  sets_completados: number
  peso_kg?: number
}

export interface DiaSemanal {
  dia: string
  fecha: string
  estado: 'completado' | 'hoy' | 'pendiente' | 'especial'
}

export interface LeonidasToday {
  grupo_asignado: string
  grupos_disponibles: number
  ejercicios: EjercicioPlan[]
  grid_semanal: DiaSemanal[]
}

export interface DisponibilidadMuscular {
  grupo: string
  horas_requeridas: number
  horas_transcurridas: number
  disponible: boolean
}

export interface EjercicioRegistro {
  nombre: string
  series: number
  reps: number
  peso_kg?: number
}

export interface RegistrarSesionPayload {
  tipo: 'fuerza' | 'cardio' | 'barras' | 'trote'
  grupos_musculares: string[]
  duracion_minutos: number
  intensidad: number
  ejercicios: EjercicioRegistro[]
}

export interface RegistrarSesionResponse {
  session_id: string
  xp_otorgado: number
}

// ─── Demeter types ───────────────────────────────────────────────────────────

export type FondoKey = 'soberbio' | 'michelin' | 'odysseia' | 'nemesis' | 'kubera'
export interface PresupuestoConfig {
  ingreso_mensual: number
  fondos: Record<FondoKey, number>
  configurado: boolean
}
export interface Movimiento {
  id: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  descripcion: string
  fondo: FondoKey | null
  created_at: string
}
export interface DemeterBalance {
  total: number
  fondos: Record<FondoKey, { balance: number; porcentaje: number }>
}

// ─── Dionisio types ───────────────────────────────────────────────────────────

export interface VideoProcessado {
  id: string
  url: string
  titulo: string
  categoria: string
  duracion_segundos: number
  transcripcion: string
  xp_otorgado: number
  processed_at: string
}
export type PipelineStep = 'descargando' | 'extrayendo' | 'transcribiendo' | 'clasificando' | 'completado' | 'error'

// ─── Soberbio types ───────────────────────────────────────────────────────────

export interface CalificacionSoberbio {
  ambiente: number
  atencion: number
  comida: number
  precio: number
  ubicacion: number
  nota?: string
}
export interface Experiencia {
  id: string
  nombre: string
  tipo: string
  ciudad: string
  precio_promedio: number | null
  descripcion: string | null
  url_maps: string | null
  estado: 'planificado' | 'visitado'
  calificacion?: CalificacionSoberbio
}

// ─── Apolo types ──────────────────────────────────────────────────────────────

export type EstadoPelicula = 'visto' | 'pendiente' | 'descartado'
export interface Pelicula {
  id: string
  titulo: string
  anio: number | null
  director: string | null
  pais: string | null
  genero: string | null
  estado: EstadoPelicula
  calificacion: number | null
  categoria: number | null
  created_at: string
}

// ─── Content section types ────────────────────────────────────────────────────

export interface LibroAlejandria {
  id: string
  titulo: string
  autor: string
  anio: number | null
  paginas: number | null
  genero: string | null
  estado: 'leyendo' | 'completado' | 'pendiente'
  pagina_actual?: number
  fecha_completado?: string | null
  notas?: string | null
}
export interface ItemMichelin {
  id: string
  nombre: string
  tipo: string
  ciudad: string
  chef: string | null
  visitado?: boolean
  notas: string | null
}
export interface ItemOdysseia {
  id: string
  destino: string
  pais: string
  tipo: string
  estado: string
  notas: string | null
}
export interface ItemNemesis {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  dificultad: string
  fecha_limite: string | null
  completado?: boolean
}
export interface ItemKubera {
  id: string
  titulo: string
  categoria: string
  monto_objetivo: number
  monto_actual?: number
  fecha_objetivo?: string | null
  notas?: string | null
}
export interface ItemProeza {
  id: string
  titulo: string
  categoria: string
  valor: number | null
  unidad: string | null
  descripcion: string | null
  fecha: string | null
}
export interface ItemProdigy {
  id: string
  nombre: string
  categoria: string
  nivel: string
  descripcion: string | null
}

// ─── Logros types ─────────────────────────────────────────────────────────────

export interface Logro {
  id: string
  nombre: string
  descripcion: string
  xp_otorgado: number
  desbloqueado: boolean
  progreso_actual?: number
  progreso_objetivo?: number
  fecha_desbloqueado?: string | null
  categoria: string
}

// ─── Notificaciones types ─────────────────────────────────────────────────────

export type NotifTipo = 'racha' | 'mision' | 'cronos' | 'ia' | 'logro' | 'sistema'
export interface Notificacion {
  id: string
  tipo: NotifTipo
  titulo: string
  cuerpo: string
  leida: boolean
  created_at: string
}
export interface NotifConfig {
  rachas: boolean
  misiones: boolean
  cronos: boolean
  ia: boolean
}

// ─── Perfil types ─────────────────────────────────────────────────────────────

export interface PerfilData {
  id: string
  nombre: string
  email: string
  avatar_url: string | null
  xp_por_semana: number[]
  logros_total: number
  logros_desbloqueados: number
  actividades_semana: number
}

export const api = {
  gamification: {
    status: (token: string) =>
      request<GamificationStatus>('/gamification/status', { token }),
  },

  actividades: {
    today: (token: string) =>
      request<ActividadHoy[]>('/actividades/today', { token }),
    list: (token: string, opts: { area?: string; page?: number; limit?: number } = {}) => {
      const qs = new URLSearchParams()
      if (opts.area) qs.set('area', opts.area)
      if (opts.page) qs.set('page', String(opts.page))
      if (opts.limit) qs.set('limit', String(opts.limit))
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return request<ActividadesListResponse>(`/actividades${suffix}`, { token })
    },
    registrar: (token: string, payload: RegistrarActividadPayload) =>
      request<RegistrarActividadResponse>(
        '/actividades',
        { method: 'POST', body: JSON.stringify(payload), token },
      ),
  },

  cronos: {
    getEvents: (token: string, fecha: string) =>
      request<CronosEvento[]>(`/cronos/events?fecha=${fecha}`, { token }),
    createEvent: (token: string, payload: CrearEventoPayload) =>
      request<CronosEvento>('/cronos/events', { method: 'POST', body: JSON.stringify(payload), token }),
    completeEvent: (token: string, id: string) =>
      request<CompletarEventoResponse>(
        `/cronos/events/${id}/complete`,
        { method: 'POST', token },
      ),
    moveEvent: (token: string, id: string, payload: MoverEventoPayload) =>
      request<{ success: boolean }>(
        `/cronos/events/${id}/move`,
        { method: 'POST', body: JSON.stringify(payload), token },
      ),
    energy: (token: string, fecha: string) =>
      request<EnergiaPunto[]>(`/cronos/energy/${fecha}`, { token }),
  },

  odin: {
    today: (token: string) =>
      request<OdinDayData>('/odin/missions/today', { token }),
    calendario: (token: string, anio: number, mes: number) =>
      request<CalendarioDia[]>(`/odin/calendar?anio=${anio}&mes=${mes}`, { token }),
    completarMision: (token: string, id: string) =>
      request<{ xp_otorgado: number; cofre_desbloqueado: boolean }>(
        `/odin/missions/${id}/complete`,
        { method: 'POST', token },
      ),
  },

  leonidas: {
    today: (token: string) =>
      request<LeonidasToday>('/leonidas/today', { token }),
    disponibilidad: (token: string) =>
      request<DisponibilidadMuscular[]>('/leonidas/disponibilidad', { token }),
    registrarSesion: (token: string, payload: RegistrarSesionPayload) =>
      request<RegistrarSesionResponse>(
        '/leonidas/sesiones',
        { method: 'POST', body: JSON.stringify(payload), token },
      ),
  },

  demeter: {
    budget: (token: string) =>
      request<PresupuestoConfig>('/demeter/budget', { token }),
    setBudget: (token: string, payload: { ingreso_mensual: number; fondos: Record<FondoKey, number> }) =>
      request<PresupuestoConfig>('/demeter/budget', { method: 'POST', body: JSON.stringify(payload), token }),
    balance: (token: string) =>
      request<DemeterBalance>('/demeter/balance', { token }),
    movimientos: (token: string, opts: { tipo?: string; fondo?: string; page?: number } = {}) => {
      const qs = new URLSearchParams()
      if (opts.tipo) qs.set('tipo', opts.tipo)
      if (opts.fondo) qs.set('fondo', opts.fondo)
      if (opts.page) qs.set('page', String(opts.page))
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return request<{ data: Movimiento[]; total: number }>(`/demeter/movimientos${suffix}`, { token })
    },
    addMovimiento: (token: string, payload: { tipo: 'ingreso' | 'egreso'; monto: number; descripcion: string; fondo?: FondoKey }) =>
      request<Movimiento>('/demeter/movimientos', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  dionisio: {
    process: (token: string, url: string) =>
      request<{ job_id: string }>('/dionisio/process', { method: 'POST', body: JSON.stringify({ url }), token }),
    status: (token: string, job_id: string) =>
      request<{ step: PipelineStep; video?: VideoProcessado }>(`/dionisio/status/${job_id}`, { token }),
    videos: (token: string) =>
      request<VideoProcessado[]>('/dionisio/videos', { token }),
  },

  soberbio: {
    list: (token: string) =>
      request<Experiencia[]>('/soberbio/experiencias', { token }),
    add: (token: string, payload: Omit<Experiencia, 'id' | 'estado' | 'calificacion'>) =>
      request<Experiencia>('/soberbio/experiencias', { method: 'POST', body: JSON.stringify(payload), token }),
    calificar: (token: string, id: string, payload: CalificacionSoberbio) =>
      request<Experiencia>(`/soberbio/experiencias/${id}/calificar`, { method: 'POST', body: JSON.stringify(payload), token }),
  },

  apolo: {
    list: (token: string, estado?: EstadoPelicula) => {
      const qs = estado ? `?estado=${estado}` : ''
      return request<Pelicula[]>(`/apolo/peliculas${qs}`, { token })
    },
    add: (token: string, payload: Omit<Pelicula, 'id' | 'categoria' | 'created_at'>) =>
      request<Pelicula>('/apolo/peliculas', { method: 'POST', body: JSON.stringify(payload), token }),
    get: (token: string, id: string) =>
      request<Pelicula>(`/apolo/peliculas/${id}`, { token }),
    update: (token: string, id: string, payload: Partial<Omit<Pelicula, 'id' | 'created_at'>>) =>
      request<Pelicula>(`/apolo/peliculas/${id}`, { method: 'PUT', body: JSON.stringify(payload), token }),
    delete: (token: string, id: string) =>
      request<{ success: boolean }>(`/apolo/peliculas/${id}`, { method: 'DELETE', token }),
  },

  alejandria: {
    list: (token: string, estado?: string) => {
      const qs = estado ? `?estado=${estado}` : ''
      return request<LibroAlejandria[]>(`/alejandria/libros${qs}`, { token })
    },
    add: (token: string, payload: Omit<LibroAlejandria, 'id'>) =>
      request<LibroAlejandria>('/alejandria/libros', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  michelin: {
    list: (token: string) => request<ItemMichelin[]>('/michelin/items', { token }),
    add: (token: string, payload: Omit<ItemMichelin, 'id'>) =>
      request<ItemMichelin>('/michelin/items', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  odysseia: {
    list: (token: string) => request<ItemOdysseia[]>('/odysseia/items', { token }),
    add: (token: string, payload: Omit<ItemOdysseia, 'id'>) =>
      request<ItemOdysseia>('/odysseia/items', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  nemesis: {
    list: (token: string) => request<ItemNemesis[]>('/nemesis/items', { token }),
    add: (token: string, payload: Omit<ItemNemesis, 'id'>) =>
      request<ItemNemesis>('/nemesis/items', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  kubera: {
    list: (token: string) => request<ItemKubera[]>('/kubera/items', { token }),
    add: (token: string, payload: Omit<ItemKubera, 'id'>) =>
      request<ItemKubera>('/kubera/items', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  proeza: {
    list: (token: string) => request<ItemProeza[]>('/proeza/items', { token }),
    add: (token: string, payload: Omit<ItemProeza, 'id'>) =>
      request<ItemProeza>('/proeza/items', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  prodigy: {
    list: (token: string) => request<ItemProdigy[]>('/prodigy/items', { token }),
    add: (token: string, payload: Omit<ItemProdigy, 'id'>) =>
      request<ItemProdigy>('/prodigy/items', { method: 'POST', body: JSON.stringify(payload), token }),
  },

  logros: {
    list: (token: string) => request<Logro[]>('/logros', { token }),
  },

  notificaciones: {
    list: (token: string) => request<Notificacion[]>('/notificaciones', { token }),
    markRead: (token: string, id: string) =>
      request<{ success: boolean }>(`/notificaciones/${id}/read`, { method: 'PATCH', token }),
    delete: (token: string, id: string) =>
      request<{ success: boolean }>(`/notificaciones/${id}`, { method: 'DELETE', token }),
    getConfig: (token: string) => request<NotifConfig>('/notificaciones/config', { token }),
    updateConfig: (token: string, config: Partial<NotifConfig>) =>
      request<NotifConfig>('/notificaciones/config', { method: 'PUT', body: JSON.stringify(config), token }),
  },

  perfil: {
    get: (token: string) => request<PerfilData>('/perfil', { token }),
    update: (token: string, payload: { nombre?: string }) =>
      request<PerfilData>('/perfil', { method: 'PUT', body: JSON.stringify(payload), token }),
    uploadAvatar: (token: string, formData: FormData) =>
      request<{ avatar_url: string }>('/perfil/avatar', {
        method: 'POST',
        body: formData as unknown as BodyInit,
        headers: { Authorization: `Bearer ${token}`, 'x-client-type': 'mobile' } as Record<string, string>,
      }),
  },

  auth: {
    register: (body: { nombre: string; email: string; password: string }) =>
      request<{ access_token: string; refresh_token: string; user: { id: string; nombre: string; email: string } }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(body) },
      ),

    login: (body: { email: string; password: string }) =>
      request<{
        access_token: string
        refresh_token: string
        secret_question: string
        user: { id: string; nombre: string; email: string }
      }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    verifySecret: (answer: string, token: string) =>
      request<{ access_token: string; verified: boolean }>(
        '/auth/verify-secret',
        { method: 'POST', body: JSON.stringify({ answer }), token },
      ),

    refresh: (refresh_token: string) =>
      request<{ access_token: string; refresh_token: string }>(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refresh_token }) },
      ),

    logout: (refresh_token: string, token: string) =>
      request<{ success: boolean }>(
        '/auth/logout',
        { method: 'POST', body: JSON.stringify({ refresh_token }), token },
      ),

    recoverVerify: (body: { email: string; answer1: string; answer2: string }) =>
      request<{ recovery_token: string; questions: [string, string] }>(
        '/auth/recover/verify',
        { method: 'POST', body: JSON.stringify(body) },
      ),

    recoverReset: (password: string, recoveryToken: string) =>
      request<{ success: boolean }>(
        '/auth/recover/reset',
        {
          method: 'POST',
          body: JSON.stringify({ password }),
          headers: { Authorization: `Bearer ${recoveryToken}` },
        },
      ),
  },
}

export const secureStorage = {
  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('access_token', accessToken)
    await SecureStore.setItemAsync('refresh_token', refreshToken)
  },
  getAccessToken: () => SecureStore.getItemAsync('access_token'),
  getRefreshToken: () => SecureStore.getItemAsync('refresh_token'),
  clearTokens: async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
  },
}
