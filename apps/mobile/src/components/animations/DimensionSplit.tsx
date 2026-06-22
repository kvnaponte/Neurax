import React from 'react'
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Stop, Line } from 'react-native-svg'
import { colors } from '@/theme'
import { StarField } from '@/components/ui'

const AnimatedLine = Animated.createAnimatedComponent(Line)

const { width: W, height: H } = Dimensions.get('window')
const cx = W / 2
const cy = H / 2

interface DimensionSplitProps {
  onComplete: () => void
}

export function DimensionSplit({ onComplete }: DimensionSplitProps) {
  // Phase 1 — central flash
  const flashOpacity = useSharedValue(0)
  const flashScale = useSharedValue(1)

  // Phase 2 — crack lines extend from center (0 = start at center, 1 = full length)
  const crackProgress = useSharedValue(0)
  const crackOpacity = useSharedValue(0)

  // Phase 3 — panels slide apart
  const leftX = useSharedValue(0)
  const rightX = useSharedValue(0)

  // Phase 4 — NEURAX logo
  const logoScale = useSharedValue(0)
  const logoOpacity = useSharedValue(0)
  const logoBreathe = useSharedValue(1)

  // Phase 5 — fade out whole overlay
  const rootOpacity = useSharedValue(1)

  // Crack animated props — each line extends from center to its target
  const crack1Props = useAnimatedProps(() => ({
    x2: cx + (0 - cx) * crackProgress.value,
    y2: cy + (0 - cy) * crackProgress.value,
  }))
  const crack2Props = useAnimatedProps(() => ({
    x2: cx + (W - cx) * crackProgress.value,
    y2: cy + (0 - cy) * crackProgress.value,
  }))
  const crack3Props = useAnimatedProps(() => ({
    x2: cx + (W * 0.25 - cx) * crackProgress.value,
    y2: cy + (H - cy) * crackProgress.value,
  }))
  const crack4Props = useAnimatedProps(() => ({
    x2: cx + (W * 0.75 - cx) * crackProgress.value,
    y2: cy + (H - cy) * crackProgress.value,
  }))

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }))
  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
  }))
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }],
  }))
  const crackContainerStyle = useAnimatedStyle(() => ({
    opacity: crackOpacity.value,
  }))
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * logoBreathe.value }],
  }))
  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
  }))

  React.useEffect(() => {
    // Phase 1 (0–0.4s): central flash
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.6, { duration: 200 }),
    )
    flashScale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withTiming(1, { duration: 200 }),
    )

    // Phase 2 (0.4–1.2s): crack lines
    crackOpacity.value = withDelay(400, withTiming(1, { duration: 100 }))
    crackProgress.value = withDelay(400, withTiming(1, { duration: 800 }))

    // Phase 3 (1.2–2.2s): panels slide apart
    leftX.value = withDelay(1200, withTiming(-W / 2, { duration: 1000 }))
    rightX.value = withDelay(1200, withTiming(W / 2, { duration: 1000 }))

    // Phase 4 (2.2–3.2s): NEURAX logo with spring + breathing loop
    logoOpacity.value = withDelay(2200, withTiming(1, { duration: 300 }))
    logoScale.value = withDelay(2200, withSpring(1, { damping: 15, stiffness: 120 }))
    logoBreathe.value = withDelay(2500, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      false,
    ))

    // Phase 5 (3.2–4.0s): fade out overlay, call onComplete
    rootOpacity.value = withDelay(3200, withTiming(0, { duration: 800 }, (finished) => {
      if (finished) runOnJS(onComplete)()
    }))
  }, [])

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <StarField />

      {/* Left panel */}
      <Animated.View style={[styles.leftPanel, leftStyle]} />

      {/* Right panel */}
      <Animated.View style={[styles.rightPanel, rightStyle]} />

      {/* Central flash */}
      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

      {/* Crack lines */}
      <Animated.View style={[StyleSheet.absoluteFill, crackContainerStyle]} pointerEvents="none">
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="cg1" x1="50%" y1="50%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold[300]} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="cg2" x1="50%" y1="50%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gold[300]} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="cg3" x1="50%" y1="50%" x2="25%" y2="100%">
              <Stop offset="0%" stopColor={colors.gold[300]} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="cg4" x1="50%" y1="50%" x2="75%" y2="100%">
              <Stop offset="0%" stopColor={colors.gold[300]} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.purple[300]} stopOpacity="0.3" />
            </LinearGradient>
          </Defs>
          <AnimatedLine x1={cx} y1={cy} stroke="url(#cg1)" strokeWidth={3} animatedProps={crack1Props} />
          <AnimatedLine x1={cx} y1={cy} stroke="url(#cg2)" strokeWidth={3} animatedProps={crack2Props} />
          <AnimatedLine x1={cx} y1={cy} stroke="url(#cg3)" strokeWidth={2} animatedProps={crack3Props} />
          <AnimatedLine x1={cx} y1={cy} stroke="url(#cg4)" strokeWidth={2} animatedProps={crack4Props} />
        </Svg>
      </Animated.View>

      {/* NEURAX logo with 3-layer glow */}
      <Animated.View style={[styles.logoWrap, logoStyle]} pointerEvents="none">
        <View style={styles.glowLayer3} />
        <View style={styles.glowLayer2} />
        <View style={styles.glowLayer1} />
        <Text style={styles.logoText}>NEURAX</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  leftPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: W / 2,
    height: H,
    backgroundColor: colors.bg[800],
  },
  rightPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: W / 2,
    height: H,
    backgroundColor: colors.bg[800],
  },
  flash: {
    position: 'absolute',
    alignSelf: 'center',
    top: H / 2 - 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold[200],
    ...Platform.select({
      ios: {
        shadowColor: colors.gold[200],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 40,
      },
    }),
  },
  logoWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: H / 2 - 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer1: {
    position: 'absolute',
    width: 280,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: colors.purple[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
    }),
  },
  glowLayer2: {
    position: 'absolute',
    width: 320,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: colors.purple[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
    }),
  },
  glowLayer3: {
    position: 'absolute',
    width: 360,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  logoText: {
    fontFamily: 'CinzelDecorative-Regular',
    fontSize: 36,
    color: colors.gold[200],
    letterSpacing: 6,
  },
})
