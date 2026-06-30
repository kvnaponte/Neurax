import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type CalendarioDia } from '@/lib/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Estado visual per day
const ESTADO_CONFIG = {
  completado: { symbol: '✓', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  parcial:    { symbol: '~', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  ninguna:    { symbol: '✗', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  sin_datos:  { symbol: '○', color: colors.textMute, bg: 'transparent' },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Returns 0=Mon...6=Sun for the first day of the month
function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function buildCalendarGrid(
  year: number,
  month: number,
  dias: CalendarioDia[],
): { date: number | null; key: string; estado: CalendarioDia['estado'] | null }[] {
  const diasMap = new Map<string, CalendarioDia['estado']>()
  for (const d of dias) diasMap.set(d.fecha, d.estado)

  const total = getDaysInMonth(year, month)
  const startOffset = getFirstDayOfWeek(year, month)
  const cells: { date: number | null; key: string; estado: CalendarioDia['estado'] | null }[] = []

  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: null, key: `empty-${i}`, estado: null })
  }
  for (let d = 1; d <= total; d++) {
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: d, key: fecha, estado: diasMap.get(fecha) ?? 'sin_datos' })
  }
  return cells
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OdinCalendarScreen() {
  const { accessToken } = useAuthStore()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const { data: dias = [] } = useQuery({
    queryKey: ['odin/calendar', year, month],
    queryFn: () => api.odin.calendario(accessToken!, year, month + 1),
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const cells = buildCalendarGrid(year, month, dias)

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>CALENDARIO DE MISIONES</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Month navigation */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textDim} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MESES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthBtn} activeOpacity={0.7}>
            <ChevronRight size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
            <View key={key} style={styles.legendItem}>
              <Text style={[styles.legendSymbol, { color: cfg.color }]}>{cfg.symbol}</Text>
              <Text style={styles.legendLabel}>{key === 'sin_datos' ? 'Sin datos' : key}</Text>
            </View>
          ))}
        </View>

        {/* Day of week headers */}
        <View style={styles.weekHeader}>
          {DIAS_SEMANA.map((d) => (
            <Text key={d} style={styles.weekHeaderText}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((cell) => {
            if (cell.date === null) {
              return <View key={cell.key} style={styles.cell} />
            }
            const cfg = cell.estado ? ESTADO_CONFIG[cell.estado] : ESTADO_CONFIG.sin_datos
            const isToday = cell.key === todayKey
            return (
              <View
                key={cell.key}
                style={[
                  styles.cell,
                  { backgroundColor: cfg.bg },
                  isToday && styles.cellToday,
                ]}
              >
                <Text style={[styles.cellDate, isToday && styles.cellDateToday]}>
                  {cell.date}
                </Text>
                <Text style={[styles.cellSymbol, { color: cfg.color }]}>{cfg.symbol}</Text>
              </View>
            )
          })}
        </View>

        {/* Summary counts */}
        <View style={styles.summaryRow}>
          {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => {
            const count = dias.filter((d) => d.estado === key).length
            return (
              <View key={key} style={styles.summaryItem}>
                <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                <Text style={styles.summaryLabel}>{cfg.symbol}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },

  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold[100],
    letterSpacing: 1,
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  monthBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,21,46,0.6)',
  },
  monthLabel: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSymbol: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700' },
  legendLabel: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim, textTransform: 'capitalize' },

  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Cinzel-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 2,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.purple[300],
  },
  cellDate: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
  },
  cellDateToday: { color: colors.purple[100], fontWeight: '700' },
  cellSymbol: {
    fontSize: 10,
    fontWeight: '700',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.bg[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { alignItems: 'center', gap: spacing.xs },
  summaryCount: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
  },
})
