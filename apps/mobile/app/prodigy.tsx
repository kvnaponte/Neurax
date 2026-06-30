import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ChevronLeft, Plus, Zap } from 'lucide-react-native'
import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type ItemProdigy } from '@/lib/api'

const CATEGORIAS = ['técnica', 'arte', 'idioma', 'ciencia', 'negocio', 'social', 'otro']
const NIVELES = ['principiante', 'intermedio', 'avanzado', 'experto', 'maestro']
const NIVEL_COLOR: Record<string, string> = {
  principiante: '#60a5fa', intermedio: '#22c55e', avanzado: colors.gold[200], experto: '#f97316', maestro: '#a855f7',
}

function AddForm({ token, onClose }: { token: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('técnica')
  const [nivel, setNivel] = useState('principiante')
  const [descripcion, setDescripcion] = useState('')

  const mut = useMutation({
    mutationFn: () => api.prodigy.add(token, { nombre, categoria, nivel, descripcion: descripcion || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prodigy'] }); onClose() },
    onError: (e: any) => Alert.alert('Error', e?.message ?? 'No se pudo guardar'),
  })

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Nueva habilidad</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: 'NOMBRE *', value: nombre, setter: setNombre },
              { label: 'DESCRIPCIÓN', value: descripcion, setter: setDescripcion, multi: true },
            ].map((f) => (
              <View key={f.label}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput style={[s.input, f.multi && { height: 72, textAlignVertical: 'top' }]} value={f.value} onChangeText={f.setter} multiline={f.multi} placeholderTextColor={colors.textMute} />
              </View>
            ))}
            <Text style={s.fieldLabel}>CATEGORÍA</Text>
            <View style={s.pillRow}>
              {CATEGORIAS.map((c) => (
                <TouchableOpacity key={c} style={[s.pill, categoria === c && s.pillA]} onPress={() => setCategoria(c)} activeOpacity={0.7}>
                  <Text style={[s.pillT, categoria === c && s.pillTA]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>NIVEL</Text>
            <View style={{ gap: spacing.xs }}>
              {NIVELES.map((n) => {
                const col = NIVEL_COLOR[n]
                return (
                  <TouchableOpacity key={n} style={[s.nivelBtn, nivel === n && { borderColor: col, backgroundColor: `${col}15` }]} onPress={() => setNivel(n)} activeOpacity={0.7}>
                    <View style={[s.nivelDot, { backgroundColor: col }]} />
                    <Text style={[s.nivelT, nivel === n && { color: col, fontWeight: '700' }]}>{n.charAt(0).toUpperCase() + n.slice(1)}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity style={[s.btn, !nombre && s.btnD]} onPress={() => nombre && mut.mutate()} activeOpacity={0.85} disabled={!nombre || mut.isPending}>
              <Text style={s.btnT}>{mut.isPending ? 'Guardando...' : 'Añadir'}</Text>
            </TouchableOpacity>
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function ItemCard({ item }: { item: ItemProdigy }) {
  const color = NIVEL_COLOR[item.nivel] ?? colors.textMute
  return (
    <View style={s.card}>
      <View style={[s.icon, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}><Zap size={20} color={color} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemName}>{item.nombre}</Text>
        <Text style={s.itemSub}>{item.categoria}</Text>
      </View>
      <View style={[s.badge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
        <Text style={[s.badgeT, { color }]}>{item.nivel}</Text>
      </View>
    </View>
  )
}

export default function ProdigyScreen() {
  const { accessToken } = useAuthStore()
  const [addVisible, setAddVisible] = useState(false)
  const { data: items = [], isLoading } = useQuery({ queryKey: ['prodigy'], queryFn: () => api.prodigy.list(accessToken!), enabled: !!accessToken, staleTime: 30_000 })

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back} activeOpacity={0.7}><ChevronLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={s.title}>PRODIGY</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddVisible(true)} activeOpacity={0.7}><Plus size={20} color={colors.purple[100]} /></TouchableOpacity>
      </View>
      <FlatList data={items} keyExtractor={(i) => i.id} contentContainerStyle={s.list}
        renderItem={({ item }) => <ItemCard item={item} />}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>{isLoading ? 'Cargando...' : 'Sin habilidades'}</Text></View>}
      />
      {addVisible && <AddForm token={accessToken!} onClose={() => setAddVisible(false)} />}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: 'Cinzel-Bold', fontSize: 20, fontWeight: '700', color: colors.gold[200], letterSpacing: 2 },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: `${colors.purple[300]}30`, borderWidth: 1, borderColor: colors.border },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  card: { backgroundColor: colors.bg[700], borderRadius: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  itemName: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: colors.text },
  itemSub: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 2 },
  badgeT: { fontFamily: 'Inter', fontSize: 11, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyT: { fontFamily: 'Inter', fontSize: 14, color: colors.textMute },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { backgroundColor: colors.bg[700], borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 24, borderTopWidth: 1, borderColor: colors.border, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  fieldLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, color: colors.text, fontFamily: 'Inter', fontSize: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillA: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  pillT: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim },
  pillTA: { color: colors.purple[100] },
  nivelBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  nivelDot: { width: 10, height: 10, borderRadius: 5 },
  nivelT: { fontFamily: 'Inter', fontSize: 14, color: colors.textDim },
  btn: { backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  btnD: { opacity: 0.5 },
  btnT: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
})
