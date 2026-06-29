import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Check, List, Clock } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type CronosEvento, type MoverEventoPayload } from '@/lib/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width
const PIXELS_PER_HOUR = 64
const START_HOUR = 6  // 6:00 AM
const END_HOUR = 23   // 11:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TIMELINE_HEIGHT = TOTAL_HOURS * PIXELS_PER_HOUR
const HOUR_LABEL_WIDTH = 46
const ENERGY_COL_WIDTH = 8

const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatNavDate(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES_CORTO[d.getMonth()]}`
}

function isToday(d: Date): boolean {
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function getEventTop(inicio_at: string): number {
  const d = new Date(inicio_at)
  const hours = d.getHours() + d.getMinutes() / 60
  return Math.max(0, (hours - START_HOUR) * PIXELS_PER_HOUR)
}

function getEventHeight(inicio_at: string, fin_at: string): number {
  const start = new Date(inicio_at)
  const end = new Date(fin_at)
  const durationHours = (end.getTime() - start.getTime()) / 3_600_000
  return Math.max(32, durationHours * PIXELS_PER_HOUR)
}

function getNowLineTop(): number {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  return (hours - START_HOUR) * PIXELS_PER_HOUR
}

function formatHourMinute(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function energyColorAtHour(hour: number): string {
  if (hour >= 5 && hour < 9) return colors.energia[100]
  if (hour >= 9 && hour < 13) return colors.energia[75]
  if (hour >= 13 && hour < 17) return colors.energia[50]
  if (hour >= 17 && hour < 21) return colors.energia[25]
  return colors.energia[0]
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EventCard({
  evento,
  onLongPress,
  onComplete,
  onTap,
  isDragged,
}: {
  evento: CronosEvento
  onLongPress: () => void
  onComplete: () => void
  onTap: () => void
  isDragged: boolean
}) {
  const top = getEventTop(evento.inicio_at)
  const height = getEventHeight(evento.inicio_at, evento.fin_at)
  const areaColor = evento.area ? colors.areas[evento.area] : colors.purple[200]

  const scale = useSharedValue(isDragged ? 1.05 : 1)
  useEffect(() => {
    scale.value = withSpring(isDragged ? 1.05 : 1, { damping: 15 })
  }, [isDragged])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: isDragged ? 20 : 1,
    shadowOpacity: isDragged ? 0.4 : 0.1,
  }))

  return (
    <Animated.View
      style={[
        styles.eventCard,
        {
          top,
          height,
          borderLeftColor: areaColor,
          opacity: evento.completado ? 0.6 : 1,
        },
        animStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.eventCardInner}
        delayLongPress={500}
        onLongPress={onLongPress}
        onPress={onTap}
        activeOpacity={0.8}
      >
        <View style={styles.eventTopRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {evento.titulo}
          </Text>
          {evento.completado && <Check size={12} color={colors.textDim} />}
        </View>
        <Text style={styles.eventTime}>
          {formatHourMinute(evento.inicio_at)} – {formatHourMinute(evento.fin_at)}
        </Text>
        {evento.xp != null && evento.xp > 0 && (
          <Text style={styles.eventXP}>+{evento.xp} XP</Text>
        )}
      </TouchableOpacity>

      {!evento.completado && (
        <TouchableOpacity style={styles.checkBtn} onPress={onComplete} activeOpacity={0.7}>
          <View style={[styles.checkCircle, { borderColor: areaColor }]} />
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

function EnergyColumn() {
  const segments: JSX.Element[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    segments.push(
      <View
        key={h}
        style={{
          height: PIXELS_PER_HOUR,
          width: ENERGY_COL_WIDTH,
          backgroundColor: energyColorAtHour(h),
        }}
      />,
    )
  }
  return <View style={styles.energyCol}>{segments}</View>
}

function HourLabels() {
  const labels: JSX.Element[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    labels.push(
      <View key={h} style={[styles.hourLabel, { top: (h - START_HOUR) * PIXELS_PER_HOUR - 8 }]}>
        <Text style={styles.hourText}>{String(h).padStart(2, '0')}:00</Text>
      </View>,
    )
  }
  return <View style={styles.hourLabelsContainer}>{labels}</View>
}

// ─── Add event modal ──────────────────────────────────────────────────────────

function AddEventModal({
  visible,
  onClose,
  defaultHora,
  onCreated,
  token,
}: {
  visible: boolean
  onClose: () => void
  defaultHora: string
  onCreated: () => void
  token: string
}) {
  const [titulo, setTitulo] = useState('')
  const [duracion, setDuracion] = useState(60)

  const createMutation = useMutation({
    mutationFn: async () => {
      const [h, m] = defaultHora.split(':').map(Number)
      const today = new Date()
      const inicio = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m)
      const fin = new Date(inicio.getTime() + duracion * 60_000)
      return api.cronos.createEvent(token, {
        titulo,
        inicio_at: inicio.toISOString(),
        fin_at: fin.toISOString(),
      })
    },
    onSuccess: () => {
      onCreated()
      setTitulo('')
      setDuracion(60)
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo crear el evento'),
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.addModal}>
        <View style={styles.handle} />
        <Text style={styles.modalTitle}>Nuevo evento en {defaultHora}</Text>

        <Text style={styles.modalLabel}>TÍTULO</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Ej. Entrenamiento, Estudio..."
          placeholderTextColor={colors.textMute}
          value={titulo}
          onChangeText={setTitulo}
          autoFocus
        />

        <Text style={styles.modalLabel}>DURACIÓN</Text>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setDuracion((d) => Math.max(15, d - 15))}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepValue}>{duracion} min</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setDuracion((d) => Math.min(480, d + 15))}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, (!titulo || createMutation.isPending) && styles.disabledBtn]}
          onPress={() => titulo && createMutation.mutate()}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {createMutation.isPending ? 'Creando...' : 'Agregar evento'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Conflict modal ──────────────────────────────────────────────────────────

type ConflictOption = 'reemplazar' | 'deslizar' | 'intercambiar'

function ConflictModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (opt: ConflictOption) => void
}) {
  const OPTIONS: { id: ConflictOption; label: string; desc: string }[] = [
    { id: 'reemplazar', label: 'Reemplazar', desc: 'Eliminar el evento destino y mover aquí' },
    { id: 'deslizar', label: 'Deslizar', desc: 'Mover todos los eventos posteriores hacia adelante' },
    { id: 'intercambiar', label: 'Intercambiar', desc: 'Intercambiar posiciones entre ambos eventos' },
  ]
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.conflictModal}>
        <Text style={styles.modalTitle}>Conflicto de horario</Text>
        <Text style={styles.conflictSubtitle}>Hay un evento en ese horario. ¿Cómo deseas resolver?</Text>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.conflictOption}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.conflictOptionLabel}>{opt.label}</Text>
            <Text style={styles.conflictOptionDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CronosScreen() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const scrollRef = useRef<ScrollView>(null)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'dia' | 'lista'>('dia')
  const [nowTop, setNowTop] = useState(getNowLineTop())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [conflictVisible, setConflictVisible] = useState(false)
  const [pendingMove, setPendingMove] = useState<{ targetHour: number } | null>(null)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [addHora, setAddHora] = useState('09:00')

  const dateStr = dateToStr(currentDate)
  const today = isToday(currentDate)

  const { data: eventos = [], refetch } = useQuery({
    queryKey: ['cronos/events', dateStr],
    queryFn: () => api.cronos.getEvents(accessToken!, dateStr),
    staleTime: 30_000,
    enabled: !!accessToken,
  })

  // Update "now" line every minute
  useEffect(() => {
    const interval = setInterval(() => setNowTop(getNowLineTop()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (today && scrollRef.current) {
        const scrollTo = Math.max(0, nowTop - 120)
        scrollRef.current.scrollTo({ y: scrollTo, animated: true })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [today, nowTop])

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.cronos.completeEvent(accessToken!, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronos/events', dateStr] })
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo completar el evento'),
  })

  const moveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: MoverEventoPayload }) => {
      return api.cronos.moveEvent(accessToken!, id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronos/events', dateStr] })
      setDraggedId(null)
      setPendingMove(null)
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo mover el evento'),
  })

  function handleLongPress(evento: CronosEvento) {
    Vibration.vibrate(80)
    setDraggedId(evento.id)
  }

  function handleSlotTap(hour: number) {
    if (draggedId) {
      const hasConflict = eventos.some((ev) => {
        if (ev.id === draggedId) return false
        const evStart = new Date(ev.inicio_at).getHours()
        const evEnd = new Date(ev.fin_at).getHours()
        return hour >= evStart && hour < evEnd
      })
      if (hasConflict) {
        setPendingMove({ targetHour: hour })
        setConflictVisible(true)
      } else {
        const dragged = eventos.find((e) => e.id === draggedId)
        if (!dragged) { setDraggedId(null); return }
        const durationMs = new Date(dragged.fin_at).getTime() - new Date(dragged.inicio_at).getTime()
        const today2 = new Date(currentDate)
        const newStart = new Date(today2.getFullYear(), today2.getMonth(), today2.getDate(), hour, 0)
        const newEnd = new Date(newStart.getTime() + durationMs)
        moveMutation.mutate({
          id: draggedId,
          payload: { inicio_at: newStart.toISOString(), fin_at: newEnd.toISOString() },
        })
      }
    } else {
      setAddHora(`${String(hour).padStart(2, '0')}:00`)
      setAddModalVisible(true)
    }
  }

  function handleConflictSelect(opt: ConflictOption) {
    setConflictVisible(false)
    if (!draggedId || !pendingMove) return
    const dragged = eventos.find((e) => e.id === draggedId)
    if (!dragged) return
    const durationMs = new Date(dragged.fin_at).getTime() - new Date(dragged.inicio_at).getTime()
    const today2 = new Date(currentDate)
    const newStart = new Date(today2.getFullYear(), today2.getMonth(), today2.getDate(), pendingMove.targetHour, 0)
    const newEnd = new Date(newStart.getTime() + durationMs)

    const conflictoEvento = eventos.find((ev) => {
      if (ev.id === draggedId) return false
      const evStart = new Date(ev.inicio_at).getHours()
      const evEnd = new Date(ev.fin_at).getHours()
      return pendingMove.targetHour >= evStart && pendingMove.targetHour < evEnd
    })

    moveMutation.mutate({
      id: draggedId,
      payload: {
        inicio_at: newStart.toISOString(),
        fin_at: newEnd.toISOString(),
        resolucion: opt,
        conflicto_id: conflictoEvento?.id,
      },
    })
  }

  function handleComplete(evento: CronosEvento) {
    const now = new Date()
    const fin = new Date(evento.fin_at)
    const lateMs = now.getTime() - fin.getTime()
    const lateMin = Math.floor(lateMs / 60_000)

    if (lateMin >= 15) {
      Alert.alert(
        'Completando tarde',
        `⚠️ Completando con ${lateMin}min de retraso — se aplicará -15% XP`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => completeMutation.mutate(evento.id) },
        ],
      )
    } else {
      completeMutation.mutate(evento.id)
    }
  }

  function handleEventTap(evento: CronosEvento) {
    if (draggedId === evento.id) {
      setDraggedId(null)
    }
  }

  function navigateDate(delta: number) {
    setDraggedId(null)
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(d)
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CRONNOS</Text>
        <View style={styles.headerRight}>
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color={colors.textDim} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{today ? 'Hoy' : formatNavDate(currentDate)}</Text>
            <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronRight size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, viewMode === 'lista' && styles.headerBtnActive]}
            onPress={() => setViewMode(viewMode === 'dia' ? 'lista' : 'dia')}
            activeOpacity={0.7}
          >
            {viewMode === 'dia' ? (
              <List size={18} color={colors.textDim} />
            ) : (
              <Clock size={18} color={colors.purple[100]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Drag mode banner */}
      {draggedId && (
        <Pressable style={styles.dragBanner} onPress={() => setDraggedId(null)}>
          <Text style={styles.dragBannerText}>
            Toca un horario para mover · Toca aquí para cancelar
          </Text>
        </Pressable>
      )}

      {/* Day view */}
      {viewMode === 'dia' ? (
        <ScrollView
          ref={scrollRef}
          style={styles.timeline}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ height: TIMELINE_HEIGHT + 40, paddingBottom: 40 }}
        >
          <View style={styles.timelineRow}>
            {/* Hour labels */}
            <View style={{ width: HOUR_LABEL_WIDTH }}>
              <HourLabels />
            </View>

            {/* Energy column */}
            <EnergyColumn />

            {/* Events area */}
            <View style={styles.eventsArea}>
              {/* Slot tap zones */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR).map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.slotZone, { top: (hour - START_HOUR) * PIXELS_PER_HOUR }]}
                  onPress={() => handleSlotTap(hour)}
                  activeOpacity={draggedId ? 0.3 : 0.05}
                >
                  <View style={styles.slotLine} />
                </TouchableOpacity>
              ))}

              {/* Event cards */}
              {eventos.map((ev) => (
                <EventCard
                  key={ev.id}
                  evento={ev}
                  isDragged={draggedId === ev.id}
                  onLongPress={() => handleLongPress(ev)}
                  onComplete={() => handleComplete(ev)}
                  onTap={() => handleEventTap(ev)}
                />
              ))}

              {/* Now line */}
              {today && (
                <View style={[styles.nowLine, { top: nowTop }]}>
                  <View style={styles.nowDot} />
                  <View style={styles.nowLineFill} />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* List view */
        <FlatList
          data={[...eventos].sort(
            (a, b) => new Date(a.inicio_at).getTime() - new Date(b.inicio_at).getTime(),
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Clock size={40} color={colors.textMute} />
              <Text style={styles.emptyText}>No hay eventos para este día</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.addFirstBtnText}>Agregar evento</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const areaColor = item.area ? colors.areas[item.area] : colors.purple[200]
            return (
              <View style={[styles.listCard, { borderLeftColor: areaColor, opacity: item.completado ? 0.6 : 1 }]}>
                <View style={styles.listCardLeft}>
                  <Text style={styles.listCardTime}>
                    {formatHourMinute(item.inicio_at)} – {formatHourMinute(item.fin_at)}
                  </Text>
                  <Text style={styles.listCardTitle}>{item.titulo}</Text>
                  {item.xp != null && item.xp > 0 && (
                    <Text style={styles.listCardXP}>+{item.xp} XP</Text>
                  )}
                </View>
                {!item.completado && (
                  <TouchableOpacity
                    style={[styles.listCheckCircle, { borderColor: areaColor }]}
                    onPress={() => handleComplete(item)}
                    activeOpacity={0.7}
                  />
                )}
                {item.completado && <Check size={20} color={colors.textDim} />}
              </View>
            )
          }}
        />
      )}

      {/* Add event modal */}
      <AddEventModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        defaultHora={addHora}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['cronos/events', dateStr] })}
        token={accessToken ?? ''}
      />

      {/* Conflict modal */}
      <ConflictModal
        visible={conflictVisible}
        onClose={() => { setConflictVisible(false); setDraggedId(null) }}
        onSelect={handleConflictSelect}
      />
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg[800],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.15)',
  },
  headerTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navBtn: {
    padding: 4,
  },
  dateText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
    minWidth: 80,
    textAlign: 'center',
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: {
    borderColor: colors.purple[300],
    backgroundColor: `${colors.purple[300]}20`,
  },

  // Drag banner
  dragBanner: {
    backgroundColor: `${colors.purple[300]}20`,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.purple[300]}40`,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  dragBannerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.purple[100],
  },

  // Timeline
  timeline: {
    flex: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
  },

  // Hour labels
  hourLabelsContainer: {
    position: 'relative',
    height: TIMELINE_HEIGHT,
  },
  hourLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  hourText: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: colors.textMute,
  },

  // Energy column
  energyCol: {
    width: ENERGY_COL_WIDTH,
    marginHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Events area
  eventsArea: {
    flex: 1,
    position: 'relative',
    height: TIMELINE_HEIGHT,
    marginLeft: 4,
  },

  // Slot zones
  slotZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: PIXELS_PER_HOUR,
    justifyContent: 'flex-end',
  },
  slotLine: {
    height: 1,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },

  // Event cards
  eventCard: {
    position: 'absolute',
    left: 4,
    right: 8,
    borderLeftWidth: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(20,21,46,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  eventCardInner: {
    flex: 1,
    padding: spacing.sm,
    gap: 2,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  eventTime: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: colors.textDim,
  },
  eventXP: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 9,
    color: colors.gold[200],
  },
  checkBtn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },

  // Now line
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: -4,
  },
  nowLineFill: {
    flex: 1,
    height: 1,
    backgroundColor: '#ef4444',
  },

  // List view
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 3,
  },
  listCardLeft: {
    flex: 1,
    gap: 3,
  },
  listCardTime: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textDim,
  },
  listCardTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  listCardXP: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 11,
    color: colors.gold[200],
  },
  listCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textMute,
  },
  addFirstBtn: {
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addFirstBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Add event modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  addModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  modalLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
  },
  modalInput: {
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  stepBtnText: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: colors.textDim,
  },
  stepValue: {
    flex: 1,
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },

  // Conflict modal
  conflictModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  conflictSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
  },
  conflictOption: {
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  conflictOptionLabel: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  conflictOptionDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textMute,
  },
})
