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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react-native'
import { colors, spacing } from '@/theme'
import { PrimaryButton, StarField } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .max(50, 'Máximo 50 caracteres'),
    email: z.string().email('Email no válido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { setTokens } = useAuthStore()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null)
    try {
      const res = await api.auth.register({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
      })
      await setTokens(res.access_token, res.refresh_token, res.user)
      router.replace('/(tabs)/home')
    } catch (err: any) {
      setServerError(err.message ?? 'Error al crear la cuenta')
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
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Crear cuenta</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="nombre"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    style={[styles.input, errors.nombre && styles.inputError]}
                    placeholder="Nombre del héroe"
                    placeholderTextColor={colors.textMute}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  {errors.nombre && (
                    <Text style={styles.fieldError}>{errors.nombre.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Email"
                    placeholderTextColor={colors.textMute}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  {errors.email && (
                    <Text style={styles.fieldError}>{errors.email.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Contraseña"
                      placeholderTextColor={colors.textMute}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
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
                  {errors.password && (
                    <Text style={styles.fieldError}>{errors.password.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirmar contraseña"
                      placeholderTextColor={colors.textMute}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showConfirm}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
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
                  {errors.confirmPassword && (
                    <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>
                  )}
                </View>
              )}
            />

            {serverError && <Text style={styles.serverError}>{serverError}</Text>}

            <PrimaryButton
              label="Crear cuenta"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
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
    gap: spacing.xs,
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
  inputError: {
    borderColor: colors.energia[0],
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
  fieldError: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: colors.energia[0],
    marginTop: 4,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  serverError: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 12,
    color: colors.energia[0],
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
})
