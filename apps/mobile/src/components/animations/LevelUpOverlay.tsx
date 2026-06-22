import React, { useState } from 'react'
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import Svg, { Line, Defs, LinearGradient, Stop } from 'react-native-svg'
import { colors, spacing } from '@/theme'
import { HexBadge } from '@/components/ui'
import { PrimaryButton } from '@/components/ui'

const { width: W, height: H } = Dimensions.get('window')
const cx = W / 2
const cy = H / 2
const RAY_COUNT = 12
const RAY_LENGTH = Math.max(W, H) * 0.75

interface LevelUpOverlayProps {
  nivel: number
  nombreNivel: string
  colorNivel: string
  onClose: () => void
}

export function LevelUpOverlay({ nivel, nombreNivel, colorNivel, onClose }: LevelUpOverlayProps) {
  // Controls touch events — false until 3s; opacity alone doesn't block touches
  const [btnReady, setBtnReady] = useState(false)

  // Ray rotation (continuous, 8s per revolution)
  const rotation = useSharedValue(0)

  // HexBadge pop-in
  const badgeScale = useSharedValue(0)

  // Glow pulse on badge
  const glowPulse = useSharedValue(0.5)

  // Level name fade-up
  const nameOpacity = useSharedValue(0)
  const nameTranslateY = useSharedValue(20)

  // Button fade in after 3s (visual only — btnReady controls touch)
  const btnOpacity = useSharedValue(0)

  React.useEffect(() => {
    // Continuous ray rotation (8s per full turn)
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false,
    )

    // HexBadge pop-in with spring
    badgeScale.value = withSpring(1, { damping: 15, stiffness: 120 })

    // Glow pulse (2.4s loop)
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.4, { duration: 1200 }),
      ),
      -1,
      false,
    )

    // Level name fadeUp (0.8s)
    nameOpacity.value = withTiming(1, { duration: 800 })
    nameTranslateY.value = withTiming(0, { duration: 800 })

    // Button appears after 3s (visual fade)
    btnOpacity.value = withDelay(3000, withTiming(1, { duration: 400 }))

    // Enable touch events only after 3s
    const timer = setTimeout(() => setBtnReady(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const rayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }))

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }))

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Blur background */}
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />

      {/* Radial color tint from level color */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colorNivel + '22' }]} />

      {/* 12 rotating rays */}
      <Animated.View
        style={[StyleSheet.absoluteFill, rayStyle]}
        pointerEvents="none"
      >
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="rayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colorNivel} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={colorNivel} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {Array.from({ length: RAY_COUNT }, (_, i) => {
            const angle = (i * 360) / RAY_COUNT
            const rad = (angle * Math.PI) / 180
            return (
              <Line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + Math.cos(rad) * RAY_LENGTH}
                y2={cy + Math.sin(rad) * RAY_LENGTH}
                stroke={colorNivel}
                strokeWidth={2}
                strokeOpacity={0.4}
              />
            )
          })}
        </Svg>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Glow ring behind badge */}
        <Animated.View
          style={[styles.glowRing, { borderColor: colorNivel }, glowStyle]}
          pointerEvents="none"
        />

        {/* HexBadge */}
        <Animated.View style={badgeStyle}>
          <HexBadge nivel={nivel as 1 | 2 | 3 | 4 | 5 | 6} size="lg" />
        </Animated.View>

        {/* Level up title */}
        <Text style={styles.levelUpText}>¡NIVEL ALCANZADO!</Text>

        {/* Level name */}
        <Animated.Text style={[styles.levelName, nameStyle]}>
          {nombreNivel}
        </Animated.Text>

        {/* Nivel number */}
        <Text style={[styles.nivelNumber, { color: colorNivel }]}>
          Nivel {nivel}
        </Text>

        {/* Continue button — opacity animates after 3s, touches enabled only when btnReady */}
        <Animated.View
          style={[styles.btnWrap, btnStyle]}
          pointerEvents={btnReady ? 'auto' : 'none'}
        >
          <PrimaryButton
            label="Continuar la aventura"
            onPress={onClose}
          />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
      },
    }),
  },
  levelUpText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    color: colors.gold[300],
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
  },
  levelName: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 28,
    color: colors.gold[200],
    textAlign: 'center',
    letterSpacing: 2,
  },
  nivelNumber: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  btnWrap: {
    width: '100%',
    marginTop: spacing.xl,
  },
})
