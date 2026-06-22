import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { MMKV } from 'react-native-mmkv'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg'
import { Sword } from 'lucide-react-native'
import { colors, text as textStyles, spacing } from '@/theme'
import { PrimaryButton, StarField } from '@/components/ui'

const storage = new MMKV()

const PILLS = ['XP', 'Rachas', 'Sube', 'Logros']

export default function OnboardingScreen() {
  const orbScale = useSharedValue(1)
  const orbOpacity = useSharedValue(0.6)

  useEffect(() => {
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      false,
    )
    orbOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 }),
      ),
      -1,
      false,
    )
  }, [])

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }))

  const handleStart = () => {
    storage.set('onboarding_completed', 'true')
    router.replace('/(auth)/register')
  }

  return (
    <View style={styles.root}>
      {/* Radial gradient background */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="30%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor="#1a0d3d" />
            <Stop offset="100%" stopColor="#07061a" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg)" />
      </Svg>

      <StarField />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pulsing orb */}
        <Animated.View style={[styles.orb, orbStyle]} />

        {/* Logo */}
        <Svg width={280} height={56} style={styles.logoSvg}>
          <Defs>
            <LinearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold[100]} />
              <Stop offset="50%" stopColor={colors.gold[200]} />
              <Stop offset="100%" stopColor={colors.gold[300]} />
            </LinearGradient>
          </Defs>
        </Svg>
        <Text style={styles.logoText}>NEURAX</Text>
        <Text style={styles.sistema}>SISTEMA</Text>

        <Text style={styles.subtitle}>
          Convierte tu vida diaria en{'\n'}una aventura épica
        </Text>

        {/* Pills */}
        <View style={styles.pills}>
          {PILLS.map((pill) => (
            <View key={pill} style={styles.pill}>
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ))}
        </View>

        {/* CTA button */}
        <View style={styles.buttonWrap}>
          <PrimaryButton
            label="Comenzar mi aventura"
            onPress={handleStart}
          />
          <View style={styles.swordIcon} pointerEvents="none">
            <Sword size={20} color={colors.gold[200]} />
          </View>
        </View>

        <Text style={styles.footer}>¡TÚ ELIGES TU LEYENDA!</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07061a',
  },
  content: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
  },
  orb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    marginBottom: spacing['2xl'],
    // Soft glow via shadow
    ...Platform.select({
      ios: {
        shadowColor: colors.purple[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 40,
      },
    }),
  },
  logoSvg: {
    position: 'absolute',
  },
  logoText: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 44,
    fontWeight: '700',
    color: colors.gold[200],
    letterSpacing: 4,
    textAlign: 'center',
  },
  sistema: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: colors.gold[300],
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  subtitle: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 15,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  pill: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderWidth: 1,
    borderColor: colors.gold[300],
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  pillText: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 13,
    color: colors.gold[200],
    letterSpacing: 1,
  },
  buttonWrap: {
    width: '100%',
    position: 'relative',
    marginBottom: spacing['2xl'],
  },
  swordIcon: {
    position: 'absolute',
    left: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  footer: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: colors.textMute,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
})
