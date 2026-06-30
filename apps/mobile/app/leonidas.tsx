import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ChevronLeft, ChevronDown, ChevronUp, Plus, X, Minus } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { XPBar } from '@/components/ui/XPBar'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import {
  api,
  type LeonidasToday,
  type DisponibilidadMuscular,
  type EjercicioPlan,
  type EjercicioRegistro,
  type RegistrarSesionPayload,
} from '@/lib/api'
import { GRUPOS_MUSCULARES } from '@/lib/activities.catalog'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIPOS_SESION = ['fuerza', 'cardio', 'barras', 'trote'] as const
type TipoSesion = typeof TIPOS_SESION[number]

const INTENSIDADES = ['😴', '🙂', '💪', '🔥', '⚡']

const EJERCICIOS_POR_GRUPO: Record<string, string[]> = {
  Pecho:    ['Press banca', 'Press inclinado', 'Flexiones', 'Aperturas', 'Pullover'],
  Espalda:  ['Dominadas', 'Remo con barra', 'Jalón al pecho', 'Remo en polea', 'Face pull'],
  Piernas:  ['Sentadillas', 'Peso muerto', 'Prensa', 'Zancadas', 'Curl femoral'],
  Hombros:  ['Press militar', 'Elevaciones laterales', 'Vuelos posteriores', 'Press Arnold'],
  Brazos:   ['Curl bíceps', 'Press francés', 'Martillo', 'Dips', 'Curl concentrado'],
  Core:     ['Plancha', 'Abdominales', 'Crunch', 'Russian twist', 'Leg raise'],
}

const DIAS_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRestTime(dispo: DisponibilidadMuscular): string {
  const restante = Math.max(0, dispo.horas_requeridas - dispo.horas_transcurridas)
  const h = Math.floor(restante)
  const m = Math.round((restante - h) * 60)
  if (h === 0) return `${m}min restantes`
  if (m === 0) return `${h}h restantes`
  return `${h}h ${m}min restantes`
}

function getDispoForGrupo(
  grupo: string,
  disponibilidad: DisponibilidadMuscular[],
): DisponibilidadMuscular | null {
  return disponibilidad.find((d) => d.grupo.toLowerCase() === grupo.toLowerCase()) ?? null
}

// ─── Muscle Availability Bar ─────────────────────────────────────────────────

function MuscleBar({ dispo }: { dispo: DisponibilidadMuscular }) {
  const pct = Math.min(1, dispo.horas_requeridas > 0
    ? dispo.horas_transcurridas / dispo.horas_requeridas
    : 1)

  return (
    <View style={barStyles.row}>
      <Text style={barStyles.grupo}>{dispo.grupo}</Text>
      <View style={barStyles.barTrack}>
        <View style={[barStyles.barFill, { width: `${pct * 100}%` as `${number}%` }]}>
          <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="8">
            <Defs>
              <LinearGradient id={`bar-${dispo.grupo}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#ef4444" />
                <Stop offset="100%" stopColor="#22c55e" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height={8} fill={`url(#bar-${dispo.grupo})`} rx={4} />
          </Svg>
        </View>
      </View>
      {dispo.disponible ? (
        <Text style={barStyles.disponible}>✓ Disponible</Text>
      ) : (
        <Text style={barStyles.bloqueado}>{formatRestTime(dispo)}</Text>
      )}
    </View>
  )
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  grupo: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
    width: 72,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(124,58,237,0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  disponible: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#22c55e',
    width: 80,
    textAlign: 'right',
  },
  bloqueado: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#f97316',
    width: 80,
    textAlign: 'right',
  },
})

// ─── Registrar Sesión Sheet ───────────────────────────────────────────────────

interface RegistrarSesionSheetProps {
  visible: boolean
  onClose: () => void
  disponibilidad: DisponibilidadMuscular[]
  token: string
  onSuccess: (xp: number) => void
}

