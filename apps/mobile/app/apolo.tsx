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
import { ChevronLeft, Plus, X } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type Pelicula, type EstadoPelicula } from '@/lib/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIA_COLOR: Record<number, string> = {
  1: '#34d399', 2: '#fb923c', 3: '#a855f7', 4: '#60a5fa', 5: '#f472b6', 6: '#fbbf24',
}

const ESTADOS: { key: EstadoPelicula | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'visto', label: 'Visto' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'descartado', label: 'Descartado' },
]

const ESTADO_COLOR: Record<EstadoPelicula, string> = {
  visto: '#22c55e',
  pendiente: colors.gold[200],
  descartado: '#ef4444',
}

// ─── Poster placeholder ───────────────────────────────────────────────────────

function Poster({ pelicula, onPress }: { pelicula: Pelicula; onPress: () => void }) {
  const catColor = CATEGORIA_COLOR[pelicula.categoria ?? 1] ?? colors.purple[200]
  return (
    <TouchableOpacity style={posterStyles.container} onPress={onPress} activeOpacity={0.8}>
      {/* Colored placeholder background */}
      <View style={[posterStyles.bg, { backgroundColor: `${catColor}18` }]}>
        {/* Category badge top-right */}
        <View style={[posterStyles.badge, { backgroundColor: catColor }]}>
          <Text style={posterStyles.badgeText}>{pelicula.categoria ?? '?'}</Text>
        </View>

        {/* Title overlay */}
        <View style={posterStyles.titleOverlay}>
          <Text style={posterStyles.titulo} numberOfLines={3}>{pelicula.titulo}</Text>
          {pelicula.anio && <Text style={posterStyles.anio}>{pelicula.anio}</Text>}
        </View>

        {/* Rating */}
        {pelicula.calificacion != null && (
          <View style={posterStyles.ratingBadge}>
            <Text style={posterStyles.ratingText}>{pelicula.calificacion.toFixed(1)} / 5</Text>
          </View>
        )}

        {/* Estado dot */}
        <View style={[posterStyles.estadoDot, { backgroundColor: ESTADO_COLOR[pelicula.estado] }]} />
      </View>
    </TouchableOpacity>
  )
}

const posterStyles = StyleSheet.create({
  container: { width: '48%', marginBottom: spacing.md },
  bg: {
    aspectRatio: 2 / 3, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', position: 'relative',
  },
  badge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: 'Cinzel-Bold', fontSize: 11, fontWeight: '700', color: '#000' },
  titleOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.sm, backgroundColor: 'rgba(7,6,26,0.85)',
  },
  titulo: { fontFamily: 'Cinzel-SemiBold', fontSize: 11, fontWeight: '600', color: colors.text },
  anio: { fontFamily: 'Inter', fontSize: 9, color: colors.textDim, marginTop: 2 },
  ratingBadge: {
    position: 'absolute', top: spacing.sm, left: spacing.sm,
    backgroundColor: 'rgba(7,6,26,0.8)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingText: { fontFamily: 'Cinzel-SemiBold', fontSize: 9, fontWeight: '600', color: colors.gold[200] },
  estadoDot: {
    position: 'absolute', bottom: spacing.sm + 42, right: spacing.sm,
    width: 8, height: 8, borderRadius: 4,
  },
})

// ─── Add / Edit Form ──────────────────────────────────────────────────────────

