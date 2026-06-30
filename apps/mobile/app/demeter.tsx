import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ChevronLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type FondoKey, type Movimiento } from '@/lib/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const FONDOS: { key: FondoKey; label: string; color: string }[] = [
  { key: 'soberbio',  label: 'Soberbio',  color: '#a855f7' },
  { key: 'michelin',  label: 'Michelin',  color: '#f472b6' },
  { key: 'odysseia',  label: 'Odysseia',  color: '#38bdf8' },
  { key: 'nemesis',   label: 'Nemesis',   color: '#94a3b8' },
  { key: 'kubera',    label: 'Kubera',    color: '#34d399' },
]

// ─── Wizard ───────────────────────────────────────────────────────────────────

function DemeterWizard({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [ingreso, setIngreso] = useState('')
  const [fondos, setFondos] = useState<Record<FondoKey, string>>({
    soberbio: '20', michelin: '20', odysseia: '20', nemesis: '20', kubera: '20',
  })

  const queryClient = useQueryClient()
  const setupMutation = useMutation({
    mutationFn: () => {
      const fondosNum: Record<FondoKey, number> = {} as Record<FondoKey, number>
      for (const f of FONDOS) fondosNum[f.key] = parseFloat(fondos[f.key]) || 0
      return api.demeter.setBudget(token, {
        ingreso_mensual: parseFloat(ingreso) || 0,
        fondos: fondosNum,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demeter/budget'] })
      queryClient.invalidateQueries({ queryKey: ['demeter/balance'] })
      onComplete()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo guardar'),
  })

  const total = Object.values(fondos).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const totalOk = Math.abs(total - 100) < 0.1

  return (
    <SafeAreaView style={wiz.root} edges={['top']}>
      {/* Progress */}
      <View style={wiz.progress}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[wiz.dot, step >= s && wiz.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={wiz.content}>
        {step === 1 && (
          <>
            <Text style={wiz.title}>¡Bienvenido a Demeter!</Text>
            <Text style={wiz.subtitle}>¿Cuánto ingresas al mes?</Text>
            <TextInput
              style={wiz.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMute}
              keyboardType="numeric"
              value={ingreso}
              onChangeText={setIngreso}
              autoFocus
            />
            <TouchableOpacity
              style={[wiz.nextBtn, !ingreso && wiz.nextBtnDisabled]}
              onPress={() => ingreso && setStep(2)}
              activeOpacity={0.85}
            >
              <Text style={wiz.nextBtnText}>Continuar →</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={wiz.title}>Distribuye tu presupuesto</Text>
            <Text style={wiz.subtitle}>Los porcentajes deben sumar 100%</Text>
            {FONDOS.map((f) => (
              <View key={f.key} style={wiz.fondoRow}>
                <View style={[wiz.fondoDot, { backgroundColor: f.color }]} />
                <Text style={wiz.fondoLabel}>{f.label}</Text>
                <TextInput
                  style={wiz.fondoInput}
                  keyboardType="numeric"
                  value={fondos[f.key]}
                  onChangeText={(v) => setFondos((p) => ({ ...p, [f.key]: v }))}
                  maxLength={5}
                />
                <Text style={wiz.fondoPct}>%</Text>
              </View>
            ))}
            <Text style={[wiz.totalLabel, !totalOk && { color: '#ef4444' }]}>
              Total: {total.toFixed(1)}%{totalOk ? ' ✓' : ' (debe ser 100%)'}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={wiz.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
                <Text style={wiz.backBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[wiz.nextBtn, { flex: 1 }, !totalOk && wiz.nextBtnDisabled]}
                onPress={() => totalOk && setStep(3)}
                activeOpacity={0.85}
              >
                <Text style={wiz.nextBtnText}>Continuar →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={wiz.title}>Confirmar configuración</Text>
            <View style={wiz.confirmCard}>
              <Text style={wiz.confirmRow}>
                Ingreso mensual: <Text style={wiz.confirmValue}>${parseFloat(ingreso).toLocaleString()}</Text>
              </Text>
              {FONDOS.map((f) => (
                <Text key={f.key} style={wiz.confirmRow}>
                  {f.label}: <Text style={[wiz.confirmValue, { color: f.color }]}>{fondos[f.key]}%</Text>
                  {' '}(${((parseFloat(ingreso) || 0) * (parseFloat(fondos[f.key]) || 0) / 100).toFixed(0)}/mes)
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={wiz.backBtn} onPress={() => setStep(2)} activeOpacity={0.7}>
                <Text style={wiz.backBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[wiz.nextBtn, { flex: 1 }, setupMutation.isPending && wiz.nextBtnDisabled]}
                onPress={() => setupMutation.mutate()}
                activeOpacity={0.85}
                disabled={setupMutation.isPending}
              >
                <Text style={wiz.nextBtnText}>
                  {setupMutation.isPending ? 'Guardando...' : 'Confirmar ✓'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const wiz = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  progress: {
    flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.xl,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.purple[300] },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.md },
  title: { fontFamily: 'Cinzel-Bold', fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontFamily: 'Inter', fontSize: 14, color: colors.textDim },
  input: {
    backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: spacing.lg, color: colors.text, fontFamily: 'Cinzel-SemiBold',
    fontSize: 28, textAlign: 'center',
  },
  fondoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fondoDot: { width: 12, height: 12, borderRadius: 6 },
  fondoLabel: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.text },
  fondoInput: {
    width: 64, backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, padding: spacing.sm, color: colors.text, fontFamily: 'Inter',
    fontSize: 14, textAlign: 'center',
  },
  fondoPct: { fontFamily: 'Inter', fontSize: 14, color: colors.textDim },
  totalLabel: { fontFamily: 'Cinzel-SemiBold', fontSize: 14, color: '#22c55e', textAlign: 'center' },
  confirmCard: {
    backgroundColor: colors.bg[700], borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, gap: spacing.md,
  },
  confirmRow: { fontFamily: 'Inter', fontSize: 14, color: colors.textDim },
  confirmValue: { fontWeight: '700', color: colors.text },
  nextBtn: {
    backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  backBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, alignItems: 'center',
  },
  backBtnText: { fontFamily: 'Inter', fontSize: 14, color: colors.textDim },
})

// ─── Movimiento Form Modal ────────────────────────────────────────────────────

function MovimientoModal({
  token,
  onClose,
}: {
  token: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fondo, setFondo] = useState<FondoKey | null>(null)

  const addMutation = useMutation({
    mutationFn: () =>
      api.demeter.addMovimiento(token, {
        tipo,
        monto: parseFloat(monto),
        descripcion,
        ...(fondo ? { fondo } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demeter/movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['demeter/balance'] })
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo registrar'),
  })

  const canSubmit = monto && parseFloat(monto) > 0 && descripcion.trim()

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Nuevo movimiento</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tipo */}
            <Text style={styles.fieldLabel}>TIPO</Text>
            <View style={styles.tipoRow}>
              {(['ingreso', 'egreso'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tipoBtn, tipo === t && (t === 'ingreso' ? styles.tipoBtnIngreso : styles.tipoBtnEgreso)]}
                  onPress={() => setTipo(t)}
                  activeOpacity={0.7}
                >
                  {t === 'ingreso' ? <TrendingUp size={16} color={tipo === t ? '#22c55e' : colors.textDim} />
                    : <TrendingDown size={16} color={tipo === t ? '#ef4444' : colors.textDim} />}
                  <Text style={[styles.tipoBtnText, tipo === t && { color: t === 'ingreso' ? '#22c55e' : '#ef4444' }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>MONTO</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMute}
              keyboardType="numeric"
              value={monto}
              onChangeText={setMonto}
            />

            <Text style={styles.fieldLabel}>DESCRIPCIÓN</Text>
            <TextInput
              style={styles.input}
              placeholder="¿En qué?"
              placeholderTextColor={colors.textMute}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={styles.fieldLabel}>FONDO (opcional)</Text>
            <View style={styles.pillRow}>
              {FONDOS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.pill, fondo === f.key && { borderColor: f.color, backgroundColor: `${f.color}15` }]}
                  onPress={() => setFondo(fondo === f.key ? null : f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, fondo === f.key && { color: f.color }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={() => canSubmit && addMutation.mutate()}
              activeOpacity={0.85}
              disabled={!canSubmit || addMutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {addMutation.isPending ? 'Guardando...' : 'Registrar'}
              </Text>
            </TouchableOpacity>
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DemeterScreen() {
  const { accessToken } = useAuthStore()
  const [movModal, setMovModal] = useState(false)
  const [filterTipo, setFilterTipo] = useState<'todos' | 'ingreso' | 'egreso'>('todos')

  const { data: budget, isLoading: loadingBudget } = useQuery({
    queryKey: ['demeter/budget'],
    queryFn: () => api.demeter.budget(accessToken!),
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const { data: balance } = useQuery({
    queryKey: ['demeter/balance'],
    queryFn: () => api.demeter.balance(accessToken!),
    enabled: !!accessToken && (budget?.configurado ?? false),
    staleTime: 30_000,
  })

  const { data: movimientosResp } = useQuery({
    queryKey: ['demeter/movimientos', filterTipo],
    queryFn: () => api.demeter.movimientos(accessToken!, {
      tipo: filterTipo === 'todos' ? undefined : filterTipo,
    }),
    enabled: !!accessToken && (budget?.configurado ?? false),
    staleTime: 30_000,
  })

  const movimientos = movimientosResp?.data ?? []

  if (loadingBudget) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!budget?.configurado) {
    return <DemeterWizard token={accessToken!} onComplete={() => {}} />
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Nav */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>DEMETER</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setMovModal(true)} activeOpacity={0.7}>
          <Plus size={20} color={colors.purple[100]} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Balance total */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>BALANCE TOTAL</Text>
          <Text style={styles.balanceAmount}>${(balance?.total ?? 0).toLocaleString()}</Text>
        </View>

        {/* Fondos grid */}
        <Text style={styles.sectionLabel}>MIS FONDOS</Text>
        <View style={styles.fondosGrid}>
          {FONDOS.map((f) => {
            const fondoData = balance?.fondos?.[f.key]
            const pct = fondoData?.porcentaje ?? budget?.fondos?.[f.key] ?? 0
            return (
              <View key={f.key} style={[styles.fondoCard, { borderLeftColor: f.color }]}>
                <Text style={[styles.fondoCardName, { color: f.color }]}>{f.label}</Text>
                <Text style={styles.fondoCardBalance}>
                  ${(fondoData?.balance ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.fondoCardPct}>{pct}%</Text>
                {/* Simple bar */}
                <View style={styles.fondoBarTrack}>
                  <View style={[styles.fondoBar, { width: `${pct}%` as `${number}%`, backgroundColor: f.color }]} />
                </View>
              </View>
            )
          })}
        </View>

        {/* Movimientos */}
        <View style={styles.movHeader}>
          <Text style={styles.sectionLabel}>MOVIMIENTOS</Text>
          <View style={styles.pillRow}>
            {(['todos', 'ingreso', 'egreso'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, filterTipo === t && styles.pillActive]}
                onPress={() => setFilterTipo(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, filterTipo === t && styles.pillTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {movimientos.length === 0 ? (
          <Text style={styles.emptyText}>Sin movimientos</Text>
        ) : (
          movimientos.map((m) => (
            <View key={m.id} style={styles.movRow}>
              <View style={[styles.movDot, { backgroundColor: m.tipo === 'ingreso' ? '#22c55e' : '#ef4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.movDesc}>{m.descripcion}</Text>
                {m.fondo && (
                  <Text style={styles.movFondo}>
                    {FONDOS.find((f) => f.key === m.fondo)?.label}
                  </Text>
                )}
              </View>
              <Text style={[styles.movMonto, { color: m.tipo === 'ingreso' ? '#22c55e' : '#ef4444' }]}>
                {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      {movModal && (
        <MovimientoModal token={accessToken!} onClose={() => setMovModal(false)} />
      )}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: 'Inter', fontSize: 14, color: colors.textDim },

  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
  },
  navTitle: { fontFamily: 'Cinzel-Bold', fontSize: 20, fontWeight: '700', color: colors.gold[200], letterSpacing: 2 },
  addBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: `${colors.purple[300]}30`, borderWidth: 1, borderColor: colors.border,
  },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  balanceCard: {
    backgroundColor: colors.bg[700], borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl,
  },
  balanceLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 2, marginBottom: spacing.xs },
  balanceAmount: { fontFamily: 'Cinzel-Bold', fontSize: 36, fontWeight: '700', color: colors.gold[200] },

  sectionLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.md },

  fondosGrid: { gap: spacing.sm, marginBottom: spacing.xl },
  fondoCard: {
    backgroundColor: colors.bg[700], borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3, padding: spacing.md, gap: 4,
  },
  fondoCardName: { fontFamily: 'Cinzel-SemiBold', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  fondoCardBalance: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text },
  fondoCardPct: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim },
  fondoBarTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(124,58,237,0.12)', overflow: 'hidden', marginTop: 4 },
  fondoBar: { height: '100%', borderRadius: 2 },

  movHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  movRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.08)',
  },
  movDot: { width: 10, height: 10, borderRadius: 5 },
  movDesc: { fontFamily: 'Inter', fontSize: 14, color: colors.text },
  movFondo: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim, marginTop: 2 },
  movMonto: { fontFamily: 'Cinzel-SemiBold', fontSize: 14, fontWeight: '600' },

  emptyText: { fontFamily: 'Inter', fontSize: 13, color: colors.textMute, textAlign: 'center', paddingVertical: spacing.xl },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.bg[700], borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 24,
    borderTopWidth: 1, borderColor: colors.border, maxHeight: '88%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  fieldLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  tipoRow: { flexDirection: 'row', gap: spacing.sm },
  tipoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: spacing.md,
  },
  tipoBtnIngreso: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)' },
  tipoBtnEgreso: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  tipoBtnText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: colors.textDim },
  input: {
    backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: spacing.md, color: colors.text, fontFamily: 'Inter', fontSize: 14,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  pillText: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  pillTextActive: { color: colors.purple[100] },
  submitBtn: { backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
})
