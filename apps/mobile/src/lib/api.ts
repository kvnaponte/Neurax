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
