import React, { useState, useCallback, useMemo } from 'react'
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
import { Filter, Plus, Zap, ChevronLeft, Minus } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { XPRise } from '@/components/animations/XPRise'
import {
  api,
  type ActividadRow,
  type ActividadesListResponse,
  type RegistrarActividadPayload,
} from '@/lib/api'
import {
  ACTIVIDADES_CATALOG,
  LIMITES_DIARIOS_XP,
  TIPOS,
  GRUPOS_MUSCULARES,
  CATEGORIAS_ECO,
  calcularXPPreview,
  type ActividadTipo,
  type AreaKey,
} from '@/lib/activities.catalog'

// ─── Filter tabs (as specified in the issue) ────────────────────────────────

const FILTER_TABS: { label: string; area: AreaKey | 'todas' }[] = [
  { label: 'Todas', area: 'todas' },
  { label: 'Físicas', area: 'fisicas' },
  { label: 'Económicas', area: 'economicas' },
  { label: 'Rutinas', area: 'rutinarias' },
]

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// ─── Helpers ────────────────────────────────────────────────────────────────

function fechaKey(timestamp: string): string {
  return timestamp.slice(0, 10)
}

function formatFecha(key: string): string {
  const d = new Date(`${key}T00:00:00`)
  const today = new Date()
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today)) return `Hoy, ${today.getDate()} de ${MESES[today.getMonth()]}`
  const ayer = new Date(today)
  ayer.setDate(today.getDate() - 1)
  if (sameDay(d, ayer)) return `Ayer, ${ayer.getDate()} de ${MESES[ayer.getMonth()]}`
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

function formatHora(timestamp: string): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function tipoLabel(tipo: string): string {
  return ACTIVIDADES_CATALOG[tipo as ActividadTipo]?.label ?? tipo
}

function areaColor(area: string): string {
  return (colors.areas as Record<string, string>)[area] ?? colors.areas.otras
}

