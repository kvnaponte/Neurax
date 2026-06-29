import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Filter, Plus, Zap, ChevronLeft, ChevronRight, Minus } from 'lucide-react-native'

import { colors, spacing, text } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { XPRise } from '@/components/animations/XPRise'
import { api, type ActividadDetalle, type RegistrarActividadPayload } from '@/lib/api'

// ─── Activity type catalogue ────────────────────────────────────────────────

type AreaKey = 'rutinarias' | 'fisicas' | 'economicas' | 'otras'

const TIPOS = [
  { id: 'estudio', label: 'Estudio', area: 'rutinarias' as AreaKey, xpBase: 25 },
  { id: 'meditacion', label: 'Meditación', area: 'rutinarias' as AreaKey, xpBase: 15 },
  { id: 'lectura', label: 'Lectura', area: 'rutinarias' as AreaKey, xpBase: 20 },
  { id: 'habito', label: 'Hábito', area: 'rutinarias' as AreaKey, xpBase: 10 },
  { id: 'ejercicio_fuerza', label: 'Fuerza', area: 'fisicas' as AreaKey, xpBase: 30 },
  { id: 'barras', label: 'Barras', area: 'fisicas' as AreaKey, xpBase: 25 },
  { id: 'cardio', label: 'Cardio', area: 'fisicas' as AreaKey, xpBase: 20 },
  { id: 'deporte', label: 'Deporte', area: 'fisicas' as AreaKey, xpBase: 25 },
  { id: 'ingreso', label: 'Ingreso', area: 'economicas' as AreaKey, xpBase: 0 },
  { id: 'egreso', label: 'Egreso', area: 'economicas' as AreaKey, xpBase: 0 },
  { id: 'ahorro', label: 'Ahorro', area: 'economicas' as AreaKey, xpBase: 15 },
  { id: 'otro', label: 'Otro', area: 'otras' as AreaKey, xpBase: 10 },
] as const

type TipoId = typeof TIPOS[number]['id']

