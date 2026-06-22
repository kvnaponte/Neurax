import React, { useEffect } from 'react'
import { StyleSheet, Text, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { colors } from '@/theme'

const { width: W, height: H } = Dimensions.get('window')

interface XPRiseProps {
  xp: number
  onComplete: () => void
}

export function XPRise({ xp, onComplete }: XPRiseProps) {
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    translateY.value = withTiming(-80, { duration: 1600 })
    opacity.value = withTiming(0, { duration: 1600 }, (finished) => {
      if (finished) runOnJS(onComplete)()
    })
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.root, animStyle]} pointerEvents="none">
      <Text style={styles.text}>+{xp} XP</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    alignSelf: 'center',
    top: H / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  text: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 20,
    color: colors.gold[200],
    letterSpacing: 2,
  },
})
