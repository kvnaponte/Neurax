import React, { useState, useEffect, useRef, useMemo } from 'react'
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
import {
  api,
  type CronosEvento,
  type MoverOpcion,
  type EnergiaPunto,
} from '@/lib/api'
import { triggerHaptic } from '@/lib/haptics'
import { buildEnergyByHour, energiaColor, calcularEnergiaEvento } from '@/lib/energia'
import { ACTIVIDADES_CATALOG, TIPOS, type ActividadTipo } from '@/lib/activities.catalog'

// ─── Constants ───────────────────────────────────────────────────────────────

const PIXELS_PER_HOUR = 64
const START_HOUR = 6
const END_HOUR = 23
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
  const durationHours = (new Date(fin_at).getTime() - new Date(inicio_at).getTime()) / 3_600_000
  return Math.max(32, durationHours * PIXELS_PER_HOUR)
}
function getNowLineTop(): number {
  const now = new Date()
  return (now.getHours() + now.getMinutes() / 60 - START_HOUR) * PIXELS_PER_HOUR
}
function formatHourMinute(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function eventAreaColor(ev: CronosEvento): string {
  if (ev.area && (colors.areas as Record<string, string>)[ev.area]) {
    return (colors.areas as Record<string, string>)[ev.area]
  }
  return colors.purple[200]
}

// ─── Event card ──────────────────────────────────────────────────────────────

function EventCard({
  evento, onLongPress, onComplete, onTap, isDragged,
}: {
  evento: CronosEvento
  onLongPress: () => void
  onComplete: () => void
  onTap: () => void
  isDragged: boolean
}) {
  const top = getEventTop(evento.inicio_at)
  const height = getEventHeight(evento.inicio_at, evento.fin_at)
  const ac = eventAreaColor(evento)

  const scale = useSharedValue(1)
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
        { top, height, borderLeftColor: ac, opacity: evento.completado ? 0.6 : 1 },
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
          <Text style={styles.eventTitle} numberOfLines={1}>{evento.titulo}</Text>
          {evento.completado && <Check size={12} color={colors.textDim} />}
        </View>
        <Text style={styles.eventTime}>
          {formatHourMinute(evento.inicio_at)} – {formatHourMinute(evento.fin_at)}
        </Text>
      </TouchableOpacity>

      {!evento.completado && (
        <TouchableOpacity style={styles.checkBtn} onPress={onComplete} activeOpacity={0.7}>
          <View style={[styles.checkCircle, { borderColor: ac }]} />
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

// ─── Energy column ───────────────────────────────────────────────────────────

function EnergyColumn({ energyByHour }: { energyByHour: Record<number, number> }) {
  const segments: React.ReactNode[] = []
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const pct = energyByHour[hour] ?? 100
    segments.push(
      <View key={hour} style={{ height: PIXELS_PER_HOUR, width: ENERGY_COL_WIDTH, backgroundColor: energiaColor(pct) }} />,
    )
  }
  return <View style={styles.energyCol}>{segments}</View>
}

function HourLabels() {
  const labels: React.ReactNode[] = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    labels.push(
      <View key={hour} style={[styles.hourLabel, { top: (hour - START_HOUR) * PIXELS_PER_HOUR - 8 }]}>
        <Text style={styles.hourText}>{String(hour).padStart(2, '0')}:00</Text>
      </View>,
    )
  }
  return <View style={styles.hourLabelsContainer}>{labels}</View>
}

// ─── Add event modal ──────────────────────────────────────────────────────────

function AddEventModal({
  visible, onClose, defaultHora, baseDate, onCreated, token,
}: {
  visible: boolean
  onClose: () => void
  defaultHora: string
  baseDate: Date
  onCreated: () => void
  token: string
}) {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<ActividadTipo>('trabajo')
  const [duracion, setDuracion] = useState(60)

  const energiaEstimada = calcularEnergiaEvento(tipo, duracion)

  const createMutation = useMutation({
    mutationFn: async () => {
      const [hh, mm] = defaultHora.split(':').map(Number)
      const inicio = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hh, mm)
      const fin = new Date(inicio.getTime() + duracion * 60_000)
      return api.cronos.createEvent(token, {
        titulo,
        tipo,
        area: ACTIVIDADES_CATALOG[tipo].area,
        inicio_at: inicio.toISOString(),
        fin_at: fin.toISOString(),
      })
    },
    onSuccess: () => {
      onCreated()
      setTitulo(''); setTipo('trabajo'); setDuracion(60)
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo crear el evento'),
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.addModal}>
        <View style={styles.handle} />
        <Text style={styles.modalTitle}>¿Qué deseas agregar a las {defaultHora}?</Text>

        <Text style={styles.modalLabel}>TÍTULO</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Ej. Entrenamiento, Estudio..."
          placeholderTextColor={colors.textMute}
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.modalLabel}>TIPO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tipoChip, tipo === t && styles.tipoChipActive]}
              onPress={() => setTipo(t)}
            >
              <Text style={[styles.tipoChipText, tipo === t && styles.tipoChipTextActive]}>
                {ACTIVIDADES_CATALOG[t].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        <Text style={styles.energiaHint}>
          Energía estimada: {energiaEstimada > 0 ? '−' : '+'}{Math.abs(energiaEstimada).toFixed(0)}%
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, (!titulo || createMutation.isPending) && styles.disabledBtn]}
          onPress={() => titulo && createMutation.mutate()}
          activeOpacity={0.85}
          disabled={!titulo || createMutation.isPending}
        >
          <Text style={styles.primaryBtnText}>{createMutation.isPending ? 'Creando...' : 'Agregar evento'}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Conflict modal ──────────────────────────────────────────────────────────