function PeliculaForm({
  token,
  initial,
  onClose,
}: {
  token: string
  initial?: Pelicula
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState(initial?.titulo ?? '')
  const [anio, setAnio] = useState(initial?.anio?.toString() ?? '')
  const [director, setDirector] = useState(initial?.director ?? '')
  const [pais, setPais] = useState(initial?.pais ?? '')
  const [genero, setGenero] = useState(initial?.genero ?? '')
  const [estado, setEstado] = useState<EstadoPelicula>(initial?.estado ?? 'pendiente')
  const [calificacion, setCalificacion] = useState(initial?.calificacion?.toString() ?? '')

  const addMutation = useMutation({
    mutationFn: () =>
      api.apolo.add(token, {
        titulo, estado,
        anio: anio ? parseInt(anio) : null,
        director: director || null,
        pais: pais || null,
        genero: genero || null,
        calificacion: calificacion ? parseFloat(calificacion) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apolo/peliculas'] })
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo guardar'),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      api.apolo.update(token, initial!.id, {
        titulo, estado,
        anio: anio ? parseInt(anio) : null,
        director: director || null,
        pais: pais || null,
        genero: genero || null,
        calificacion: calificacion ? parseFloat(calificacion) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apolo/peliculas'] })
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo actualizar'),
  })

  const mutation = initial ? updateMutation : addMutation

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{initial ? 'Editar película' : 'Añadir película'}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: 'TÍTULO *', value: titulo, setter: setTitulo, required: true },
              { label: 'AÑO', value: anio, setter: setAnio, numeric: true },
              { label: 'DIRECTOR', value: director, setter: setDirector },
              { label: 'PAÍS', value: pais, setter: setPais },
              { label: 'GÉNERO', value: genero, setter: setGenero },
              { label: 'CALIFICACIÓN (1-5)', value: calificacion, setter: setCalificacion, numeric: true },
            ].map((f) => (
              <View key={f.label}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.setter}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                  placeholderTextColor={colors.textMute}
                />
              </View>
            ))}

            <Text style={styles.fieldLabel}>ESTADO</Text>
            <View style={styles.estadoRow}>
              {(['visto', 'pendiente', 'descartado'] as EstadoPelicula[]).map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.estadoBtn,
                    estado === e && { borderColor: ESTADO_COLOR[e], backgroundColor: `${ESTADO_COLOR[e]}15` },
                  ]}
                  onPress={() => setEstado(e)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.estadoBtnText, estado === e && { color: ESTADO_COLOR[e] }]}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !titulo.trim() && styles.submitBtnDisabled]}
              onPress={() => titulo.trim() && mutation.mutate()}
              activeOpacity={0.85}
              disabled={!titulo.trim() || mutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {mutation.isPending ? 'Guardando...' : (initial ? 'Actualizar' : 'Añadir')}
              </Text>
            </TouchableOpacity>
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function PeliculaDetail({
  pelicula,
  token,
  onClose,
  onEdit,
}: {
  pelicula: Pelicula
  token: string
  onClose: () => void
  onEdit: () => void
}) {
  const queryClient = useQueryClient()
  const catColor = CATEGORIA_COLOR[pelicula.categoria ?? 1] ?? colors.purple[200]

  const deleteMutation = useMutation({
    mutationFn: () => api.apolo.delete(token, pelicula.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apolo/peliculas'] })
      onClose()
    },
  })

  const fields = [
    { label: 'Director', value: pelicula.director },
    { label: 'País', value: pelicula.pais },
    { label: 'Género', value: pelicula.genero },
    { label: 'Estado', value: pelicula.estado },
  ].filter((f) => f.value)

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.detailModal}>
        {/* Category badge */}
        <View style={[styles.detailBadge, { backgroundColor: `${catColor}20`, borderColor: `${catColor}50` }]}>
          <Text style={[styles.detailBadgeText, { color: catColor }]}>
            Categoría {pelicula.categoria ?? '?'}
          </Text>
        </View>

        <Text style={styles.detailTitle}>{pelicula.titulo}</Text>
        {pelicula.anio && <Text style={styles.detailAnio}>{pelicula.anio}</Text>}

        {pelicula.calificacion != null && (
          <Text style={styles.detailRating}>{pelicula.calificacion.toFixed(1)} / 5</Text>
        )}

        {fields.map((f) => (
          <View key={f.label} style={styles.detailRow}>
            <Text style={styles.detailKey}>{f.label}</Text>
            <Text style={styles.detailVal}>{f.value}</Text>
          </View>
        ))}

        <View style={styles.detailActions}>
          <TouchableOpacity style={styles.detailEditBtn} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.detailEditText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.detailDeleteBtn}
            onPress={() =>
              Alert.alert('Eliminar', '¿Eliminar esta película?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate() },
              ])
            }
            activeOpacity={0.7}
          >
            <X size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ApoloScreen() {
  const { accessToken } = useAuthStore()
  const [filterEstado, setFilterEstado] = useState<EstadoPelicula | 'todas'>('todas')
  const [addVisible, setAddVisible] = useState(false)
  const [selected, setSelected] = useState<Pelicula | null>(null)
  const [editing, setEditing] = useState<Pelicula | null>(null)

  const { data: peliculas = [], isLoading } = useQuery({
    queryKey: ['apolo/peliculas', filterEstado],
    queryFn: () => api.apolo.list(accessToken!, filterEstado === 'todas' ? undefined : filterEstado),
    enabled: !!accessToken,
    staleTime: 30_000,
  })

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Nav */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>MI CINETECA</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)} activeOpacity={0.7}>
          <Plus size={20} color={colors.purple[100]} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {ESTADOS.map((e) => (
          <TouchableOpacity
            key={e.key}
            style={[styles.filterBtn, filterEstado === e.key && styles.filterBtnActive]}
            onPress={() => setFilterEstado(e.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filterEstado === e.key && styles.filterTextActive]}>
              {e.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Movie grid */}
      <FlatList
        data={peliculas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing['3xl'] }}
        renderItem={({ item }) => (
          <Poster pelicula={item} onPress={() => setSelected(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando...' : 'Sin películas. ¡Añade la primera!'}
            </Text>
          </View>
        }
      />

      {addVisible && (
        <PeliculaForm token={accessToken!} onClose={() => setAddVisible(false)} />
      )}
      {selected && !editing && (
        <PeliculaDetail
          pelicula={selected}
          token={accessToken!}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null) }}
        />
      )}
      {editing && (
        <PeliculaForm
          token={accessToken!}
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A1A' },

  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  navTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: '#e2e8f0', letterSpacing: 1.5 },
  addBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: `${colors.purple[300]}30`, borderWidth: 1, borderColor: colors.border,
  },

  filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  filterBtnActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}25` },
  filterText: { fontFamily: 'Inter', fontSize: 13, color: 'rgba(148,163,184,0.8)' },
  filterTextActive: { color: colors.purple[100], fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontFamily: 'Inter', fontSize: 14, color: 'rgba(71,85,105,0.8)' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
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
  estadoRow: { flexDirection: 'row', gap: spacing.sm },
  estadoBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
  },
  estadoBtnText: { fontFamily: 'Inter', fontSize: 12, fontWeight: '600', color: colors.textDim },
  submitBtn: {
    backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  detailModal: {
    position: 'absolute', left: spacing.xl, right: spacing.xl, top: '20%',
    backgroundColor: colors.bg[600], borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, gap: spacing.sm,
  },
  detailBadge: {
    alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 3,
  },
  detailBadgeText: { fontFamily: 'Cinzel-SemiBold', fontSize: 11, fontWeight: '600' },
  detailTitle: { fontFamily: 'Cinzel-Bold', fontSize: 20, fontWeight: '700', color: colors.text },
  detailAnio: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  detailRating: { fontFamily: 'Cinzel-Bold', fontSize: 24, fontWeight: '700', color: colors.gold[200] },
  detailRow: { flexDirection: 'row', gap: spacing.md },
  detailKey: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim, width: 70 },
  detailVal: { fontFamily: 'Inter', fontSize: 12, color: colors.text, flex: 1, textTransform: 'capitalize' },
  detailActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  detailEditBtn: {
    flex: 1, backgroundColor: colors.purple[300], borderRadius: 10,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
  detailEditText: { fontFamily: 'Cinzel-SemiBold', fontSize: 13, fontWeight: '600', color: '#fff' },
  detailDeleteBtn: {
    width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center',
  },
})
