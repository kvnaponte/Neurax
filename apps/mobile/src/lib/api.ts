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

export const api = {
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

    recoverVerify: (body: { userId: string; answer1: string; answer2: string }) =>
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
