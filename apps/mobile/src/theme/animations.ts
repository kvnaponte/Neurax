import { Easing } from 'react-native-reanimated'

export const duration = {
  fadeUp: 800,
  popIn: 600,
  xpRise: 1600,
  dimensionSplit: 4000,
  rayPulse: 2400,
  shimmer: 1500,
} as const

export const easing = {
  fadeUp: Easing.out(Easing.cubic),
  popIn: Easing.out(Easing.back(1.5)),
  xpRise: Easing.bezier(0.25, 0.1, 0.25, 1),
  dimensionSplit: Easing.bezier(0.25, 0.1, 0.25, 1),
  rayPulse: Easing.inOut(Easing.sin),
  shimmer: Easing.linear,
} as const
