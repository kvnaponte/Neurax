import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, text } from '@/theme'

interface ActivityCardProps {
  tipo: string
  area: keyof typeof colors.areas
  hora: string
  duracion: number
  xp: number
  xpColor?: string
}

export function ActivityCard({ tipo, area, hora, duracion, xp, xpColor }: ActivityCardProps) {
  const areaColor = colors.areas[area] ?? colors.text

  return (
    <View style={styles.card}>
      <View style={[styles.areaTag, { borderColor: areaColor }]}>
        <Text style={[styles.areaText, { color: areaColor }]}>{area.toUpperCase()}</Text>
      </View>
      <Text style={styles.tipo}>{tipo}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{hora} · {duracion}min</Text>
        <Text style={[styles.xp, { color: xpColor ?? colors.gold[200] }]}>+{xp} XP</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20,21,46,0.5)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  areaTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  areaText: {
    ...text.caption,
    letterSpacing: 1,
  },
  tipo: {
    ...text.label,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    ...text.caption,
    color: colors.textDim,
  },
  xp: {
    ...text.label,
    fontWeight: '700',
  },
})
