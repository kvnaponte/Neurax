import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { User, LogOut, Edit2, Camera } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { XPBar } from '@/components/ui/XPBar'
import { api } from '@/lib/api'

// ─── XP Week Chart ────────────────────────────────────────────────────────────

function XPWeekChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  return (
    <View style={chartStyles.container}>
      {data.map((xp, i) => (
        <View key={i} style={chartStyles.barCol}>
          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.bar,
                { height: `${(xp / max) * 100}%` as `${number}%` },
              ]}
            />
          </View>
          <Text style={chartStyles.label}>{dias[i]}</Text>
        </View>
      ))}
    </View>
  )
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 80,
    paddingTop: spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.purple[300],
    borderRadius: 4,
    minHeight: 3,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: colors.textMute,
  },
})

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditModal({
  nombre,
  onClose,
  onSave,
}: {
  nombre: string
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [value, setValue] = useState(nombre)
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.editModal}>
        <Text style={styles.editModalTitle}>Editar perfil</Text>
        <Text style={styles.editModalLabel}>NOMBRE</Text>
        <TextInput
          style={styles.editInput}
          value={value}
          onChangeText={setValue}
          placeholderTextColor={colors.textMute}
          autoFocus
        />
        <View style={styles.editRow}>
          <TouchableOpacity style={styles.editCancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.editCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editSaveBtn}
            onPress={() => onSave(value)}
            activeOpacity={0.85}
          >
            <Text style={styles.editSaveText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

const NIVEL_COLORES: Record<number, string> = {
  1: '#34d399', 2: '#fb923c', 3: '#a855f7', 4: '#60a5fa', 5: '#f472b6', 6: '#fbbf24',
}

export default function PerfilScreen() {
  const { user, accessToken, logout } = useAuthStore()
  const gamification = useGamificationStore()
  const queryClient = useQueryClient()
  const [editVisible, setEditVisible] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const { data: perfil } = useQuery({
    queryKey: ['perfil'],
    queryFn: () => api.perfil.get(accessToken!),
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const updateMutation = useMutation({
    mutationFn: (nombre: string) =>
      api.perfil.update(accessToken!, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil'] })
      setEditVisible(false)
    },
  })

  const nivelColor = NIVEL_COLORES[Math.min(6, gamification.nivel)] ?? colors.gold[200]
  const xpSemana = perfil?.xp_por_semana ?? [0, 0, 0, 0, 0, 0, 0]
  const displayAvatar = avatarUri ?? perfil?.avatar_url ?? null

  async function handleAvatarPress() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar el avatar.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    setAvatarUri(asset.uri)
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', {
        uri: asset.uri,
        name: 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as any)
      await api.perfil.uploadAvatar(accessToken!, formData)
      queryClient.invalidateQueries({ queryKey: ['perfil'] })
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo subir el avatar')
      setAvatarUri(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} disabled={uploadingAvatar}>
            <View style={[styles.avatar, { borderColor: nivelColor }]}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
              ) : (
                <User size={40} color={nivelColor} />
              )}
              <View style={[styles.cameraOverlay, uploadingAvatar && { opacity: 0.5 }]}>
                <Camera size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.nombre ?? '—'}</Text>
          <View style={[styles.nivelBadge, { backgroundColor: `${nivelColor}20`, borderColor: `${nivelColor}60` }]}>
            <Text style={[styles.nivelText, { color: nivelColor }]}>
              Nivel {gamification.nivel} · {gamification.nombre_nivel}
            </Text>
          </View>
          <Text style={styles.xpTotal}>
            {gamification.xp_total.toLocaleString()} XP totales
          </Text>
        </View>

        {/* XP progress bar */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>PROGRESO AL SIGUIENTE NIVEL</Text>
            <Text style={styles.cardValue}>
              {gamification.xp_nivel_actual.toLocaleString()} / {gamification.xp_siguiente_nivel.toLocaleString()} XP
            </Text>
          </View>
          <XPBar
            xpActual={gamification.xp_nivel_actual}
            xpSiguiente={gamification.xp_siguiente_nivel}
            height={10}
          />
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{gamification.racha_actual}</Text>
            <Text style={styles.statLabel}>Días racha</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{perfil?.actividades_semana ?? 0}</Text>
            <Text style={styles.statLabel}>Act. semana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {perfil?.logros_desbloqueados ?? 0}/{perfil?.logros_total ?? 0}
            </Text>
            <Text style={styles.statLabel}>Logros</Text>
          </View>
        </View>

        {/* XP week chart */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>XP ESTA SEMANA</Text>
          <XPWeekChart data={xpSemana} />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setEditVisible(true)}
          activeOpacity={0.7}
        >
          <Edit2 size={18} color={colors.purple[100]} />
          <Text style={styles.actionBtnText}>Editar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.logoutBtn]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color='#ef4444' />
          <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      {editVisible && (
        <EditModal
          nombre={user?.nombre ?? ''}
          onClose={() => setEditVisible(false)}
          onSave={(nombre) => updateMutation.mutate(nombre)}
        />
      )}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },

  avatarSection: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    backgroundColor: colors.bg[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.purple[300],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg[800],
  },
  userName: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  nivelBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  nivelText: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  xpTotal: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
  },

  card: {
    backgroundColor: colors.bg[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
  },
  cardValue: {
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
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg[700],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: colors.gold[200],
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg[700],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  logoutBtn: { borderColor: 'rgba(239,68,68,0.3)' },
  actionBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: colors.purple[100],
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  editModal: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    top: '30%',
    backgroundColor: colors.bg[600],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  editModalTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  editModalLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1.5,
  },
  editInput: {
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 16,
  },
  editRow: { flexDirection: 'row', gap: spacing.sm },
  editCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  editCancelText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textDim,
  },
  editSaveBtn: {
    flex: 1,
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  editSaveText: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
})