function ConflictModal({
  visible, onClose, onSelect,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (opt: MoverOpcion) => void
}) {
  const OPTIONS: { id: MoverOpcion; label: string; desc: string }[] = [
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
          <TouchableOpacity key={opt.id} style={styles.conflictOption} onPress={() => onSelect(opt.id)} activeOpacity={0.7}>
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

  const { data: eventos = [] } = useQuery({
    queryKey: ['cronos/events', dateStr],
    queryFn: () => api.cronos.getEvents(accessToken!, dateStr),
    staleTime: 30_000,
    enabled: !!accessToken,
  })

  // Authoritative per-event energy from the server (optional overlay)
  const { data: energiaPuntos = [] } = useQuery({
    queryKey: ['cronos/energy', dateStr],
    queryFn: () => api.cronos.energy(accessToken!, dateStr),
    staleTime: 30_000,
    enabled: !!accessToken,
  })

  const energyByHour = useMemo(() => {
    const serverMap = new Map<string, number>(
      (energiaPuntos as EnergiaPunto[]).map((p) => [p.evento_id, p.energia_acumulada_despues]),
    )
    return buildEnergyByHour(eventos, START_HOUR, END_HOUR, serverMap.size ? serverMap : undefined)
  }, [eventos, energiaPuntos])

  useEffect(() => {
    const interval = setInterval(() => setNowTop(getNowLineTop()), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (today && scrollRef.current) {
        scrollRef.current.scrollTo({ y: Math.max(0, nowTop - 120), animated: true })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [today, nowTop])

  const invalidateDay = () => {
    queryClient.invalidateQueries({ queryKey: ['cronos/events', dateStr] })
    queryClient.invalidateQueries({ queryKey: ['cronos/energy', dateStr] })
  }

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.cronos.completeEvent(accessToken!, id),
    onSuccess: invalidateDay,
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo completar el evento'),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, nuevo_inicio, opcion }: { id: string; nuevo_inicio: string; opcion: MoverOpcion }) =>
      api.cronos.moveEvent(accessToken!, id, { nuevo_inicio, opcion }),
    onSuccess: () => { invalidateDay(); setDraggedId(null); setPendingMove(null) },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo mover el evento'),
  })

  function newStartISO(hour: number): string {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, 0)
    return d.toISOString()
  }

  function hourHasEvent(hour: number, excludeId: string): boolean {
    return eventos.some((ev) => {
      if (ev.id === excludeId) return false
      const s = new Date(ev.inicio_at).getHours()
      const e = new Date(ev.fin_at).getHours()
      return hour >= s && hour < e
    })
  }

  function handleLongPress(evento: CronosEvento) {
    triggerHaptic()
    setDraggedId(evento.id)
  }

  function handleSlotTap(hour: number) {
    if (draggedId) {
      if (hourHasEvent(hour, draggedId)) {
        setPendingMove({ targetHour: hour })
        setConflictVisible(true)
      } else {
        // Empty slot: a plain move (reemplazar finds nothing to delete)
        moveMutation.mutate({ id: draggedId, nuevo_inicio: newStartISO(hour), opcion: 'reemplazar' })
      }
    } else {
      setAddHora(`${String(hour).padStart(2, '0')}:00`)
      setAddModalVisible(true)
    }
  }

  function handleConflictSelect(opt: MoverOpcion) {
    setConflictVisible(false)
    if (!draggedId || !pendingMove) return
    moveMutation.mutate({ id: draggedId, nuevo_inicio: newStartISO(pendingMove.targetHour), opcion: opt })
  }

  function handleComplete(evento: CronosEvento) {
    const lateMin = Math.floor((Date.now() - new Date(evento.fin_at).getTime()) / 60_000)
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

  function navigateDate(delta: number) {
    setDraggedId(null)
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(d)
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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
          <TouchableOpacity style={styles.headerBtn} onPress={() => setAddModalVisible(true)} activeOpacity={0.7}>
            <Plus size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, viewMode === 'lista' && styles.headerBtnActive]}
            onPress={() => setViewMode(viewMode === 'dia' ? 'lista' : 'dia')}
            activeOpacity={0.7}
          >
            {viewMode === 'dia' ? <List size={18} color={colors.textDim} /> : <Clock size={18} color={colors.purple[100]} />}
          </TouchableOpacity>
        </View>
      </View>

      {draggedId && (
        <Pressable style={styles.dragBanner} onPress={() => setDraggedId(null)}>
          <Text style={styles.dragBannerText}>Toca un horario para mover · Toca aquí para cancelar</Text>
        </Pressable>
      )}

      {viewMode === 'dia' ? (
        <ScrollView
          ref={scrollRef}
          style={styles.timeline}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ height: TIMELINE_HEIGHT + 40, paddingBottom: 40 }}
        >
          <View style={styles.timelineRow}>
            <View style={{ width: HOUR_LABEL_WIDTH }}><HourLabels /></View>
            <EnergyColumn energyByHour={energyByHour} />
            <View style={styles.eventsArea}>
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

              {eventos.map((ev) => (
                <EventCard
                  key={ev.id}
                  evento={ev}
                  isDragged={draggedId === ev.id}
                  onLongPress={() => handleLongPress(ev)}
                  onComplete={() => handleComplete(ev)}
                  onTap={() => { if (draggedId === ev.id) setDraggedId(null) }}
                />
              ))}

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
        <FlatList
          data={[...eventos].sort((a, b) => new Date(a.inicio_at).getTime() - new Date(b.inicio_at).getTime())}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Clock size={40} color={colors.textMute} />
              <Text style={styles.emptyText}>No hay eventos para este día</Text>
              <TouchableOpacity style={styles.addFirstBtn} onPress={() => setAddModalVisible(true)} activeOpacity={0.85}>
                <Text style={styles.addFirstBtnText}>Agregar evento</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const ac = eventAreaColor(item)
            return (
              <View style={[styles.listCard, { borderLeftColor: ac, opacity: item.completado ? 0.6 : 1 }]}>
                <View style={styles.listCardLeft}>
                  <Text style={styles.listCardTime}>
                    {formatHourMinute(item.inicio_at)} – {formatHourMinute(item.fin_at)}
                  </Text>
                  <Text style={styles.listCardTitle}>{item.titulo}</Text>
                </View>
                {item.completado ? (
                  <Check size={20} color={colors.textDim} />
                ) : (
                  <TouchableOpacity
                    style={[styles.listCheckCircle, { borderColor: ac }]}
                    onPress={() => handleComplete(item)}
                    activeOpacity={0.7}
                  />
                )}
              </View>
            )
          }}
        />
      )}

      <AddEventModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        defaultHora={addHora}
        baseDate={currentDate}
        onCreated={invalidateDay}
        token={accessToken ?? ''}
      />

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
  root: { flex: 1, backgroundColor: colors.bg[800] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.15)',
  },
  headerTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  navBtn: { padding: 4 },
  dateText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim, minWidth: 80, textAlign: 'center' },
  headerBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  headerBtnActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },

  dragBanner: {
    backgroundColor: `${colors.purple[300]}20`, borderBottomWidth: 1, borderBottomColor: `${colors.purple[300]}40`,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center',
  },
  dragBannerText: { fontFamily: 'Inter', fontSize: 12, color: colors.purple[100] },

  timeline: { flex: 1 },
  timelineRow: { flexDirection: 'row', paddingTop: spacing.sm },

  hourLabelsContainer: { position: 'relative', height: TIMELINE_HEIGHT },
  hourLabel: { position: 'absolute', left: 0, right: 0, alignItems: 'flex-end', paddingRight: spacing.sm },
  hourText: { fontFamily: 'Inter', fontSize: 9, color: colors.textMute },

  energyCol: { width: ENERGY_COL_WIDTH, marginHorizontal: 4, borderRadius: 4, overflow: 'hidden' },

  eventsArea: { flex: 1, position: 'relative', height: TIMELINE_HEIGHT, marginLeft: 4 },
  slotZone: { position: 'absolute', left: 0, right: 0, height: PIXELS_PER_HOUR, justifyContent: 'flex-end' },
  slotLine: { height: 1, backgroundColor: 'rgba(124,58,237,0.08)' },

  eventCard: {
    position: 'absolute', left: 4, right: 8, borderLeftWidth: 3, borderRadius: 8,
    backgroundColor: 'rgba(20,21,46,0.85)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 4,
  },
  eventCardInner: { flex: 1, padding: spacing.sm, gap: 2 },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventTitle: { flex: 1, fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: colors.text },
  eventTime: { fontFamily: 'Inter', fontSize: 9, color: colors.textDim },
  checkBtn: { width: 32, alignItems: 'center', justifyContent: 'center', paddingRight: spacing.sm },
  checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, backgroundColor: 'transparent' },

  nowLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 10, pointerEvents: 'none' },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: -4 },
  nowLineFill: { flex: 1, height: 1, backgroundColor: '#ef4444' },

  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100, gap: spacing.sm },
  listCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, borderLeftWidth: 3,
  },
  listCardLeft: { flex: 1, gap: 3 },
  listCardTime: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim },
  listCardTitle: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: colors.text },
  listCheckCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMute },
  addFirstBtn: { backgroundColor: colors.purple[300], borderRadius: 12, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.sm },
  addFirstBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 13, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  addModal: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
    paddingBottom: 48, borderTopWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
  modalTitle: { fontFamily: 'Cinzel-Bold', fontSize: 17, fontWeight: '700', color: colors.text },
  modalLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, fontWeight: '500', color: colors.textDim, letterSpacing: 1.5, marginTop: spacing.sm },
  modalInput: {
    backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: spacing.md, color: colors.text, fontFamily: 'Inter', fontSize: 14,
  },
  tipoChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  tipoChipActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  tipoChipText: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  tipoChipTextActive: { color: colors.purple[100] },
  stepper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden',
  },
  stepBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  stepBtnText: { fontFamily: 'Inter', fontSize: 20, color: colors.textDim },
  stepValue: { flex: 1, fontFamily: 'Cinzel-SemiBold', fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  energiaHint: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim, marginTop: spacing.xs },
  primaryBtn: { backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  conflictModal: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
    paddingBottom: 48, borderTopWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  conflictSubtitle: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  conflictOption: { backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, gap: 4 },
  conflictOptionLabel: { fontFamily: 'Cinzel-SemiBold', fontSize: 14, fontWeight: '600', color: colors.text },
  conflictOptionDesc: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelBtnText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMute },
})
