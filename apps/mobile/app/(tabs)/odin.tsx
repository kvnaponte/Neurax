import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  AppState,
  type AppStateStatus,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
  cancelAnimation,
} from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { ChevronRight } from 'lucide-react-native'

import { colors, spacing, duration, easing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { XPBar } from '@/components/ui/XPBar'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { api } from '@/lib/api'
import { getSocket } from '@/hooks/useWebSocket'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

function formatTimer(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function timerColor(secs: number): string {
  if (secs < 1800) return colors.gold[200]
  if (secs < 7200) return '#f97316'
  return colors.text
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OdinScreen() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [seconds, setSeconds] = useState(getSecondsUntilMidnight)
  const [cofreAnimado, setCofreAnimado] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulseOpacity = useSharedValue(1)
  const shimmerOpacity = useSharedValue(0)

  // Timer — always recalculates from real time to avoid drift
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSeconds(getSecondsUntilMidnight())
    intervalRef.current = setInterval(() => {
      setSeconds(getSecondsUntilMidnight())
    }, 1000)
  }, [])

  useEffect(() => {
    startTimer()
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') startTimer()
      else if (intervalRef.current) clearInterval(intervalRef.current)
    })
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      sub.remove()
    }
  }, [startTimer])

  // Pulsing animation when < 30 min remaining
  const isUrgent = seconds < 1800
  useEffect(() => {
    cancelAnimation(pulseOpacity)
    if (isUrgent) {
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: duration.rayPulse / 2, easing: easing.rayPulse }),
        -1,
        true,
      )
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 })
    }
  }, [isUrgent])

  // Shimmer when chest unlocked
  useEffect(() => {
    cancelAnimation(shimmerOpacity)
    if (cofreAnimado) {
      shimmerOpacity.value = withRepeat(
        withTiming(1, { duration: duration.shimmer, easing: easing.shimmer }),
        -1,
        true,
      )
    }
  }, [cofreAnimado])

  // WebSocket: chest unlocked event
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onCofreUnlocked = () => {
      setCofreAnimado(true)
      queryClient.invalidateQueries({ queryKey: ['odin/today'] })
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) } catch {}
    }
    socket.on('cofre:unlocked', onCofreUnlocked)
    return () => { socket.off('cofre:unlocked', onCofreUnlocked) }
  }, [queryClient])

  const { data, isLoading } = useQuery({
    queryKey: ['odin/today'],
    queryFn: () => api.odin.today(accessToken!),
    enabled: !!accessToken,
    staleTime: 30_000,
  })

  const completarMisionMutation = useMutation({
    mutationFn: (misionId: string) => api.odin.completarMision(accessToken!, misionId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['odin/today'] })
      if (res.cofre_desbloqueado) {
        setCofreAnimado(true)
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) } catch {}
      }
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'No se pudo completar la misión')
    },
  })

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }))
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: 0.4 + shimmerOpacity.value * 0.6 }))

  const timerCol = timerColor(seconds)
  const cofreDesbloqueado = cofreAnimado || (data?.cofre_desbloqueado ?? false)
  const todasCompletadas =
    (data?.misiones_secundarias?.every((m) => m.completada) ?? false) &&
    (data?.mision_principal ? data.mision_principal.progreso_actual >= data.mision_principal.objetivo : false)

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>⚔️</Text>
          <View>
            <Text style={styles.headerTitle}>MISIÓN DEL DÍA</Text>
            <Text style={styles.headerSubtitle}>Completa tus misiones y gana XP extra</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>TIEMPO RESTANTE HOY</Text>
          <Animated.Text style={[styles.timerValue, { color: timerCol }, isUrgent && pulseStyle]}>
            {formatTimer(seconds)}
          </Animated.Text>
        </View>

        {/* Main Mission */}
        {isLoading ? (
          <View style={[styles.card, styles.skeleton]} />
        ) : data?.mision_principal ? (
          <View style={styles.card}>
            <Text style={styles.misionNombre}>{data.mision_principal.nombre}</Text>
            <Text style={styles.misionDesc}>{data.mision_principal.descripcion}</Text>
            <View style={styles.progressSection}>
              <XPBar
                xpActual={data.mision_principal.progreso_actual}
                xpSiguiente={data.mision_principal.objetivo}
                height={6}
              />
              <Text style={styles.progressLabel}>
                {data.mision_principal.progreso_actual}/{data.mision_principal.objetivo} completado
              </Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>+{data.mision_principal.xp_reward} XP</Text>
            </View>
          </View>
        ) : !isLoading ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No hay misión principal para hoy</Text>
          </View>
        ) : null}

        {/* Secondary Missions */}
        {(data?.misiones_secundarias?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>MISIONES SECUNDARIAS</Text>
            {data!.misiones_secundarias.map((m, i) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.misionRow,
                  i < data!.misiones_secundarias.length - 1 && styles.misionRowBorder,
                ]}
                onPress={() => !m.completada && completarMisionMutation.mutate(m.id)}
                activeOpacity={m.completada ? 1 : 0.7}
              >
                <View style={[styles.checkbox, m.completada && styles.checkboxDone]}>
                  {m.completada && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.misionRowText, m.completada && styles.misionRowTextDone]}>
                  {m.nombre}
                </Text>
                <Text style={styles.misionRowXP}>+{m.xp_reward} XP</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Epic Chest */}
        <View style={[styles.cofreCard, cofreDesbloqueado && styles.cofreCardUnlocked]}>
          <Animated.Text style={[styles.cofreIcon, cofreDesbloqueado && shimmerStyle]}>
            📦
          </Animated.Text>
          <View style={styles.cofreInfo}>
            {cofreDesbloqueado ? (
              <>
                <Text style={styles.cofreTitleUnlocked}>¡COFRE ÉPICO DESBLOQUEADO!</Text>
                <Text style={styles.cofreXP}>+{data?.cofre_xp ?? 0} XP obtenido</Text>
              </>
            ) : (
              <>
                <Text style={styles.cofreTitleLocked}>COFRE ÉPICO</Text>
                <Text style={styles.cofreSubtitle}>
                  {todasCompletadas ? 'Reclamando...' : 'Completa todas las misiones'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* CTA */}
        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton label="VAMOS A POR ELLO 💪" onPress={() => {}} />
        </View>

        {/* Ver Más */}
        <View style={[styles.card, { marginTop: spacing.lg, gap: 0 }]}>
          <TouchableOpacity
            style={styles.verMasRow}
            onPress={() => router.push('/odin-calendar')}
            activeOpacity={0.7}
          >
            <Text style={styles.verMasText}>Ver calendario de misiones</Text>
            <ChevronRight size={16} color={colors.textDim} />
          </TouchableOpacity>
          <View style={[styles.verMasRow, styles.verMasBorderTop]}>
            <Text style={styles.verMasText}>Super misión semanal</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>0/7</Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: { fontSize: 32 },
  headerTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: colors.gold[100],
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },

  timerCard: {
    backgroundColor: colors.bg[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  timerValue: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 2,
  },

  card: {
    backgroundColor: colors.bg[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  skeleton: { height: 120, opacity: 0.5 },

  sectionLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },

  misionNombre: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: colors.gold[100],
    marginBottom: spacing.xs,
  },
  misionDesc: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
    marginBottom: spacing.md,
  },
  progressSection: { gap: spacing.xs, marginBottom: spacing.md },
  progressLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'right',
  },
  xpBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.gold[400]}30`,
    borderWidth: 1,
    borderColor: `${colors.gold[300]}50`,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  xpBadgeText: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold[200],
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textMute,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  misionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  misionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.1)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,21,46,0.6)',
  },
  checkboxDone: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  checkmark: { fontSize: 12, color: '#22c55e', fontWeight: '700' },
  misionRowText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.text,
  },
  misionRowTextDone: {
    textDecorationLine: 'line-through',
    color: colors.textMute,
  },
  misionRowXP: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold[200],
  },

  cofreCard: {
    backgroundColor: colors.bg[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cofreCardUnlocked: {
    borderColor: `${colors.gold[300]}70`,
    backgroundColor: `${colors.gold[400]}15`,
  },
  cofreIcon: { fontSize: 40 },
  cofreInfo: { flex: 1 },
  cofreTitleLocked: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDim,
  },
  cofreTitleUnlocked: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: colors.gold[200],
  },
  cofreSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textMute,
    marginTop: 2,
  },
  cofreXP: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold[200],
    marginTop: 2,
  },

  verMasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  verMasBorderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(124,58,237,0.1)',
  },
  verMasText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.text,
  },
})