function groupByDay(rows: ActividadRow[]) {
  const map = new Map<string, ActividadRow[]>()
  for (const r of rows) {
    const key = fechaKey(r.timestamp)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, data]) => ({
      title: formatFecha(key),
      totalXP: data.reduce((s, a) => s + a.xp_generado, 0),
      data,
    }))
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function AreaDot({ area, size = 44 }: { area: string; size?: number }) {
  const color = areaColor(area)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}30`,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: (size * 0.35) / 2,
          backgroundColor: color,
        }}
      />
    </View>
  )
}

function ActivityRow({ item }: { item: ActividadRow }) {
  return (
    <View style={styles.row}>
      <AreaDot area={item.area} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTipo}>{tipoLabel(item.tipo)}</Text>
        <Text style={styles.rowMeta}>{formatHora(item.timestamp)} · {item.duracion_minutos}min</Text>
      </View>
      <Text style={[styles.rowXP, { color: item.xp_generado === 0 ? colors.textMute : colors.gold[200] }]}>
        {item.xp_generado > 0 ? `+${item.xp_generado}` : '0'} XP
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
  diasRacha: number
  xpHoyPorArea: Record<string, number>
}

function RegistrarActividadSheet({ visible, onClose, onSuccess, token, diasRacha, xpHoyPorArea }: SheetProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [tipo, setTipo] = useState<ActividadTipo | ''>('')
  const [duracion, setDuracion] = useState(30)
  const [grupoMuscular, setGrupoMuscular] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')

  const def = tipo ? ACTIVIDADES_CATALOG[tipo] : null
  const preview = useMemo(
    () => (tipo ? calcularXPPreview(tipo, duracion, diasRacha) : null),
    [tipo, duracion, diasRacha],
  )

  // Daily area-limit check, mirrors backend: acumulado + estimado > limite
  const limiteExcedido = useMemo(() => {
    if (!def || !preview) return false
    const acumulado = xpHoyPorArea[def.area] ?? 0
    return acumulado + preview.final > LIMITES_DIARIOS_XP[def.area]
  }, [def, preview, xpHoyPorArea])

  const xpMostrado = limiteExcedido ? 0 : preview?.final ?? 0

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!tipo) throw new Error('Selecciona un tipo')
      const metadata: Record<string, unknown> = {}
      if (grupoMuscular) metadata.grupo_muscular = grupoMuscular
      if (monto) metadata.monto = parseFloat(monto)
      if (categoria) metadata.categoria = categoria

      const payload: RegistrarActividadPayload = {
        tipo,
        duracion_minutos: duracion,
        timestamp: new Date().toISOString(),
        metadata: Object.keys(metadata).length ? metadata : undefined,
      }
      return api.actividades.registrar(token, payload)
    },
    // ── Optimistic update: insert the activity before the response arrives ──
    onMutate: async () => {
      if (!tipo || !def || !preview) return
      await queryClient.cancelQueries({ queryKey: ['actividades/list'] })
      const previous = queryClient.getQueriesData<ActividadesListResponse>({ queryKey: ['actividades/list'] })

      const optimistic: ActividadRow = {
        id: `optimistic-${Date.now()}`,
        tipo,
        area: def.area,
        duracion_minutos: duracion,
        timestamp: new Date().toISOString(),
        xp_base: preview.base,
        xp_generado: limiteExcedido ? 0 : preview.final,
        limite_excedido: limiteExcedido,
      }

      queryClient.setQueriesData<ActividadesListResponse>(
        { queryKey: ['actividades/list'] },
        (old) => {
          if (!old) return old
          return { ...old, data: [optimistic, ...old.data], total: old.total + 1 }
        },
      )
      return { previous }
    },
    onError: (err: any, _vars, context) => {
      // Roll back the optimistic insert
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      Alert.alert('Error', err?.message ?? 'No se pudo registrar la actividad')
    },
    onSuccess: (data) => {
      onSuccess(data?.xp_otorgado ?? xpMostrado)
      resetSheet()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades/list'] })
      queryClient.invalidateQueries({ queryKey: ['actividades/today'] })
      queryClient.invalidateQueries({ queryKey: ['gamification/status'] })
    },
  })

  function resetSheet() {
    setStep(1)
    setTipo('')
    setDuracion(30)
    setGrupoMuscular('')
    setMonto('')
    setCategoria('')
  }

  function handleClose() {
    resetSheet()
    onClose()
  }

  const campos = def?.campos ?? []
  const needsGrupoMuscular = campos.includes('grupo_muscular')
  const needsMonto = campos.includes('monto')
  const needsCategoria = campos.includes('categoria')

  // Group types by area for the selector grid
  const tiposPorArea = useMemo(() => {
    const groups: Record<AreaKey, ActividadTipo[]> = {
      rutinarias: [], fisicas: [], mentales: [], economicas: [],
    }
    for (const t of TIPOS) groups[ACTIVIDADES_CATALOG[t].area].push(t)
    return groups
  }, [])

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
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>Nueva actividad</Text>
              <Text style={styles.sheetSubtitle}>Selecciona el tipo</Text>
              {(Object.keys(tiposPorArea) as AreaKey[]).map((area) => (
                <View key={area}>
                  <Text style={[styles.areaGroupLabel, { color: areaColor(area) }]}>
                    {area.toUpperCase()}
                  </Text>
                  <View style={styles.typeGrid}>
                    {tiposPorArea[area].map((t) => {
                      const selected = tipo === t
                      const ac = areaColor(area)
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.typeCell,
                            selected && { borderColor: ac, backgroundColor: `${ac}15` },
                          ]}
                          onPress={() => setTipo(t)}
                          activeOpacity={0.7}
                        >
                          <AreaDot area={area} size={30} />
                          <Text style={[styles.typeCellLabel, selected && { color: ac }]} numberOfLines={1}>
                            {ACTIVIDADES_CATALOG[t].label}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.nextBtn, !tipo && styles.nextBtnDisabled]}
                onPress={() => tipo && setStep(2)}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.step2Header}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                  <ChevronLeft size={18} color={colors.textDim} />
                  <Text style={styles.backBtnText}>Tipo</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{def?.label ?? ''}</Text>
              </View>

              {/* Duración stepper */}
              <Text style={styles.fieldLabel}>DURACIÓN</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setDuracion((d) => Math.max(5, d - 5))}>
                  <Minus size={18} color={colors.textDim} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{duracion} min</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setDuracion((d) => Math.min(480, d + 5))}>
                  <Plus size={18} color={colors.textDim} />
                </TouchableOpacity>
              </View>

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
                        <Text style={[styles.chipText, grupoMuscular === g && styles.chipTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {needsMonto && (
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
                </>
              )}

              {needsCategoria && (
                <>
                  <Text style={styles.fieldLabel}>CATEGORÍA</Text>
                  <View style={styles.chipRow}>
                    {CATEGORIAS_ECO.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.chip, categoria === c && styles.chipActive]}
                        onPress={() => setCategoria(c)}
                      >
                        <Text style={[styles.chipText, categoria === c && styles.chipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* XP Preview — recalculates in real time */}
              <View style={styles.xpPreview}>
                {limiteExcedido ? (
                  <Text style={styles.xpLimite}>Límite del área alcanzado — XP: 0</Text>
                ) : (
                  <>
                    <Zap size={16} color={colors.gold[200]} />
                    <Text style={styles.xpPreviewText}>
                      XP estimado:{' '}
                      <Text style={{ color: colors.gold[200], fontWeight: '700' }}>+{xpMostrado}</Text>
                      {preview && (
                        <Text style={{ color: colors.textDim }}>
                          {'  '}(base {preview.base} × {preview.bonusRacha.toFixed(2)} racha
                          {preview.bonusHorario > 1 ? ' × 1.2 horario' : ''})
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
                disabled={registerMutation.isPending}
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
  const { racha_actual } = useGamificationStore()
  const [activeFilter, setActiveFilter] = useState<AreaKey | 'todas'>('todas')
  const [sheetVisible, setSheetVisible] = useState(false)
  const [xpRise, setXpRise] = useState<number | null>(null)

  const { data: listResponse, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['actividades/list', activeFilter],
    queryFn: () =>
      api.actividades.list(accessToken!, { area: activeFilter === 'todas' ? undefined : activeFilter }),
    staleTime: 15_000,
    enabled: !!accessToken,
  })

  const rows = listResponse?.data ?? []
  const sections = groupByDay(rows)

  // Accumulated XP per area today (drives the daily-limit preview)
  const xpHoyPorArea = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const acc: Record<string, number> = {}
    for (const r of rows) {
      if (r.timestamp.slice(0, 10) === today) {
        acc[r.area] = (acc[r.area] ?? 0) + r.xp_generado
      }
    }
    return acc
  }, [rows])

  const onSuccess = useCallback((xp: number) => {
    setSheetVisible(false)
    if (xp > 0) setXpRise(xp)
  }, [])

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actividades</Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <Filter size={20} color={colors.textDim} />
        </TouchableOpacity>
      </View>

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

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityRow item={item} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>
              {section.data.length} actividad{section.data.length !== 1 ? 'es' : ''} · {(section as any).totalXP} XP
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.purple[200]} />
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

      <TouchableOpacity style={styles.fab} onPress={() => setSheetVisible(true)} activeOpacity={0.85}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      <RegistrarActividadSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSuccess={onSuccess}
        token={accessToken ?? ''}
        diasRacha={racha_actual}
        xpHoyPorArea={xpHoyPorArea}
      />

      {xpRise !== null && <XPRise xp={xpRise} onComplete={() => setXpRise(null)} />}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontFamily: 'Cinzel-SemiBold', fontSize: 26, fontWeight: '600', color: colors.text },
  filterBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  tabsContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent',
  },
  tabActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  tabText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  tabTextActive: { color: colors.purple[100], fontWeight: '600' },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  sectionHeader: {
    paddingTop: spacing.lg, paddingBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: 'Cinzel-SemiBold', fontSize: 13, fontWeight: '600', color: colors.text },
  sectionMeta: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.1)',
  },
  rowContent: { flex: 1 },
  rowTipo: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: colors.text },
  rowMeta: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim, marginTop: 2 },
  rowXP: { fontFamily: 'Cinzel-SemiBold', fontSize: 13, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMute, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 80, right: spacing.xl,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.purple[300],
    alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: colors.purple[300], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.bg[700], borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 40,
    borderTopWidth: 1, borderColor: colors.border, maxHeight: '92%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sheetSubtitle: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim, marginBottom: spacing.md },
  areaGroupLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, fontWeight: '500', letterSpacing: 1.5, marginTop: spacing.md, marginBottom: spacing.sm },
  step2Header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCell: {
    width: '23%', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(20,21,46,0.4)',
  },
  typeCellLabel: { fontFamily: 'Inter', fontSize: 9, color: colors.textDim, textAlign: 'center' },

  fieldLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, fontWeight: '500', color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  stepper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden',
  },
  stepperBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { flex: 1, fontFamily: 'Cinzel-SemiBold', fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  input: {
    backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: spacing.md, color: colors.text, fontFamily: 'Inter', fontSize: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  chipText: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  chipTextActive: { color: colors.purple[100] },

  xpPreview: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.lg,
    padding: spacing.md, backgroundColor: `${colors.gold[400]}15`, borderRadius: 10,
    borderWidth: 1, borderColor: `${colors.gold[300]}30`,
  },
  xpPreviewText: { flex: 1, fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  xpLimite: { fontFamily: 'Inter', fontSize: 13, color: colors.textMute, fontStyle: 'italic' },

  nextBtn: { backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
})
