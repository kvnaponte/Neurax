import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native'
import { colors, spacing } from '@/theme'
import { PrimaryButton, StarField } from '@/components/ui'
import { api } from '@/lib/api'

// Backend verifyRecovery requires both answers at once.
// We collect them in two sequential steps, then submit both together.

type Step = 'email' | 'question1' | 'question2' | 'newPassword' | 'success'

const BLOCK_MINUTES = 30

export default function RecoverScreen() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [answer1, setAnswer1] = useState('')
  const [answer2, setAnswer2] = useState('')
  const [recoveryToken, setRecoveryToken] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState(2)
  const [blocked, setBlocked] = useState(false)
  const [countdown, setCountdown] = useState(BLOCK_MINUTES * 60)

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startBlockCountdown = () => {
    setBlocked(true)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setBlocked(false)
          setAttemptsLeft(2)
          setStep('email')
          setAnswer1('')
          setAnswer2('')
          return BLOCK_MINUTES * 60
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleEmailNext = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un email válido')
      return
    }
    setError(null)
    setStep('question1')
  }

  const handleQuestion1Next = () => {
    if (!answer1.trim()) {
      setError('Ingresa tu respuesta')
      return
    }
    setError(null)
    setStep('question2')
  }

  const handleVerify = async () => {
    if (!answer2.trim()) {
      setError('Ingresa tu respuesta')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const data = await api.auth.recoverVerify({
        email: email.trim().toLowerCase(),
        answer1: answer1.trim(),
        answer2: answer2.trim(),
      })
      setRecoveryToken(data.recovery_token)
      setStep('newPassword')
    } catch (err: any) {
      const newAttempts = attemptsLeft - 1
      setAttemptsLeft(newAttempts)
      if (newAttempts <= 0 || err.statusCode === 429) {
        startBlockCountdown()
      } else {
        setError('Respuestas incorrectas')
        setStep('question1')
        setAnswer1('')
        setAnswer2('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Mínimo 8 caracteres, una mayúscula y un número')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await api.auth.recoverReset(newPassword, recoveryToken)
      setStep('success')
    } catch (err: any) {
      setError(err.message ?? 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const stepNumber = step === 'email' ? 0 : step === 'question1' ? 1 : step === 'question2' ? 2 : 3
  const totalSteps = 3

  if (blocked) {
    return (
      <View style={styles.root}>
        <StarField />
        <View style={styles.centered}>
          <Text style={styles.blockedTitle}>Acceso bloqueado</Text>
          <Text style={styles.subtitle}>
            Demasiados intentos fallidos.{'\n'}Intenta de nuevo en:
          </Text>
          <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
        </View>
      </View>
    )
  }

  if (step === 'success') {
    return (
      <View style={styles.root}>
        <StarField />
        <View style={styles.centered}>
          <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
          <Text style={styles.subtitle}>
            Tu contraseña ha sido cambiada exitosamente.
          </Text>
          <View style={{ width: '100%', marginTop: spacing['2xl'] }}>
            <PrimaryButton
              label="Ir a iniciar sesión"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StarField />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (step === 'email') {
                router.back()
              } else if (step === 'question1') {
                setError(null)
                setStep('email')
              } else if (step === 'question2') {
                setError(null)
                setStep('question1')
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={colors.gold[200]} />
          </TouchableOpacity>

          <Text style={styles.logo}>NEURAX</Text>
          <Text style={styles.pageTitle}>Recuperar acceso</Text>

          {/* Progress indicator */}
          {stepNumber > 0 && (
            <View style={styles.progressRow}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.progressDot, i < stepNumber && styles.progressDotActive]}
                />
              ))}
            </View>
          )}

          {step === 'email' && (
            <View style={styles.form}>
              <Text style={styles.hint}>
                Ingresa el email de tu cuenta para continuar con la recuperación.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={colors.textMute}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleEmailNext}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <PrimaryButton label="Continuar" onPress={handleEmailNext} />
            </View>
          )}

          {step === 'question1' && (
            <View style={styles.form}>
              <Text style={styles.stepLabel}>Pregunta 1 de 2</Text>

              <View style={styles.questionBox}>
                <Text style={styles.question}>
                  Aunque pierda está gente se va llena de orgullo
                </Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Tu respuesta..."
                placeholderTextColor={colors.textMute}
                value={answer1}
                onChangeText={setAnswer1}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleQuestion1Next}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Text style={styles.attemptsText}>
                {attemptsLeft} {attemptsLeft === 1 ? 'intento restante' : 'intentos restantes'}
              </Text>

              <PrimaryButton label="Siguiente" onPress={handleQuestion1Next} />
            </View>
          )}

          {step === 'question2' && (
            <View style={styles.form}>
              <Text style={styles.stepLabel}>Pregunta 2 de 2</Text>

              <View style={styles.questionBox}>
                <Text style={styles.question}>
                  Tu no eres un lobo
                </Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Tu respuesta..."
                placeholderTextColor={colors.textMute}
                value={answer2}
                onChangeText={setAnswer2}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <PrimaryButton
                label="Verificar identidad"
                onPress={handleVerify}
                loading={loading}
                disabled={loading}
              />
            </View>
          )}

          {step === 'newPassword' && (
            <View style={styles.form}>
              <Text style={styles.stepLabel}>Nueva contraseña</Text>

              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={colors.textMute}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword
                    ? <EyeOff size={20} color={colors.textDim} />
                    : <Eye size={20} color={colors.textDim} />
                  }
                </TouchableOpacity>
              </View>

              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor={colors.textMute}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showConfirm
                    ? <EyeOff size={20} color={colors.textDim} />
                    : <Eye size={20} color={colors.textDim} />
                  }
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <PrimaryButton
                label="Cambiar contraseña"
                onPress={handleReset}
                loading={loading}
                disabled={loading}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg[800],
  },
  kav: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  logo: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 28,
    color: colors.gold[200],
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  pageTitle: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 14,
    color: colors.textDim,
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg[600],
  },
  progressDotActive: {
    backgroundColor: colors.purple[300],
  },
  form: {
    width: '100%',
    gap: spacing.md,
  },
  hint: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 12,
    color: colors.purple[100],
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  questionBox: {
    backgroundColor: colors.bg[700],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: spacing.lg,
  },
  question: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.bg[700],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: 'Cinzel-Regular',
    fontSize: 14,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 12,
    color: colors.energia[0],
    textAlign: 'center',
  },
  attemptsText: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 12,
    color: colors.textMute,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  blockedTitle: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 22,
    color: colors.energia[0],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  successTitle: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 22,
    color: colors.gold[200],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
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
