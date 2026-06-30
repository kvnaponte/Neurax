import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ChevronLeft, Plus, MapPin } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type Experiencia, type CalificacionSoberbio } from '@/lib/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIPOS = ['restaurante', 'bar', 'cafetería', 'club', 'galería', 'hotel', 'otro']
const CRITERIOS: { key: keyof CalificacionSoberbio; label: string }[] = [
  { key: 'ambiente',  label: 'Ambiente' },
  { key: 'atencion',  label: 'Atención' },
  { key: 'comida',    label: 'Comida' },
  { key: 'precio',    label: 'Precio' },
  { key: 'ubicacion', label: 'Ubicación' },
]

function avgRating(cal?: CalificacionSoberbio): string {
  if (!cal) return '—'
  const vals = [cal.ambiente, cal.atencion, cal.comida, cal.precio, cal.ubicacion]
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

// ─── Rating slider (1-5 using pills) ─────────────────────────────────────────

function RatingPills({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <TouchableOpacity
          key={v}
          style={[rating.btn, value >= v && rating.btnActive]}
          onPress={() => onChange(v)}
          activeOpacity={0.7}
        >
          <Text style={[rating.label, value >= v && rating.labelActive]}>{v}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const rating = StyleSheet.create({
  btn: {
    width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(20,21,46,0.4)',
  },
  btnActive: { borderColor: colors.gold[300], backgroundColor: `${colors.gold[400]}25` },
  label: { fontFamily: 'Cinzel-SemiBold', fontSize: 13, fontWeight: '600', color: colors.textMute },
  labelActive: { color: colors.gold[200] },
})

// ─── Add Experience Form ──────────────────────────────────────────────────────

function AddExperienciaForm({ token, onClose }: { token: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('restaurante')
  const [ciudad, setCiudad] = useState('')
  const [precio, setPrecio] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [urlMaps, setUrlMaps] = useState('')

  const addMutation = useMutation({
    mutationFn: () =>
      api.soberbio.add(token, {
        nombre, tipo, ciudad,
        precio_promedio: precio ? parseFloat(precio) : null,
        descripcion: descripcion || null,
        url_maps: urlMaps || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soberbio/list'] })
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo guardar'),
  })

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Nueva experiencia</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: 'NOMBRE *', value: nombre, setter: setNombre },
              { label: 'CIUDAD *', value: ciudad, setter: setCiudad },
              { label: 'PRECIO PROMEDIO', value: precio, setter: setPrecio, numeric: true },
              { label: 'DESCRIPCIÓN', value: descripcion, setter: setDescripcion, multiline: true },
              { label: 'URL MAPS', value: urlMaps, setter: setUrlMaps },
            ].map((f) => (
              <View key={f.label}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={[styles.input, f.multiline && { height: 72, textAlignVertical: 'top' }]}
                  value={f.value}
                  onChangeText={f.setter}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                  multiline={f.multiline}
                  placeholderTextColor={colors.textMute}
                />
              </View>
            ))}

            <Text style={styles.fieldLabel}>TIPO</Text>
            <View style={styles.pillRow}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, tipo === t && styles.pillActive]}
                  onPress={() => setTipo(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, tipo === t && styles.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!nombre.trim() || !ciudad.trim()) && styles.submitBtnDisabled]}
              onPress={() => nombre.trim() && ciudad.trim() && addMutation.mutate()}
              activeOpacity={0.85}
              disabled={!nombre.trim() || !ciudad.trim() || addMutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {addMutation.isPending ? 'Guardando...' : 'Añadir'}
              </Text>
            </TouchableOpacity>
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Post-visit rating modal ──────────────────────────────────────────────────

function CalificarModal({ exp, token, onClose }: { exp: Experiencia; token: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [vals, setVals] = useState<Record<keyof CalificacionSoberbio, number>>({
    ambiente: 3, atencion: 3, comida: 3, precio: 3, ubicacion: 3, nota: 0,
  })
  const [nota, setNota] = useState('')

  const calificarMutation = useMutation({
    mutationFn: () =>
      api.soberbio.calificar(token, exp.id, { ...vals, nota: nota || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soberbio/list'] })
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo calificar'),
  })

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Calificar: {exp.nombre}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {CRITERIOS.map((c) => (
              <View key={c.key} style={styles.criterioRow}>
                <Text style={styles.criterioLabel}>{c.label}</Text>
                <RatingPills
                  value={vals[c.key] as number}
                  onChange={(v) => setVals((p) => ({ ...p, [c.key]: v }))}
                />
              </View>
            ))}

            <Text style={styles.fieldLabel}>NOTA LIBRE</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={nota}
              onChangeText={setNota}
              multiline
              placeholder="¿Qué destacarías?"
              placeholderTextColor={colors.textMute}
            />

            <TouchableOpacity
              style={[styles.submitBtn, calificarMutation.isPending && styles.submitBtnDisabled]}
              onPress={() => calificarMutation.mutate()}
              activeOpacity={0.85}
              disabled={calificarMutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {calificarMutation.isPending ? 'Guardando...' : 'Guardar calificación'}
              </Text>
            </TouchableOpacity>
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// ─── Experience Card ──────────────────────────────────────────────────────────

function ExpCard({ exp, onCalificar }: { exp: Experiencia; onCalificar: () => void }) {
  return (
    <View style={styles.expCard}>
      {/* Placeholder image */}
      <View style={styles.expImg}>
        <Text style={styles.expImgEmoji}>🏛️</Text>
      </View>
      <View style={styles.expInfo}>
        <Text style={styles.expNombre}>{exp.nombre}</Text>
        <View style={styles.expMeta}>
          <MapPin size={12} color={colors.textDim} />
          <Text style={styles.expCiudad}>{exp.ciudad}</Text>
          <Text style={styles.expTipo}>{exp.tipo}</Text>
        </View>
        {exp.calificacion ? (
          <Text style={styles.expRating}>
            {CRITERIOS.map((c) => `${c.label}: ${(exp.calificacion as any)?.[c.key]}`).join(' · ')}
          </Text>
        ) : (
          <Text style={styles.expRating}>Avg: {avgRating(exp.calificacion)}</Text>
        )}
      </View>
      {exp.estado === 'planificado' && (
        <TouchableOpacity
          style={styles.calificarBtn}
          onPress={onCalificar}
          activeOpacity={0.7}
        >
          <Text style={styles.calificarBtnText}>★</Text>
        </TouchableOpacity>
      )}
      <View style={[styles.estadoBadge, exp.estado === 'visitado' ? styles.estadoVisitado : styles.estadoPlanificado]}>
        <Text style={styles.estadoBadgeText}>{exp.estado}</Text>
      </View>
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SoberbioScreen() {
  const { accessToken } = useAuthStore()
  const [addVisible, setAddVisible] = useState(false)
  const [calificar, setCalificar] = useState<Experiencia | null>(null)
  const [filterEstado, setFilterEstado] = useState<'todos' | 'planificado' | 'visitado'>('todos')

  const { data: experiencias = [], isLoading } = useQuery({
    queryKey: ['soberbio/list'],
    queryFn: () => api.soberbio.list(accessToken!),
    enabled: !!accessToken,
    staleTime: 30_000,
  })

  const filtered = filterEstado === 'todos'
    ? experiencias
    : experiencias.filter((e) => e.estado === filterEstado)

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>SOBERBIO</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)} activeOpacity={0.7}>
          <Plus size={20} color={colors.purple[100]} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['todos', 'planificado', 'visitado'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filterEstado === f && styles.filterBtnActive]}
            onPress={() => setFilterEstado(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filterEstado === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ExpCard exp={item} onCalificar={() => setCalificar(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando...' : 'Sin experiencias registradas'}
            </Text>
          </View>
        }
      />

      {addVisible && <AddExperienciaForm token={accessToken!} onClose={() => setAddVisible(false)} />}
      {calificar && <CalificarModal exp={calificar} token={accessToken!} onClose={() => setCalificar(null)} />}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
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
  filterRow: {
    flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  filterText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  filterTextActive: { color: colors.purple[100], fontWeight: '600' },
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  expCard: {
    backgroundColor: colors.bg[700], borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, overflow: 'hidden',
  },
  expImg: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: colors.bg[500],
    alignItems: 'center', justifyContent: 'center',
  },
  expImgEmoji: { fontSize: 28 },
  expInfo: { flex: 1, gap: 4 },
  expNombre: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: colors.text },
  expMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  expCiudad: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim },
  expTipo: { fontFamily: 'Inter', fontSize: 11, color: colors.textMute },
  expRating: { fontFamily: 'Inter', fontSize: 10, color: colors.textMute },
  calificarBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.gold[400]}20`,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${colors.gold[300]}40`,
  },
  calificarBtnText: { fontSize: 18, color: colors.gold[200] },
  estadoBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  estadoVisitado: { backgroundColor: 'rgba(34,197,94,0.15)' },
  estadoPlanificado: { backgroundColor: `${colors.purple[300]}20` },
  estadoBadgeText: { fontFamily: 'Inter', fontSize: 9, color: colors.textDim, textTransform: 'capitalize' },
  criterioRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  criterioLabel: { fontFamily: 'Inter', fontSize: 14, color: colors.text, width: 90 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMute },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.bg[700], borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 24,
    borderTopWidth: 1, borderColor: colors.border, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  fieldLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
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
