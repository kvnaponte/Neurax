import React, { useState } from 'react'
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
import { Eye, EyeOff } from 'lucide-react-native'
import { colors, text as textStyles, spacing } from '@/theme'
import { PrimaryButton, StarField } from '@/components/ui'
import { api, secureStorage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setTokens, setSecretQuestion } = useAuthStore()

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const data = await api.auth.login({ email: email.trim(), password })
      await setTokens(data.access_token, data.refresh_token, data.user)
      setSecretQuestion(data.secret_question)
      router.replace('/(auth)/secret-question')
    } catch (err: any) {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
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
          {/* Logo */}
          <Text style={styles.logo}>NEURAX</Text>

          {/* Tab pills */}
          <View style={styles.tabs}>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Iniciar sesión</Text>
            </View>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.replace('/(auth)/register')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabText}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMute}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Contraseña"
                placeholderTextColor={colors.textMute}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PrimaryButton
              label="Entrar"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/recover')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 28,
    color: colors.gold[200],
    letterSpacing: 4,
    marginBottom: spacing['2xl'],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg[700],
    borderRadius: 24,
    padding: 4,
    marginBottom: spacing['2xl'],
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.purple[300],
  },
  tabText: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 13,
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.text,
  },
  form: {
    width: '100%',
    gap: spacing.md,
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
  forgotBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  forgotText: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 13,
    color: colors.purple[100],
    textDecorationLine: 'underline',
  },
})
