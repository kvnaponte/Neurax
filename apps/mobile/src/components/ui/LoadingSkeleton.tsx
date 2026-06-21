import React, { useEffect } from 'react'
import { View } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { duration } from '@/theme'

interface LoadingSkeletonProps {
  width: number | string
  height: number
  radius?: number
}

export function LoadingSkeleton({ width, height, radius = 8 }: LoadingSkeletonProps) {
  const translateX = useSharedValue(-1)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: duration.shimmer }),
      -1,
      false,
    )
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * (typeof width === 'number' ? width : 200) }],
  }))

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: 'rgba(124,58,237,0.08)',
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, animStyle]}>
        <Svg width="100%" height={height}>
          <Defs>
            <LinearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <Stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={height} fill="url(#shimmer)" />
        </Svg>
      </Animated.View>
    </View>
  )
}
