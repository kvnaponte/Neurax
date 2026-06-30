import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Swipeable } from 'react-native-gesture-handler'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ChevronLeft, Bell, Check, Trash2 } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { api, type Notificacion, type NotifConfig, type NotifTipo } from '@/lib/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIPO_COLOR: Record<NotifTipo, string> = {
  racha:   '#f97316',
  mision:  colors.gold[200],
  cronos:  '#818cf8',
  ia:      '#38bdf8',
  logro:   '#22c55e',
  sistema: colors.textDim,
}

const CONFIG_LABELS: { key: keyof NotifConfig; label: string; desc: string }[] = [
  { key: 'rachas',   label: 'Rachas',   desc: 'Alertas de racha en peligro y nuevos récords' },
  { key: 'misiones', label: 'Misiones', desc: 'Nuevas misiones Odin y recordatorios' },
  { key: 'cronos',   label: 'Cronos',   desc: 'Inicio y fin de eventos del timeline' },
  { key: 'ia',       label: 'IA',       desc: 'Resultados del pipeline Dionisio y clasificaciones' },
]

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// ─── Notification Row ────────────────────────────────────────────────────────

function NotifRow({
  item,
  onMarkRead,
  onDelete,
}: {
  item: Notificacion
  onMarkRead: () => void
  onDelete: () => void
}) {
  const dotColor = TIPO_COLOR[item.tipo] ?? colors.textDim

  const renderRight = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeBtn, { backgroundColor: colors.purple[400] }]}
        onPress={onMarkRead}
      >
        <Check size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, { backgroundColor: '#ef4444' }]}
        onPress={onDelete}
      >
        <Trash2 size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  return (
    <Swipeable
      renderRightActions={renderRight}
      onSwipeableOpen={() => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) } catch {}
      }}
    >
      <View style={[styles.notifRow, item.leida && styles.notifRowRead]}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, item.leida && styles.notifTitleRead]}>
            {item.titulo}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.cuerpo}</Text>
        </View>
        <View style={styles.notifMeta}>
          <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
          {!item.leida && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </Swipeable>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NotificacionesScreen() {
  const { accessToken } = useAuthStore()
  const { notifications_count } = useGamificationStore()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'lista' | 'config'>('lista')

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => api.notificaciones.list(accessToken!),
    enabled: !!accessToken,
    staleTime: 30_000,
  })

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['notificaciones/config'],
    queryFn: () => api.notificaciones.getConfig(accessToken!),
    enabled: !!accessToken && tab === 'config',
    staleTime: 60_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notificaciones.markRead(accessToken!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.notificaciones.delete(accessToken!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  const updateConfigMutation = useMutation({
    mutationFn: (cfg: Partial<NotifConfig>) => api.notificaciones.updateConfig(accessToken!, cfg),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones/config'] }),
  })

  const unread = notifs.filter((n) => !n.leida).length

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICACIONES</Text>
        {unread > 0 ? (
          <View style={styles.unreadTotal}>
            <Text style={styles.unreadTotalText}>{unread}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'lista' && styles.tabBtnActive]}
          onPress={() => setTab('lista')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, tab === 'lista' && styles.tabTextActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'config' && styles.tabBtnActive]}
          onPress={() => setTab('config')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, tab === 'config' && styles.tabTextActive]}>Configurar</Text>
        </TouchableOpacity>
      </View>

      {tab === 'lista' ? (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotifRow
              item={item}
              onMarkRead={() => markReadMutation.mutate(item.id)}
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={48} color={colors.textMute} />
              <Text style={styles.emptyText}>
                {isLoading ? 'Cargando...' : 'Sin notificaciones'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={CONFIG_LABELS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.configRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>{item.label}</Text>
                <Text style={styles.configDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={config?.[item.key] ?? true}
                onValueChange={(val) => updateConfigMutation.mutate({ [item.key]: val })}
                trackColor={{ false: colors.bg[500], true: `${colors.purple[300]}80` }}
                thumbColor={config?.[item.key] ? colors.purple[200] : colors.textMute}
                disabled={loadingConfig}
              />
            </View>
          )}
        />
      )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: {
    fontFamily: 'Cinzel-Bold', fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: 1,
  },
  unreadTotal: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purple[300],
    alignItems: 'center', justifyContent: 'center',
  },
  unreadTotalText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff' },

  tabRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive: { borderColor: colors.purple[300], backgroundColor: `${colors.purple[300]}20` },
  tabText: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim },
  tabTextActive: { color: colors.purple[100], fontWeight: '600' },

  listContent: { paddingBottom: spacing['3xl'] },

  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.bg[800],
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.08)',
  },
  notifRowRead: { opacity: 0.6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: colors.text },
  notifTitleRead: { fontWeight: '400', color: colors.textDim },
  notifBody: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim, lineHeight: 18 },
  notifMeta: { alignItems: 'flex-end', gap: 6 },
  notifTime: { fontFamily: 'Inter', fontSize: 11, color: colors.textMute },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.purple[200] },

  swipeActions: { flexDirection: 'row' },
  swipeBtn: {
    width: 60, justifyContent: 'center', alignItems: 'center',
  },

  configRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.08)',
  },
  configLabel: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: colors.text },
  configDesc: { fontFamily: 'Inter', fontSize: 12, color: colors.textDim, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMute },
})
