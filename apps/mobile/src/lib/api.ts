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

export interface ActividadDetalle extends ActividadHoy {
  fecha: string
  nombre?: string
  metadata?: Record<string, unknown>
}

export interface RegistrarActividadPayload {
  tipo: string
  area: 'rutinarias' | 'fisicas' | 'economicas' | 'otras'
  duracion: number
  hora?: string
  metadata?: Record<string, unknown>
}

export interface CronosEvento {
  id: string
  titulo: string
  tipo?: string
  area?: 'rutinarias' | 'fisicas' | 'economicas' | 'otras'
  inicio_at: string
  fin_at: string
  completado: boolean
  xp?: number
  prioridad?: string
}

export interface MoverEventoPayload {
  inicio_at: string
  fin_at: string
  resolucion?: 'reemplazar' | 'deslizar' | 'intercambiar'
  conflicto_id?: string
}

export const api = {
  gamification: {
    status: (token: string) =>
      request<GamificationStatus>('/gamification/status', { token }),
  },

  actividades: {
    today: (token: string) =>
      request<ActividadHoy[]>('/actividades/today', { token }),
    list: (token: string, area?: string) =>
      request<ActividadDetalle[]>(`/actividades${area ? `?area=${area}` : ''}`, { token }),
    registrar: (token: string, payload: RegistrarActividadPayload) =>
      request<{ actividad: ActividadDetalle; xp_ganado: number }>(
        '/actividades',
        { method: 'POST', body: JSON.stringify(payload), token },
      ),
  },

  cronos: {
    getEvents: (token: string, date: string) =>
      request<CronosEvento[]>(`/cronos/events?date=${date}`, { token }),
    createEvent: (token: string, payload: { titulo: string; tipo?: string; area?: string; inicio_at: string; fin_at: string }) =>
      request<CronosEvento>('/cronos/events', { method: 'POST', body: JSON.stringify(payload), token }),
    completeEvent: (token: string, id: string) =>
      request<{ evento: CronosEvento; xp_ganado?: number; penalizacion?: number }>(
        `/cronos/events/${id}/complete`,
        { method: 'PUT', token },
      ),
    moveEvent: (token: string, id: string, payload: MoverEventoPayload) =>
      request<CronosEvento[]>(`/cronos/events/${id}/move`, { method: 'PUT', body: JSON.stringify(payload), token }),
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
