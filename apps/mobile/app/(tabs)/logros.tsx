import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withDelay,
} from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react-native'

import { colors, spacing, duration, easing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { XPBar } from '@/components/ui/XPBar'
import { api, type Logro } from '@/lib/api'

// ─── Logro card with popIn animation ─────────────────────────────────────────

function LogroCard({ logro, index, onPress }: { logro: Logro; index: number; onPress: () => void }) {
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  React.useEffect(() => {
    const delay = (index % 9) * 50
    opacity.value = withDelay(delay, withTiming(1, { duration: duration.popIn }))
    scale.value = withDelay(delay, withTiming(1, { duration: duration.popIn, easing: easing.popIn }))
  }, [])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  const categoriaColor = colors.niveles[
    Math.min(6, Math.max(1, (logro.categoria?.length ?? 0) % 6 + 1)) as keyof typeof colors.niveles
  ] ?? colors.gold[200]

  return (
    <Animated.View style={[styles.cardWrapper, cardStyle]}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
        {/* Placeholder circle icon */}
        <View style={[
          styles.iconCircle,
          logro.desbloqueado
            ? { backgroundColor: `${categoriaColor}25`, borderColor: `${categoriaColor}60` }
            : { backgroundColor: 'rgba(71,85,105,0.2)', borderColor: 'rgba(71,85,105,0.3)' },
        ]}>
          <Trophy
            size={22}
            color={logro.desbloqueado ? categoriaColor : colors.textMute}
          />
        </View>

        <Text
          style={[styles.cardName, !logro.desbloqueado && styles.cardNameLocked]}
          numberOfLines={2}
        >
          {logro.nombre}
        </Text>

        {logro.desbloqueado ? (
          <Text style={[styles.cardXP, { color: categoriaColor }]}>
            +{logro.xp_otorgado} XP
          </Text>
        ) : logro.progreso_objetivo ? (
          <View style={styles.cardProgress}>
            <XPBar
              xpActual={logro.progreso_actual ?? 0}
              xpSiguiente={logro.progreso_objetivo}
              height={4}
            />
            <Text style={styles.cardProgressLabel}>
              {logro.progreso_actual ?? 0}/{logro.progreso_objetivo}
            </Text>
          </View>
        ) : (
          <Text style={styles.cardLocked}>Bloqueado</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function LogroModal({ logro, onClose }: { logro: Logro; onClose: () => void }) {
  const categoriaColor = colors.niveles[
    Math.min(6, Math.max(1, (logro.categoria?.length ?? 0) % 6 + 1)) as keyof typeof colors.niveles
  ] ?? colors.gold[200]

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.modal}>
        <View style={[
          styles.modalIcon,
          logro.desbloqueado
            ? { backgroundColor: `${categoriaColor}25`, borderColor: `${categoriaColor}60` }
            : { backgroundColor: 'rgba(71,85,105,0.2)', borderColor: 'rgba(71,85,105,0.3)' },
        ]}>
          <Trophy size={36} color={logro.desbloqueado ? categoriaColor : colors.textMute} />
        </View>

        <Text style={styles.modalName}>{logro.nombre}</Text>
        <Text style={styles.modalDesc}>{logro.descripcion}</Text>

        {logro.desbloqueado ? (
          <>
            <Text style={[styles.modalXP, { color: categoriaColor }]}>
              +{logro.xp_otorgado} XP obtenidos
            </Text>
            {logro.fecha_desbloqueado && (
              <Text style={styles.modalDate}>
                Desbloqueado el {new Date(logro.fecha_desbloqueado).toLocaleDateString('es-ES')}
              </Text>
            )}
          </>
        ) : logro.progreso_objetivo ? (
          <View style={{ width: '100%', gap: spacing.xs }}>
            <XPBar xpActual={logro.progreso_actual ?? 0} xpSiguiente={logro.progreso_objetivo} height={6} />
            <Text style={styles.modalProgressLabel}>
              {logro.progreso_actual ?? 0} / {logro.progreso_objetivo}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.modalCloseText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LogrosScreen() {
  const { accessToken } = useAuthStore()
  const [selected, setSelected] = useState<Logro | null>(null)

  const { data: logros = [], isLoading } = useQuery({
    queryKey: ['logros'],
    queryFn: () => api.logros.list(accessToken!),
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const desbloqueados = logros.filter((l) => l.desbloqueado).length

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LOGROS</Text>
        <Text style={styles.headerCounter}>
          {desbloqueados}/{logros.length} desbloqueados
        </Text>
      </View>

      <FlatList
        data={logros}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <LogroCard logro={item} index={index} onPress={() => setSelected(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Trophy size={48} color={colors.textMute} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando logros...' : 'No hay logros todavía'}
            </Text>
          </View>
        }
      />

      {selected && <LogroModal logro={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_SIZE = '31%'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  headerCounter: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
  },

  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing['3xl'] },
  row: { gap: spacing.sm, marginBottom: spacing.sm },

  cardWrapper: { width: CARD_SIZE },
  card: {
    backgroundColor: colors.bg[700],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 120,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  cardNameLocked: { color: colors.textMute },
  cardXP: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 10,
    fontWeight: '600',
  },
  cardProgress: { width: '100%', gap: 2 },
  cardProgressLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: colors.textMute,
    textAlign: 'center',
  },
  cardLocked: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: colors.textMute,
    fontStyle: 'italic',
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    top: '25%',
    backgroundColor: colors.bg[600],
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalName: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  modalDesc: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalXP: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 20,
    fontWeight: '700',
  },
  modalDate: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textMute,
  },
  modalProgressLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
  },
  modalClose: {
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  modalCloseText: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textMute,
  },
})
