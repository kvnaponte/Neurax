import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { colors, spacing } from '@/theme'
import { PrimaryButton, StarField } from '@/components/ui'
import { DimensionSplit } from '@/components/animations'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

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

  const handleSubmit = async () => {
    if (!answer.trim() || loading || blocked || isAnimating) return
    setError(null)
    setLoading(true)
    try {
      const data = await api.auth.verifySecret(answer.trim(), accessToken!)
      setAccessToken(data.access_token)
      setIsAnimating(true)
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
    <View style={styles.root}>
      <StarField />

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

      {/* DimensionSplit overlay — mounts on correct answer, navigates on complete */}
      {isAnimating && (
        <DimensionSplit onComplete={() => router.replace('/(tabs)/home')} />
      )}
    </View>
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
