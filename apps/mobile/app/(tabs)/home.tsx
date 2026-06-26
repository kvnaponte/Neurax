import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated'
import {
  Bell,
  User,
  Flame,
  Trophy,
  Zap,
  Plus,
  Clock,
  Sword,
  Shield,
  Leaf,
  Sun,
  BookOpen,
  UtensilsCrossed,
  Compass,
  Star,
  Coins,
  Crown,
  Wine,
  Scale,
  ChevronRight,
} from 'lucide-react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'

import { colors, text, spacing } from '@/theme'
import { useGamificationStore } from '@/store/gamificationStore'
import { useAuthStore } from '@/store/authStore'
import { HexBadge } from '@/components/ui/HexBadge'
import { XPBar } from '@/components/ui/XPBar'
import { ActivityCard } from '@/components/ui/ActivityCard'
import { api, type ActividadHoy } from '@/lib/api'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const NIVEL_NOMBRES: Record<number, string> = {
  1: 'Superviviente',
  2: 'Aprendiz',
  3: 'Guerrero',
  4: 'Veterano',
  5: 'Campeón',
  6: 'Imbatible',
}

const SECTIONS = [
  { id: 'cronos', label: 'Cronnos', icon: Clock, color: '#818cf8', route: '/(tabs)/cronos' },
  { id: 'odin', label: 'Odin', icon: Sword, color: '#60a5fa', route: '/(tabs)/odin' },
  { id: 'leonidas', label: 'Leonidas', icon: Shield, color: '#fb923c', route: '/leonidas' },
  { id: 'demeter', label: 'Demeter', icon: Leaf, color: '#34d399', route: '/demeter' },
  { id: 'apolo', label: 'Apolo', icon: Sun, color: '#fbbf24', route: '/apolo' },
  { id: 'alejandria', label: 'Alejandría', icon: BookOpen, color: '#a855f7', route: '/alejandria' },
  { id: 'michelin', label: 'Michelin', icon: UtensilsCrossed, color: '#f472b6', route: '/michelin' },
  { id: 'odysseia', label: 'Odysseia', icon: Compass, color: '#38bdf8', route: '/odysseia' },
  { id: 'proeza', label: 'Proeza', icon: Trophy, color: '#fb923c', route: '/proeza' },
  { id: 'prodigy', label: 'Prodigy', icon: Star, color: '#fbbf24', route: '/prodigy' },
  { id: 'kubera', label: 'Kubera', icon: Coins, color: '#34d399', route: '/kubera' },
  { id: 'soberbio', label: 'Soberbio', icon: Crown, color: '#a855f7', route: '/soberbio' },
  { id: 'dionisio', label: 'Dionisio', icon: Wine, color: '#f472b6', route: '/dionisio' },
  { id: 'nemesis', label: 'Némesis', icon: Scale, color: '#94a3b8', route: '/nemesis' },
] as const