function RegistrarSesionSheet({ visible, onClose, disponibilidad, token, onSuccess }: RegistrarSesionSheetProps) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<TipoSesion>('fuerza')
  const [gruposSeleccionados, setGruposSeleccionados] = useState<string[]>([])
  const [duracion, setDuracion] = useState(60)
  const [intensidad, setIntensidad] = useState(3)
  const [ejercicios, setEjercicios] = useState<EjercicioRegistro[]>([])
  const [showEjercicioModal, setShowEjercicioModal] = useState(false)

  // Ejercicio modal state
  const [exNombre, setExNombre] = useState('')
  const [exSeries, setExSeries] = useState('3')
  const [exReps, setExReps] = useState('10')
  const [exPeso, setExPeso] = useState('')
  const [exSuggestions, setExSuggestions] = useState<string[]>([])

  const registrarMutation = useMutation({
    mutationFn: () => {
      const payload: RegistrarSesionPayload = {
        tipo,
        grupos_musculares: gruposSeleccionados,
        duracion_minutos: duracion,
        intensidad,
        ejercicios,
      }
      return api.leonidas.registrarSesion(token, payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leonidas/today'] })
      queryClient.invalidateQueries({ queryKey: ['leonidas/disponibilidad'] })
      onSuccess(data.xp_otorgado)
      resetSheet()
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'No se pudo registrar la sesión')
    },
  })

  function resetSheet() {
    setTipo('fuerza')
    setGruposSeleccionados([])
    setDuracion(60)
    setIntensidad(3)
    setEjercicios([])
    onClose()
  }

  function toggleGrupo(grupo: string) {
    const dispo = getDispoForGrupo(grupo, disponibilidad)
    if (dispo && !dispo.disponible) {
      Alert.alert(
        'Músculo en descanso',
        `${grupo} necesita ${formatRestTime(dispo)} más de descanso`,
      )
      return
    }
    setGruposSeleccionados((prev) =>
      prev.includes(grupo) ? prev.filter((g) => g !== grupo) : [...prev, grupo],
    )
  }

  function isGrupoEnDescanso(grupo: string): boolean {
    const dispo = getDispoForGrupo(grupo, disponibilidad)
    return dispo ? !dispo.disponible : false
  }

  function addEjercicio() {
    if (!exNombre.trim()) return
    setEjercicios((prev) => [
      ...prev,
      {
        nombre: exNombre.trim(),
        series: parseInt(exSeries) || 3,
        reps: parseInt(exReps) || 10,
        ...(exPeso ? { peso_kg: parseFloat(exPeso) } : {}),
      },
    ])
    setExNombre('')
    setExSeries('3')
    setExReps('10')
    setExPeso('')
    setExSuggestions([])
    setShowEjercicioModal(false)
  }

  function onExNombreChange(text: string) {
    setExNombre(text)
    if (text.length < 2) { setExSuggestions([]); return }
    const allExercises = Object.values(EJERCICIOS_POR_GRUPO).flat()
    setExSuggestions(
      allExercises.filter((e) => e.toLowerCase().includes(text.toLowerCase())).slice(0, 5),
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetSheet}>
      <Pressable style={sheetStyles.overlay} onPress={resetSheet} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={sheetStyles.wrapper}
      >
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.title}>REGISTRAR SESIÓN</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tipo */}
            <Text style={sheetStyles.fieldLabel}>TIPO DE SESIÓN</Text>
            <View style={sheetStyles.pillRow}>
              {TIPOS_SESION.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[sheetStyles.pill, tipo === t && sheetStyles.pillActive]}
                  onPress={() => setTipo(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[sheetStyles.pillText, tipo === t && sheetStyles.pillTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Grupos musculares */}
            <Text style={sheetStyles.fieldLabel}>GRUPOS MUSCULARES</Text>
            <View style={sheetStyles.pillRow}>
              {GRUPOS_MUSCULARES.map((g) => {
                const selected = gruposSeleccionados.includes(g)
                const enDescanso = isGrupoEnDescanso(g)
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      sheetStyles.pill,
                      selected && sheetStyles.pillActive,
                      enDescanso && sheetStyles.pillDescanso,
                    ]}
                    onPress={() => toggleGrupo(g)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      sheetStyles.pillText,
                      selected && sheetStyles.pillTextActive,
                      enDescanso && sheetStyles.pillTextDescanso,
                    ]}>
                      {g}
                    </Text>
                    {enDescanso && <Text style={sheetStyles.descansoIcon}> 🔴</Text>}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Duración */}
            <Text style={sheetStyles.fieldLabel}>DURACIÓN</Text>
            <View style={sheetStyles.stepper}>
              <TouchableOpacity
                style={sheetStyles.stepperBtn}
                onPress={() => setDuracion((d) => Math.max(30, d - 15))}
              >
                <Minus size={18} color={colors.textDim} />
              </TouchableOpacity>
              <Text style={sheetStyles.stepperValue}>{duracion} min</Text>
              <TouchableOpacity
                style={sheetStyles.stepperBtn}
                onPress={() => setDuracion((d) => Math.min(180, d + 15))}
              >
                <Plus size={18} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            {/* Ejercicios */}
            <Text style={sheetStyles.fieldLabel}>EJERCICIOS</Text>
            {ejercicios.length > 0 && (
              <View style={sheetStyles.ejerciciosList}>
                {ejercicios.map((e, i) => (
                  <View key={i} style={sheetStyles.ejercicioChip}>
                    <Text style={sheetStyles.ejercicioChipText}>
                      {e.nombre} · {e.series}×{e.reps}
                      {e.peso_kg ? ` · ${e.peso_kg}kg` : ''}
                    </Text>
                    <TouchableOpacity onPress={() => setEjercicios((prev) => prev.filter((_, j) => j !== i))}>
                      <X size={14} color={colors.textDim} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={sheetStyles.addEjBtn}
              onPress={() => setShowEjercicioModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={colors.purple[100]} />
              <Text style={sheetStyles.addEjBtnText}>Agregar ejercicio</Text>
            </TouchableOpacity>

            {/* Intensidad */}
            <Text style={sheetStyles.fieldLabel}>INTENSIDAD</Text>
            <View style={sheetStyles.pillRow}>
              {INTENSIDADES.map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  style={[sheetStyles.intensidadBtn, intensidad === i + 1 && sheetStyles.intensidadBtnActive]}
                  onPress={() => setIntensidad(i + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={sheetStyles.intensidadEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <PrimaryButton
                label={registrarMutation.isPending ? 'Registrando...' : 'Registrar sesión'}
                onPress={() => registrarMutation.mutate()}
                disabled={registrarMutation.isPending || gruposSeleccionados.length === 0}
                loading={registrarMutation.isPending}
              />
            </View>
            <View style={{ height: spacing['2xl'] }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Add Exercise Modal */}
      <Modal visible={showEjercicioModal} transparent animationType="fade" onRequestClose={() => setShowEjercicioModal(false)}>
        <Pressable style={sheetStyles.overlay} onPress={() => setShowEjercicioModal(false)} />
        <View style={sheetStyles.exModal}>
          <Text style={sheetStyles.exModalTitle}>Agregar ejercicio</Text>

          <Text style={sheetStyles.fieldLabel}>NOMBRE</Text>
          <TextInput
            style={sheetStyles.input}
            placeholder="Nombre del ejercicio"
            placeholderTextColor={colors.textMute}
            value={exNombre}
            onChangeText={onExNombreChange}
          />
          {exSuggestions.length > 0 && (
            <View style={sheetStyles.suggestions}>
              {exSuggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={sheetStyles.suggestionRow}
                  onPress={() => { setExNombre(s); setExSuggestions([]) }}
                  activeOpacity={0.7}
                >
                  <Text style={sheetStyles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={sheetStyles.exInputRow}>
            <View style={sheetStyles.exInputGroup}>
              <Text style={sheetStyles.fieldLabel}>SERIES</Text>
              <TextInput
                style={sheetStyles.input}
                keyboardType="numeric"
                value={exSeries}
                onChangeText={setExSeries}
              />
            </View>
            <View style={sheetStyles.exInputGroup}>
              <Text style={sheetStyles.fieldLabel}>REPS</Text>
              <TextInput
                style={sheetStyles.input}
                keyboardType="numeric"
                value={exReps}
                onChangeText={setExReps}
              />
            </View>
            <View style={sheetStyles.exInputGroup}>
              <Text style={sheetStyles.fieldLabel}>PESO (kg)</Text>
              <TextInput
                style={sheetStyles.input}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={colors.textMute}
                value={exPeso}
                onChangeText={setExPeso}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[sheetStyles.exAddBtn, !exNombre.trim() && sheetStyles.exAddBtnDisabled]}
            onPress={addEjercicio}
            activeOpacity={0.85}
            disabled={!exNombre.trim()}
          >
            <Text style={sheetStyles.exAddBtnText}>Añadir</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Modal>
  )
}

const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  pillDescanso: { borderColor: '#ef444460', backgroundColor: 'rgba(239,68,68,0.1)' },
  pillText: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  pillTextActive: { color: colors.purple[100] },
  pillTextDescanso: { color: '#ef4444' },
  descansoIcon: { fontSize: 10 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    flex: 1,
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  ejerciciosList: { gap: spacing.sm, marginBottom: spacing.sm },
  ejercicioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ejercicioChipText: { fontFamily: 'Inter', fontSize: 12, color: colors.text, flex: 1 },
  addEjBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  addEjBtnText: { fontFamily: 'Inter', fontSize: 13, color: colors.purple[100] },

  intensidadBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,21,46,0.4)',
  },
  intensidadBtnActive: {
    borderColor: colors.purple[300],
    backgroundColor: `${colors.purple[300]}25`,
  },
  intensidadEmoji: { fontSize: 22 },

  exModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg[600],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  exModalTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 14,
  },
  suggestions: {
    backgroundColor: colors.bg[500],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: 2,
  },
  suggestionRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.1)' },
  suggestionText: { fontFamily: 'Inter', fontSize: 13, color: colors.text },
  exInputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  exInputGroup: { flex: 1 },
  exAddBtn: {
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exAddBtnDisabled: { opacity: 0.5 },
  exAddBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeonidasScreen() {
  const { accessToken } = useAuthStore()
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState<Set<string>>(new Set())
  const panelHeight = useSharedValue(0)

  const { data: today, isLoading: loadingToday } = useQuery({
    queryKey: ['leonidas/today'],
    queryFn: () => api.leonidas.today(accessToken!),
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const { data: disponibilidad = [] } = useQuery({
    queryKey: ['leonidas/disponibilidad'],
    queryFn: () => api.leonidas.disponibilidad(accessToken!),
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const panelStyle = useAnimatedStyle(() => ({
    height: panelHeight.value,
    overflow: 'hidden',
  }))

  function togglePanel() {
    const target = panelAbierto ? 0 : disponibilidad.length * 44 + spacing.lg
    panelHeight.value = withTiming(target, { duration: 300 })
    setPanelAbierto(!panelAbierto)
  }

  function toggleEjercicio(id: string) {
    setEjerciciosCompletados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const grupoLabel = today?.grupo_asignado?.toUpperCase() ?? '...'

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>LEONIDAS</Text>
        <TouchableOpacity style={styles.planBtn} activeOpacity={0.7} onPress={() => Alert.alert('Plan', 'Plan semanal próximamente')}>
          <Text style={styles.planBtnText}>📅 Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Weekly grid */}
        <View style={styles.weekGrid}>
          {(today?.grid_semanal ?? DIAS_LABELS.map((d, i) => ({ dia: d, fecha: '', estado: 'pendiente' as const }))).map((dia, i) => {
            const label = dia.dia ?? DIAS_LABELS[i]
            return (
              <View
                key={i}
                style={[
                  styles.diaChip,
                  dia.estado === 'completado' && styles.diaChipDone,
                  dia.estado === 'hoy' && styles.diaChipHoy,
                  dia.estado === 'especial' && styles.diaChipEspecial,
                ]}
              >
                <Text style={[
                  styles.diaChipLabel,
                  dia.estado === 'hoy' && styles.diaChipLabelHoy,
                ]}>
                  {label}
                </Text>
                <Text style={styles.diaChipEstado}>
                  {dia.estado === 'completado' ? '✓' : dia.estado === 'hoy' ? '●' : dia.estado === 'especial' ? '~' : '○'}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Today's card */}
        <View style={styles.card}>
          {loadingToday ? (
            <View style={{ height: 60 }} />
          ) : (
            <>
              <Text style={styles.grupoLabel}>ENTRENAMIENTO DE {grupoLabel}</Text>
              <Text style={styles.grupoSubtext}>
                Asignado por el sistema · Grupos disponibles: {today?.grupos_disponibles ?? '—'}
              </Text>
            </>
          )}
        </View>

        {/* Exercise list */}
        {(today?.ejercicios?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>EJERCICIOS DEL PLAN</Text>
            {today!.ejercicios.map((ej) => {
              const done = ejerciciosCompletados.has(ej.id)
              return (
                <TouchableOpacity
                  key={ej.id}
                  style={[styles.ejRow, done && styles.ejRowDone]}
                  onPress={() => toggleEjercicio(ej.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.ejCheck, done && styles.ejCheckDone]}>
                    {done && <Text style={styles.ejCheckMark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ejNombre, done && styles.ejNombreDone]}>{ej.nombre}</Text>
                    <Text style={styles.ejMeta}>
                      {ej.series_objetivo} series · {ej.reps_objetivo} reps
                      {ej.peso_kg ? ` · ${ej.peso_kg}kg` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Muscle availability panel */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.panelHeader}
            onPress={togglePanel}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLabel}>DISPONIBILIDAD MUSCULAR</Text>
            {panelAbierto ? (
              <ChevronUp size={18} color={colors.textDim} />
            ) : (
              <ChevronDown size={18} color={colors.textDim} />
            )}
          </TouchableOpacity>
          <Animated.View style={panelStyle}>
            {disponibilidad.map((d) => (
              <MuscleBar key={d.grupo} dispo={d} />
            ))}
            {disponibilidad.length === 0 && (
              <Text style={styles.emptyText}>Sin datos de disponibilidad</Text>
            )}
          </Animated.View>
        </View>

        {/* Register session button */}
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton
            label="⚔️  REGISTRAR SESIÓN"
            onPress={() => setSheetVisible(true)}
          />
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      <RegistrarSesionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        disponibilidad={disponibilidad}
        token={accessToken ?? ''}
        onSuccess={(xp) => {
          setSheetVisible(false)
          Alert.alert('¡Sesión registrada!', xp > 0 ? `+${xp} XP obtenidos` : 'Sesión guardada')
        }}
      />
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

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
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold[200],
    letterSpacing: 2,
  },
  planBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(20,21,46,0.6)',
  },
  planBtnText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },

  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  diaChip: {
    width: 40,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,21,46,0.4)',
    gap: 2,
  },
  diaChipDone: { borderColor: '#22c55e50', backgroundColor: 'rgba(34,197,94,0.1)' },
  diaChipHoy: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  diaChipEspecial: { borderColor: '#f59e0b60', backgroundColor: 'rgba(245,158,11,0.1)' },
  diaChipLabel: { fontFamily: 'Cinzel-Medium', fontSize: 11, fontWeight: '500', color: colors.textDim },
  diaChipLabelHoy: { color: colors.purple[100] },
  diaChipEstado: { fontSize: 10 },

  card: {
    backgroundColor: colors.bg[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  grupoLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  grupoSubtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
  },

  sectionLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },

  ejRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.08)',
  },
  ejRowDone: { opacity: 0.6 },
  ejCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,21,46,0.6)',
  },
  ejCheckDone: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)' },
  ejCheckMark: { fontSize: 12, color: '#22c55e', fontWeight: '700' },
  ejNombre: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: colors.text },
  ejNombreDone: { textDecorationLine: 'line-through', color: colors.textMute },
  ejMeta: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim, marginTop: 2 },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  emptyText: { fontFamily: 'Inter', fontSize: 13, color: colors.textMute, textAlign: 'center', paddingVertical: spacing.md },
})
