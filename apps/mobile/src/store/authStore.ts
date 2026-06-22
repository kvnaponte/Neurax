import { create } from 'zustand'
import { api, secureStorage } from '@/lib/api'

interface User {
  id: string
  nombre: string
  email: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  secretQuestion: string | null
  setTokens: (accessToken: string, refreshToken: string, user: User) => Promise<void>
  setSecretQuestion: (question: string) => void
  setAccessToken: (token: string) => void
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  secretQuestion: null,

  setTokens: async (accessToken, refreshToken, user) => {
    await secureStorage.setTokens(accessToken, refreshToken)
    set({ accessToken, user, isAuthenticated: true })
  },

  setSecretQuestion: (question) => set({ secretQuestion: question }),

  setAccessToken: (token) => set({ accessToken: token }),

  logout: async () => {
    const { accessToken } = get()
    const refreshToken = await secureStorage.getRefreshToken()
    if (refreshToken && accessToken) {
      api.auth.logout(refreshToken, accessToken).catch(() => {})
    }
    await secureStorage.clearTokens()
    set({ user: null, accessToken: null, isAuthenticated: false, secretQuestion: null })
  },

  refresh: async () => {
    const refreshToken = await secureStorage.getRefreshToken()
    if (!refreshToken) return false
    try {
      const data = await api.auth.refresh(refreshToken)
      await secureStorage.setTokens(data.access_token, data.refresh_token)
      set({ accessToken: data.access_token })
      return true
    } catch {
      await secureStorage.clearTokens()
      set({ user: null, accessToken: null, isAuthenticated: false })
      return false
    }
  },
}))