function XPCounter({ xp }: { xp: number }) {
  const animXP = useSharedValue(xp)

  useEffect(() => {
    animXP.value = withTiming(xp, { duration: 1000, easing: Easing.linear })
  }, [xp])

  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(animXP.value).toLocaleString()} XP`,
    defaultValue: `${Math.round(animXP.value).toLocaleString()} XP`,
  }))

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      animatedProps={animatedProps}
      style={styles.xpCounterText}
    />
  )
}

function LevelAvatar({ nivel }: { nivel: number }) {
  const color = (colors.niveles as Record<number, string>)[nivel] ?? colors.purple[300]
  return (
    <View style={[styles.avatar, { borderColor: color }]}>
      <Text style={[styles.avatarLevel, { color }]}>{nivel}</Text>
    </View>
  )
}

function SectionCell({ item }: { item: typeof SECTIONS[number] }) {
  const Icon = item.icon
  return (
    <TouchableOpacity
      style={styles.sectionCell}
      onPress={() => router.navigate(item.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.sectionIconWrap, { backgroundColor: `${item.color}20` }]}>
        <Icon size={20} color={item.color} />
      </View>
      <Text style={[styles.sectionLabel, { color: item.color }]} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const gamification = useGamificationStore()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [quickTipo, setQuickTipo] = useState('')
  const [quickArea, setQuickArea] = useState<ActividadHoy['area']>('rutinarias')
  const [quickDuracion, setQuickDuracion] = useState('')

  const { data: gamStatus } = useQuery({
    queryKey: ['gamification/status'],
    queryFn: () => api.gamification.status(accessToken!),
    staleTime: 30_000,
    enabled: !!accessToken,
  })

  const { data: actividadesHoy = [] } = useQuery({
    queryKey: ['actividades/today'],
    queryFn: () => api.actividades.today(accessToken!),
    staleTime: 10_000,
    enabled: !!accessToken,
  })

  // Hydrate store from query data
  useEffect(() => {
    if (gamStatus) {
      gamification.setGamification({
        xp_total: gamStatus.xp_total,
        xp_nivel_actual: gamStatus.xp_nivel_actual,
        xp_siguiente_nivel: gamStatus.xp_siguiente_nivel,
        nivel: gamStatus.nivel,
        nombre_nivel: gamStatus.nombre_nivel,
        racha_actual: gamStatus.racha_actual,
        mejor_racha: gamStatus.mejor_racha,
        bonus_xp: gamStatus.bonus_xp,
        xp_hoy: gamStatus.xp_hoy,
      })
    }
  }, [gamStatus])

  const nivel = gamification.nivel as 1 | 2 | 3 | 4 | 5 | 6
  const nombreNivel = gamification.nombre_nivel || NIVEL_NOMBRES[nivel] || `Nivel ${nivel}`
  const nivelColor = (colors.niveles as Record<number, string>)[nivel] ?? colors.purple[300]
  const xpFaltan = Math.max(0, gamification.xp_siguiente_nivel - gamification.xp_nivel_actual)
  const nextNivelName = NIVEL_NOMBRES[nivel + 1] ?? 'Imbatible'

  const visibleActividades = actividadesHoy.slice(0, 5)

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LevelAvatar nivel={nivel} />

          <XPCounter xp={gamification.xp_total} />

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellWrap}
              onPress={() => router.navigate('/notificaciones' as any)}
              activeOpacity={0.7}
            >
              <Bell size={22} color={colors.textDim} />
              {gamification.notifications_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {gamification.notifications_count > 9 ? '9+' : gamification.notifications_count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.navigate('/(tabs)/perfil' as any)}
              activeOpacity={0.7}
            >
              <User size={22} color={colors.textDim} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats grid 2×2 */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: nivelColor + '40' }]}>
            <HexBadge nivel={nivel} size="sm" />
            <Text style={[styles.statTitle, { color: nivelColor }]}>{nombreNivel}</Text>
            <Text style={styles.statSub}>Nivel actual</Text>
          </View>

          <View style={styles.statCard}>
            <Flame size={20} color="#f97316" />
            <Text style={styles.statValue}>{gamification.racha_actual} días</Text>
            <Text style={styles.statSub}>Racha actual</Text>
          </View>

          <View style={styles.statCard}>
            <Trophy size={20} color={colors.gold[200]} />
            <Text style={styles.statValue}>{gamification.mejor_racha} días</Text>
            <Text style={styles.statSub}>Récord personal</Text>
          </View>

          <View style={styles.statCard}>
            <Zap size={20} color={colors.gold[200]} />
            <Text style={[styles.statValue, { color: colors.gold[200] }]}>
              {gamification.bonus_xp.toFixed(2)}×
            </Text>
            <Text style={styles.statSub}>Multiplicador activo</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <XPBar
            xpActual={gamification.xp_nivel_actual}
            xpSiguiente={gamification.xp_siguiente_nivel}
            height={10}
          />
          <Text style={styles.xpFraction}>
            {gamification.xp_nivel_actual.toLocaleString()} / {gamification.xp_siguiente_nivel.toLocaleString()}
          </Text>
          <Text style={styles.xpHint}>
            Faltan {xpFaltan.toLocaleString()} XP para {nextNivelName}
          </Text>
        </View>

        {/* Actividades de hoy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HOY</Text>
            <Text style={[styles.xpHoy, { color: colors.gold[200] }]}>
              {gamification.xp_hoy} XP ganados hoy
            </Text>
          </View>

          {visibleActividades.length === 0 ? (
            <View style={styles.emptyState}>
              <Zap size={32} color={colors.textMute} />
              <Text style={styles.emptyText}>¡Registra tu primera actividad del día!</Text>
            </View>
          ) : (
            <View style={styles.actividadesList}>
              {visibleActividades.map((act) => (
                <ActivityCard
                  key={act.id}
                  tipo={act.tipo}
                  area={act.area}
                  hora={act.hora}
                  duracion={act.duracion}
                  xp={act.xp}
                />
              ))}
              {actividadesHoy.length > 5 && (
                <TouchableOpacity
                  style={styles.verTodas}
                  onPress={() => router.navigate('/(tabs)/activities' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.verTodasText}>Ver todas</Text>
                  <ChevronRight size={14} color={colors.purple[200]} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Grid de 14 secciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECCIONES</Text>
          <View style={styles.sectionsGrid}>
            {SECTIONS.map((item) => (
              <SectionCell key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Bottom padding so FAB doesn't overlap content */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Sheet modal for quick activity registration */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setSheetVisible(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Registro rápido</Text>

            <Text style={styles.inputLabel}>Tipo de actividad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Entrenamiento, Lectura..."
              placeholderTextColor={colors.textMute}
              value={quickTipo}
              onChangeText={setQuickTipo}
            />

            <Text style={styles.inputLabel}>Área</Text>
            <View style={styles.areaRow}>
              {(['rutinarias', 'fisicas', 'economicas', 'otras'] as const).map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaChip,
                    quickArea === area && { backgroundColor: colors.purple[300], borderColor: colors.purple[300] },
                  ]}
                  onPress={() => setQuickArea(area)}
                >
                  <Text
                    style={[
                      styles.areaChipText,
                      quickArea === area && { color: '#fff' },
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Duración (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="30"
              placeholderTextColor={colors.textMute}
              keyboardType="numeric"
              value={quickDuracion}
              onChangeText={setQuickDuracion}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => {
                // Invalidate today's activities so dashboard refreshes
                queryClient.invalidateQueries({ queryKey: ['actividades/today'] })
                queryClient.invalidateQueries({ queryKey: ['gamification/status'] })
                setSheetVisible(false)
                setQuickTipo('')
                setQuickDuracion('')
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Registrar actividad</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg[800],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: colors.bg[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLevel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  xpCounterText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 28,
    fontWeight: '700',
    color: colors.gold[200],
    textAlign: 'center',
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bellWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(20,21,46,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  statTitle: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textDim,
  },

  // XP progress
  xpSection: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  xpFraction: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  xpHint: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.textMute,
  },

  // Shared section
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Cinzel-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDim,
    letterSpacing: 2,
  },
  xpHoy: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    fontWeight: '700',
  },

  // Activities
  actividadesList: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.textMute,
    textAlign: 'center',
  },
  verTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  verTodasText: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 12,
    color: colors.purple[200],
  },

  // Sections grid
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  sectionCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  sectionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '500',
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

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.bg[700],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
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
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontFamily: 'Cinzel-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  areaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  areaChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  areaChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.textDim,
  },
  submitBtn: {
    backgroundColor: colors.purple[300],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
})
