import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { colors, duration } from '@/theme'

interface XPBarProps {
  xpActual: number
  xpSiguiente: number
  height?: number
}

export function XPBar({ xpActual, xpSiguiente, height = 9 }: XPBarProps) {
  const pct = Math.min(1, Math.max(0, xpSiguiente > 0 ? xpActual / xpSiguiente : 0))
  const widthPct = useSharedValue(pct)

  useEffect(() => {
    widthPct.value = withTiming(pct, { duration: duration.fadeUp })
  }, [pct])

  const animStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value * 100}%` as `${number}%`,
  }))

  return (
    <View style={[styles.track, { height, borderRadius: 999 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle, { borderRadius: 999, overflow: 'hidden' }]}>
        <Svg width="100%" height={height}>
          <Defs>
            <LinearGradient id="xp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.purple[300]} />
              <Stop offset="100%" stopColor={colors.gold[200]} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={height} fill="url(#xp-grad)" rx={999} />
        </Svg>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    overflow: 'hidden',
  },
})