const GRUPOS_MUSCULARES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core']
const CATEGORIAS_ECO = ['Salario', 'Freelance', 'Inversión', 'Gasto fijo', 'Gasto variable', 'Ahorro']
const FILTER_TABS: { label: string; area: AreaKey | 'todas' }[] = [
  { label: 'Todas', area: 'todas' },
  { label: 'Físicas', area: 'fisicas' },
  { label: 'Económicas', area: 'economicas' },
  { label: 'Rutinas', area: 'rutinarias' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function formatFecha(fechaISO: string): string {
  const d = new Date(fechaISO)
  const today = new Date()
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (isToday) return `Hoy, ${today.getDate()} de ${MESES[today.getMonth()]}`
  const ayer = new Date(today)
  ayer.setDate(today.getDate() - 1)
  const isYesterday =
    d.getFullYear() === ayer.getFullYear() &&
    d.getMonth() === ayer.getMonth() &&
    d.getDate() === ayer.getDate()
  if (isYesterday) return `Ayer, ${ayer.getDate()} de ${MESES[ayer.getMonth()]}`
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

function groupByDay(actividades: ActividadDetalle[]) {
  const map = new Map<string, ActividadDetalle[]>()
  for (const a of actividades) {
    const key = a.fecha ?? new Date().toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([fecha, data]) => ({
      title: formatFecha(fecha),
      totalXP: data.reduce((s, a) => s + a.xp, 0),
      data,
    }))
}

function calcularXPPreview(tipoId: TipoId | '', duracion: number, bonusRacha: number): number {
  if (!tipoId) return 0
  const tipo = TIPOS.find((t) => t.id === tipoId)
  if (!tipo) return 0
  const base = tipo.xpBase * Math.max(1, Math.floor(duracion / 30))
  const hora = new Date().getHours()
  const bonusHorario = hora >= 5 && hora < 9 ? 1.2 : 1.0
  return Math.round(base * bonusRacha * bonusHorario)
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function AreaDot({ area, size = 44 }: { area: AreaKey; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${colors.areas[area]}30`,
        borderWidth: 1.5,
        borderColor: colors.areas[area],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: (size * 0.35) / 2,
          backgroundColor: colors.areas[area],
        }}
      />
    </View>
  )
}

function ActivityRow({ item }: { item: ActividadDetalle }) {
  const area = item.area ?? 'otras'
  return (
    <View style={styles.row}>
      <AreaDot area={area} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTipo}>{item.nombre ?? item.tipo}</Text>
        <Text style={styles.rowMeta}>{item.hora}</Text>
      </View>
      <Text style={[styles.rowXP, { color: item.xp === 0 ? colors.textMute : colors.gold[200] }]}>
        {item.xp > 0 ? `+${item.xp}` : '0'} XP
      </Text>
    </View>
  )
}

function SectionHeader({ title, totalXP, count }: { title: string; totalXP: number; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionMeta}>
        {count} actividad{count !== 1 ? 'es' : ''} · {totalXP} XP
      </Text>
    </View>
  )
}

// ─── Bottom sheet ────────────────────────────────────────────────────────────

interface SheetProps {
  visible: boolean
  onClose: () => void
  onSuccess: (xp: number) => void
  token: string
  bonusRacha: number
}

function RegistrarActividadSheet({ visible, onClose, onSuccess, token, bonusRacha }: SheetProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [tipoId, setTipoId] = useState<TipoId | ''>('')
  const [duracion, setDuracion] = useState(30)
  const [grupoMuscular, setGrupoMuscular] = useState('')
  const [monto, setMonto] = useState('')
  const [categoriaEco, setCategoriaEco] = useState('')

  const tipoSeleccionado = TIPOS.find((t) => t.id === tipoId)
  const xpPreview = calcularXPPreview(tipoId as TipoId, duracion, bonusRacha)
  const bonusHorario = new Date().getHours() >= 5 && new Date().getHours() < 9 ? 1.2 : 1.0
  const limiteAlcanzado = false // would come from daily area limits

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!tipoId || !tipoSeleccionado) return
      const hora = new Date().toTimeString().slice(0, 5)
      const metadata: Record<string, unknown> = {}
      if (grupoMuscular) metadata.grupo_muscular = grupoMuscular
      if (monto) metadata.monto = parseFloat(monto)
      if (categoriaEco) metadata.categoria = categoriaEco

      const payload: RegistrarActividadPayload = {
        tipo: tipoId,
        area: tipoSeleccionado.area,
        duracion,
        hora,
        metadata,
      }
      return api.actividades.registrar(token, payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['actividades/list'] })
      queryClient.invalidateQueries({ queryKey: ['actividades/today'] })
      queryClient.invalidateQueries({ queryKey: ['gamification/status'] })
      const xp = data?.xp_ganado ?? xpPreview
      onSuccess(xp)
      resetSheet()
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'No se pudo registrar la actividad')
    },
  })

  function resetSheet() {
    setStep(1)
    setTipoId('')
    setDuracion(30)
    setGrupoMuscular('')
    setMonto('')
    setCategoriaEco('')
  }

  function handleClose() {
    resetSheet()
    onClose()
  }

  const needsGrupoMuscular = tipoId === 'ejercicio_fuerza' || tipoId === 'barras'
  const needsEco = tipoId === 'ingreso' || tipoId === 'egreso'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {step === 1 ? (
            <>
              <Text style={styles.sheetTitle}>Nueva actividad</Text>
              <Text style={styles.sheetSubtitle}>Selecciona el tipo</Text>
              <View style={styles.typeGrid}>
                {TIPOS.map((tipo) => {
                  const selected = tipoId === tipo.id
                  const areaColor = colors.areas[tipo.area]
                  return (
                    <TouchableOpacity
                      key={tipo.id}
                      style={[
                        styles.typeCell,
                        selected && { borderColor: areaColor, backgroundColor: `${areaColor}15` },
                      ]}
                      onPress={() => setTipoId(tipo.id)}
                      activeOpacity={0.7}
                    >
                      <AreaDot area={tipo.area} size={32} />
                      <Text style={[styles.typeCellLabel, selected && { color: areaColor }]}>
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity
                style={[styles.nextBtn, !tipoId && styles.nextBtnDisabled]}
                onPress={() => tipoId && setStep(2)}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.step2Header}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                  <ChevronLeft size={18} color={colors.textDim} />
                  <Text style={styles.backBtnText}>Tipo</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{tipoSeleccionado?.label ?? ''}</Text>
              </View>

              {/* Duración stepper */}
              <Text style={styles.fieldLabel}>DURACIÓN</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setDuracion((d) => Math.max(5, d - 5))}
                >
                  <Minus size={18} color={colors.textDim} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{duracion} min</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setDuracion((d) => Math.min(480, d + 5))}
                >
                  <Plus size={18} color={colors.textDim} />
                </TouchableOpacity>
              </View>

              {/* Grupo muscular (fuerza/barras) */}
              {needsGrupoMuscular && (
                <>
                  <Text style={styles.fieldLabel}>GRUPO MUSCULAR</Text>
                  <View style={styles.chipRow}>
                    {GRUPOS_MUSCULARES.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.chip, grupoMuscular === g && styles.chipActive]}
                        onPress={() => setGrupoMuscular(g)}
                      >
                        <Text style={[styles.chipText, grupoMuscular === g && styles.chipTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Eco fields */}
              {needsEco && (
                <>
                  <Text style={styles.fieldLabel}>MONTO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMute}
                    keyboardType="numeric"
                    value={monto}
                    onChangeText={setMonto}
                  />
                  <Text style={styles.fieldLabel}>CATEGORÍA</Text>
                  <View style={styles.chipRow}>
                    {CATEGORIAS_ECO.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.chip, categoriaEco === c && styles.chipActive]}
                        onPress={() => setCategoriaEco(c)}
                      >
                        <Text style={[styles.chipText, categoriaEco === c && styles.chipTextActive]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* XP Preview */}
              <View style={styles.xpPreview}>
                {limiteAlcanzado ? (
                  <Text style={styles.xpLimite}>Límite del área alcanzado — XP: 0</Text>
                ) : (
                  <>
                    <Zap size={16} color={colors.gold[200]} />
                    <Text style={styles.xpPreviewText}>
                      XP estimado:{' '}
                      <Text style={{ color: colors.gold[200], fontWeight: '700' }}>
                        +{xpPreview}
                      </Text>
                      {bonusHorario > 1 && (
                        <Text style={{ color: colors.textDim }}>
                          {' '}(×{bonusRacha.toFixed(2)} racha × 1.2 horario)
                        </Text>
                      )}
                    </Text>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, registerMutation.isPending && styles.nextBtnDisabled]}
                onPress={() => registerMutation.mutate()}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>
                  {registerMutation.isPending ? 'Registrando...' : 'Registrar actividad'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const { accessToken } = useAuthStore()
  const { bonus_xp } = useGamificationStore()
  const [activeFilter, setActiveFilter] = useState<AreaKey | 'todas'>('todas')
  const [sheetVisible, setSheetVisible] = useState(false)
  const [xpRise, setXpRise] = useState<number | null>(null)

  const { data: actividades = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['actividades/list', activeFilter],
    queryFn: () =>
      api.actividades.list(accessToken!, activeFilter === 'todas' ? undefined : activeFilter),
    staleTime: 15_000,
    enabled: !!accessToken,
  })

  const sections = groupByDay(actividades)

  const onSuccess = useCallback((xp: number) => {
    setSheetVisible(false)
    setXpRise(xp)
  }, [])

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actividades</Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <Filter size={20} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.area
          return (
            <TouchableOpacity
              key={tab.area}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveFilter(tab.area)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityRow item={item} />}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={section.title}
            totalXP={(section as any).totalXP ?? 0}
            count={section.data.length}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.purple[200]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Zap size={40} color={colors.textMute} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando...' : 'No hay actividades registradas'}
            </Text>
          </View>
        }
        getItemLayout={(_, index) => ({ length: 70, offset: 70 * index, index })}
        stickySectionHeadersEnabled={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Registration sheet */}
      <RegistrarActividadSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSuccess={onSuccess}
        token={accessToken ?? ''}
        bonusRacha={bonus_xp}
      />

      {/* XP rise animation */}
      {xpRise !== null && (
        <XPRise xp={xpRise} onComplete={() => setXpRise(null)} />
      )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 26,
    fontWeight: '600',
    color: colors.text,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter tabs
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  tabActive: {
    borderColor: colors.purple[300],
    backgroundColor: `${colors.purple[300]}20`,
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.purple[100],
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sectionMeta: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textDim,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.1)',
  },
  rowContent: {
    flex: 1,
  },
  rowTipo: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  rowMeta: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  rowXP: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 13,
    fontWeight: '600',
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
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple[300],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.purple[300],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // Sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 40,
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
  sheetTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
    marginBottom: spacing.lg,
  },
  step2Header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeCell: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,21,46,0.4)',
  },
  typeCellLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
  },

  // Step 2 fields
  fieldLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    borderColor: colors.purple[300],
    backgroundColor: `${colors.purple[300]}20`,
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
  },
  chipTextActive: {
    color: colors.purple[100],
  },

  // XP preview
  xpPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: `${colors.gold[400]}15`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.gold[300]}30`,
  },
  xpPreviewText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
  },
  xpLimite: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textMute,
    fontStyle: 'italic',
  },

  // Buttons
  nextBtn: {
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
})
