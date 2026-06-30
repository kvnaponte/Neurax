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
import { ChevronLeft, Plus, BookOpen } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { XPBar } from '@/components/ui/XPBar'
import { api, type LibroAlejandria } from '@/lib/api'

const ESTADOS = ['leyendo', 'completado', 'pendiente'] as const
const GENEROS = ['Ficción', 'No ficción', 'Ensayo', 'Filosofía', 'Historia', 'Ciencia', 'Arte', 'Otro']

const ESTADO_COLOR: Record<LibroAlejandria['estado'], string> = {
  leyendo: colors.purple[200],
  completado: '#22c55e',
  pendiente: colors.textMute,
}

const BOOK_COLORS = ['#a855f7', '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#fbbf24', '#38bdf8', '#818cf8']

function bookColor(titulo: string): string {
  return BOOK_COLORS[titulo.charCodeAt(0) % BOOK_COLORS.length]
}

function AddLibroForm({ token, onClose }: { token: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [anio, setAnio] = useState('')
  const [paginas, setPaginas] = useState('')
  const [genero, setGenero] = useState('')
  const [estado, setEstado] = useState<LibroAlejandria['estado']>('pendiente')

  const addMutation = useMutation({
    mutationFn: () =>
      api.alejandria.add(token, {
        titulo, autor, estado,
        anio: anio ? parseInt(anio) : null,
        paginas: paginas ? parseInt(paginas) : null,
        genero: genero || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alejandria/list'] })
      onClose()
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'No se pudo guardar'),
  })

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrapper}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Añadir libro</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: 'TÍTULO *', value: titulo, setter: setTitulo },
              { label: 'AUTOR *', value: autor, setter: setAutor },
              { label: 'AÑO', value: anio, setter: setAnio, numeric: true },
              { label: 'PÁGINAS', value: paginas, setter: setPaginas, numeric: true },
            ].map((f) => (
              <View key={f.label}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={f.value}
                  onChangeText={f.setter}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                  placeholderTextColor={colors.textMute}
                />
              </View>
            ))}

            <Text style={s.fieldLabel}>GÉNERO</Text>
            <View style={s.pillRow}>
              {GENEROS.map((g) => (
                <TouchableOpacity key={g} style={[s.pill, genero === g && s.pillActive]} onPress={() => setGenero(g === genero ? '' : g)} activeOpacity={0.7}>
                  <Text style={[s.pillText, genero === g && s.pillTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>ESTADO</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {ESTADOS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[s.pill, { flex: 1, justifyContent: 'center' }, estado === e && { borderColor: ESTADO_COLOR[e], backgroundColor: `${ESTADO_COLOR[e]}15` }]}
                  onPress={() => setEstado(e)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.pillText, estado === e && { color: ESTADO_COLOR[e] }]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.submitBtn, (!titulo.trim() || !autor.trim()) && s.submitBtnDisabled]}
              onPress={() => titulo.trim() && autor.trim() && addMutation.mutate()}
              activeOpacity={0.85}
              disabled={!titulo.trim() || !autor.trim() || addMutation.isPending}
            >
              <Text style={s.submitBtnText}>{addMutation.isPending ? 'Guardando...' : 'Añadir'}</Text>
            </TouchableOpacity>
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function LibroCard({ libro }: { libro: LibroAlejandria }) {
  const color = bookColor(libro.titulo)
  const estadoColor = ESTADO_COLOR[libro.estado]
  return (
    <View style={s.libroCard}>
      <View style={[s.portada, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
        <BookOpen size={24} color={color} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.libroTitulo} numberOfLines={2}>{libro.titulo}</Text>
        <Text style={s.libroAutor}>{libro.autor}</Text>
        {libro.estado === 'leyendo' && libro.paginas && libro.pagina_actual && (
          <View style={{ gap: 2, marginTop: 4 }}>
            <XPBar xpActual={libro.pagina_actual} xpSiguiente={libro.paginas} height={4} />
            <Text style={s.libroPaginas}>{libro.pagina_actual}/{libro.paginas} páginas</Text>
          </View>
        )}
        {libro.fecha_completado && (
          <Text style={s.libroFecha}>
            Terminado {new Date(libro.fecha_completado).toLocaleDateString('es-ES')}
          </Text>
        )}
      </View>
      <View style={[s.estadoBadge, { backgroundColor: `${estadoColor}15` }]}>
        <Text style={[s.estadoText, { color: estadoColor }]}>{libro.estado}</Text>
      </View>
    </View>
  )
}

export default function AlejandriaScreen() {
  const { accessToken } = useAuthStore()
  const [addVisible, setAddVisible] = useState(false)
  const [filterEstado, setFilterEstado] = useState<LibroAlejandria['estado'] | 'todos'>('todos')

  const { data: libros = [], isLoading } = useQuery({
    queryKey: ['alejandria/list', filterEstado],
    queryFn: () => api.alejandria.list(accessToken!, filterEstado === 'todos' ? undefined : filterEstado),
    enabled: !!accessToken,
    staleTime: 30_000,
  })

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.navTitle}>ALEJANDRÍA</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddVisible(true)} activeOpacity={0.7}>
          <Plus size={20} color={colors.purple[100]} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {(['todos', ...ESTADOS] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filterEstado === f && s.filterBtnActive]}
            onPress={() => setFilterEstado(f)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterText, filterEstado === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={libros}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => <LibroCard libro={item} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>{isLoading ? 'Cargando...' : 'Sin libros'}</Text>
          </View>
        }
      />

      {addVisible && <AddLibroForm token={accessToken!} onClose={() => setAddVisible(false)} />}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border },
  navTitle: { fontFamily: 'Cinzel-Bold', fontSize: 20, fontWeight: '700', color: colors.gold[200], letterSpacing: 2 },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: `${colors.purple[300]}30`, borderWidth: 1, borderColor: colors.border },
  filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  filterBtnActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  filterText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  filterTextActive: { color: colors.purple[100], fontWeight: '600' },
  listContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  libroCard: {
    backgroundColor: colors.bg[700], borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md,
  },
  portada: { width: 54, height: 72, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  libroTitulo: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: colors.text },
  libroAutor: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  libroPaginas: { fontFamily: 'Inter', fontSize: 10, color: colors.textMute },
  libroFecha: { fontFamily: 'Inter', fontSize: 10, color: '#22c55e' },
  estadoBadge: { borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  estadoText: { fontFamily: 'Inter', fontSize: 10, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 80 },
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
  input: { backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, color: colors.text, fontFamily: 'Inter', fontSize: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignItems: 'center' },
  pillActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  pillText: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  pillTextActive: { color: colors.purple[100] },
  submitBtn: { backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
})
