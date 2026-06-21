import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { colors, text as textStyles } from '@/theme'

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  label: string
  loading?: boolean
}

export function PrimaryButton({ label, loading = false, disabled, ...rest }: PrimaryButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {/* gradient background via SVG */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="btn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.purple[300]} />
            <Stop offset="100%" stopColor={colors.purple[200]} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0} y={0} width="100%" height="100%"
          fill="url(#btn-grad)"
          rx={14}
          opacity={isDisabled ? 0.4 : 1}
        />
      </Svg>

      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...textStyles.label,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.5,
  },
})
