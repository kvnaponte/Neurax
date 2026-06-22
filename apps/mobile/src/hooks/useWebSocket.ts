import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import { useOverlayStore } from '@/store/overlayStore'

// Same host as API, without the /api path
const WS_URL = 'http://10.0.2.2:3000'

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { accessToken, isAuthenticated } = useAuthStore()
  const { showLevelUp, addXPRise } = useOverlayStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('level:up', (data: { nivel: number }) => {
      showLevelUp(data.nivel)
    })

    socket.on('xp:updated', (data: { delta: number }) => {
      if (data.delta > 0) addXPRise(data.delta)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, accessToken])
}
