import React, { useEffect, useRef, useMemo } from 'react'
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native'

const STAR_COUNT = 100

interface Star {
  x: `${number}%`
  y: `${number}%`
  size: number
  opacity: Animated.Value
  delay: number
}

interface StarFieldProps {
  style?: ViewStyle
}

export function StarField({ style }: StarFieldProps) {
  const animsRef = useRef<Animated.CompositeAnimation[]>([])

  const stars: Star[] = useMemo(() => (
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: `${Math.random() * 100}%` as `${number}%`,
      y: `${Math.random() * 100}%` as `${number}%`,
      size: Math.random() * 2 + 1,
      opacity: new Animated.Value(Math.random() * 0.5 + 0.1),
      delay: Math.random() * 3000,
    }))
  ), [])

  useEffect(() => {
    animsRef.current = stars.map((star) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.4 + 0.05,
            duration: 1500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.5 + 0.2,
            duration: 1500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]),
      )
      anim.start()
      return anim
    })

    return () => {
      animsRef.current.forEach((a: Animated.CompositeAnimation) => a.stop())
    }
  }, [])

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#ffffff',
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  )
}
