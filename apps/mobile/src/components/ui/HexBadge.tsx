import React from 'react'
import Svg, { Polygon, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg'
import { colors } from '@/theme'

type Nivel = 1 | 2 | 3 | 4 | 5 | 6
type Size = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<Size, number> = { sm: 40, md: 56, lg: 72 }
const FONT_SIZE_MAP: Record<Size, number> = { sm: 12, md: 16, lg: 20 }

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

interface HexBadgeProps {
  nivel: Nivel
  size?: Size
}

export function HexBadge({ nivel, size = 'md' }: HexBadgeProps) {
  const dim = SIZE_MAP[size]
  const fontSize = FONT_SIZE_MAP[size]
  const cx = dim / 2
  const cy = dim / 2
  const r = dim / 2 - 3
  const color = colors.niveles[nivel]
  const gradId = `hex-grad-${nivel}`

  return (
    <Svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
      <Defs>
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.6} />
        </LinearGradient>
      </Defs>
      <Polygon
        points={hexPoints(cx, cy, r)}
        fill={`url(#${gradId})`}
        stroke={color}
        strokeWidth={1.5}
      />
      <SvgText
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill={colors.text}
        fontFamily="Cinzel-Bold"
      >
        {nivel}
      </SvgText>
    </Svg>
  )
}
