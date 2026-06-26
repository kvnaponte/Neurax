import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import { useOverlayStore } from '@/store/overlayStore'
import { useGamificationStore } from '@/store/gamificationStore'

const WS_URL = 'http://10.0.2.2:3000'

// Singleton so multiple callers share one connection
let _socket: Socket | null = null

export function getSocket(): Socket | null {
  return _socket
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { accessToken, isAuthenticated } = useAuthStore()
  const { showLevelUp, addXPRise } = useOverlayStore()
  const { setGamification, incrementNotifications } = useGamificationStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketRef.current?.disconnect()
      socketRef.current = null
      _socket = null
      return
    }

    const socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })

    socketRef.current = socket
    _socket = socket

    socket.on('xp:updated', (data: { xp_total: number; nivel: number; xp_delta: number; xp_nivel_actual?: number; xp_siguiente_nivel?: number; xp_hoy?: number }) => {
      setGamification({
        xp_total: data.xp_total,
        nivel: data.nivel,
        ...(data.xp_nivel_actual !== undefined ? { xp_nivel_actual: data.xp_nivel_actual } : {}),
        ...(data.xp_siguiente_nivel !== undefined ? { xp_siguiente_nivel: data.xp_siguiente_nivel } : {}),
        ...(data.xp_hoy !== undefined ? { xp_hoy: data.xp_hoy } : {}),
      })
      if (data.xp_delta > 0) addXPRise(data.xp_delta)
    })

    socket.on('level:up', (data: { nivel: number }) => {
      showLevelUp(data.nivel)
    })

    socket.on('achievement:unlocked', (data: { xp?: number }) => {
      if (data.xp && data.xp > 0) addXPRise(data.xp)
    })

    socket.on('notification:new', () => {
      incrementNotifications()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      _socket = null
    }
  }, [isAuthenticated, accessToken])
}
