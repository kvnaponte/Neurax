import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Stop, Line } from 'react-native-svg'
import { colors, spacing } from '@/theme'
import { PrimaryButton, StarField } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const MAX_ATTEMPTS = 3
const BLOCK_MINUTES = 15

export default function SecretQuestionScreen() {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [blocked, setBlocked] = useState(false)
  const [countdown, setCountdown] = useState(BLOCK_MINUTES * 60)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // DimensionSplit animation values
  const glowOpacity = useSharedValue(0)
  const glowScale = useSharedValue(0.5)
  const crackOpacity = useSharedValue(0)
  const topHalfY = useSharedValue(0)
  const bottomHalfY = useSharedValue(0)
  const logoOpacity = useSharedValue(0)
  const logoScale = useSharedValue(0.8)
  const screenOpacity = useSharedValue(1)

  const { secretQuestion, accessToken, setAccessToken } = useAuthStore()

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const startBlockCountdown = (seconds: number) => {
    setBlocked(true)
    setCountdown(seconds)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          setBlocked(false)
          setAttemptsLeft(MAX_ATTEMPTS)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const navigateToDashboard = () => {
    router.replace('/(tabs)/home')
  }

  const startDimensionSplit = () => {
    // Phase 1 (0-0.4s): Golden glow pulses
    glowOpacity.value = withTiming(1, { duration: 400 })
    glowScale.value = withTiming(1.5, { duration: 400 })

    // Phase 2 (0.4-1.2s): Crack lines appear
    crackOpacity.value = withDelay(400, withTiming(1, { duration: 300 }))

    // Phase 3 (1.2-2.2s): Screen splits
    topHalfY.value = withDelay(1200, withTiming(-SCREEN_H / 2, { duration: 1000 }))
    bottomHalfY.value = withDelay(1200, withTiming(SCREEN_H / 2, { duration: 1000 }))

    // Phase 4 (2.2-3.2s): NEURAX logo appears with glow
    logoOpacity.value = withDelay(2200, withTiming(1, { duration: 400 }))
    logoScale.value = withDelay(2200, withSequence(
      withTiming(1.2, { duration: 400 }),
      withTiming(1, { duration: 600 }),
    ))

    // Phase 5 (3.2-4.0s): Fade out to dashboard
    screenOpacity.value = withDelay(3200, withTiming(0, { duration: 800 }, (finished) => {
      if (finished) runOnJS(navigateToDashboard)()
    }))
  }

  const handleSubmit = async () => {
    if (!answer.trim() || loading || blocked || isAnimating) return
    setError(null)
    setLoading(true)
    try {
      const data = await api.auth.verifySecret(answer.trim(), accessToken!)
      setAccessToken(data.access_token)
      setIsAnimating(true)
      startDimensionSplit()
    } catch (err: any) {
      if (err.statusCode === 429) {
        const retrySeconds = err.retryAfter ? parseInt(err.retryAfter, 10) : BLOCK_MINUTES * 60
        startBlockCountdown(retrySeconds)
      } else {
        const newAttempts = attemptsLeft - 1
        setAttemptsLeft(newAttempts)
        setError('Respuesta incorrecta')
        if (newAttempts <= 0) {
          startBlockCountdown(BLOCK_MINUTES * 60)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topHalfY.value }],
  }))
  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomHalfY.value }],
  }))
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }))
  const crackStyle = useAnimatedStyle(() => ({
    opacity: crackOpacity.value,
  }))
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))
  const rootStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }))

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (blocked) {
    return (
      <View style={styles.root}>
        <StarField />
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedTitle}>Acceso bloqueado</Text>
          <Text style={styles.blockedSubtitle}>
            Demasiados intentos fallidos.{'\n'}Intenta de nuevo en:
          </Text>
          <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
        </View>
      </View>
    )
  }

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <StarField />

      {/* Split top half */}
      <Animated.View style={[StyleSheet.absoluteFill, topStyle, { overflow: 'hidden', height: SCREEN_H / 2 }]}>
        <View style={[styles.splitBg, { height: SCREEN_H }]} />
      </Animated.View>

      {/* Split bottom half */}
      <Animated.View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H / 2 }, bottomStyle, { overflow: 'hidden' }]}>
        <View style={[styles.splitBg, { height: SCREEN_H, position: 'absolute', bottom: 0, left: 0, right: 0 }]} />
      </Animated.View>

      {/* Golden glow */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

      {/* Crack lines */}
      <Animated.View style={[StyleSheet.absoluteFill, crackStyle]} pointerEvents="none">
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <LinearGradient id="crack1" x1="50%" y1="50%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold[200]} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="crack2" x1="50%" y1="50%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold[200]} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="crack3" x1="50%" y1="50%" x2="30%" y2="100%">
              <Stop offset="0%" stopColor={colors.gold[200]} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="crack4" x1="50%" y1="50%" x2="70%" y2="100%">
              <Stop offset="0%" stopColor={colors.gold[200]} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Line x1={SCREEN_W / 2} y1={SCREEN_H / 2} x2={0} y2={0} stroke="url(#crack1)" strokeWidth={2} />
          <Line x1={SCREEN_W / 2} y1={SCREEN_H / 2} x2={SCREEN_W} y2={0} stroke="url(#crack2)" strokeWidth={2} />
          <Line x1={SCREEN_W / 2} y1={SCREEN_H / 2} x2={SCREEN_W * 0.3} y2={SCREEN_H} stroke="url(#crack3)" strokeWidth={2} />
          <Line x1={SCREEN_W / 2} y1={SCREEN_H / 2} x2={SCREEN_W * 0.7} y2={SCREEN_H} stroke="url(#crack4)" strokeWidth={2} />
        </Svg>
      </Animated.View>

      {/* NEURAX logo (phase 4) */}
      <Animated.View style={[styles.splitLogo, logoStyle]} pointerEvents="none">
        <Text style={styles.splitLogoText}>NEURAX</Text>
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>Verificación de identidad</Text>

        <View style={styles.card}>
          <Text style={styles.question}>
            {secretQuestion ?? 'No es la batalla de la lata, es la del formato'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tu respuesta..."
            placeholderTextColor={colors.textMute}
            value={answer}
            onChangeText={setAnswer}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!isAnimating}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.attempts}>
            {attemptsLeft} {attemptsLeft === 1 ? 'intento restante' : 'intentos restantes'}
          </Text>

          <PrimaryButton
            label="Confirmar identidad"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || isAnimating}
          />
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg[800],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 20,
    color: colors.gold[200],
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.bg[700],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  question: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  input: {
    height: 52,
    backgroundColor: colors.bg[600],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: 'Cinzel-Regular',
    fontSize: 14,
  },
  errorText: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 12,
    color: colors.energia[0],
    textAlign: 'center',
  },
  attempts: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 12,
    color: colors.textMute,
    textAlign: 'center',
  },
  // Split animation layers
  splitBg: {
    backgroundColor: colors.bg[800],
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
    alignSelf: 'center',
    top: SCREEN_H / 2 - 100,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold[200],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 60,
      },
    }),
  },
  splitLogo: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_H / 2 - 30,
    zIndex: 10,
  },
  splitLogoText: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 36,
    color: colors.gold[200],
    letterSpacing: 4,
  },
  // Blocked screen
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  blockedTitle: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 24,
    color: colors.energia[0],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  blockedSubtitle: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 15,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  countdown: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 48,
    color: colors.gold[200],
    letterSpacing: 4,
  },
})
