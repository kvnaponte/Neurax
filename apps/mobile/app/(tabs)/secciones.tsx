import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  Coins, Video, Star, Film, BookOpen,
  UtensilsCrossed, Globe, Swords, Target, Trophy, Zap,
} from 'lucide-react-native'
import { colors, spacing } from '@/theme'

type Section = {
  name: string
  label: string
  sub: string
  icon: React.ReactNode
  color: string
  route: string
}

const SECTIONS: Section[] = [
  { name: 'DEMETER',     label: 'Demeter',     sub: 'Gestión financiera',      icon: <Coins size={26} />,          color: '#22c55e',          route: '/demeter' },
  { name: 'DIONISIO',   label: 'Dionisio',    sub: 'Pipeline TikTok',          icon: <Video size={26} />,          color: '#f97316',          route: '/dionisio' },
  { name: 'SOBERBIO',   label: 'Soberbio',    sub: 'Experiencias gastro',       icon: <Star size={26} />,           color: colors.gold[200],   route: '/soberbio' },
  { name: 'APOLO',      label: 'Apolo',       sub: 'Catálogo de películas',     icon: <Film size={26} />,           color: '#60a5fa',          route: '/apolo' },
  { name: 'ALEJANDRÍA', label: 'Alejandría',  sub: 'Biblioteca personal',       icon: <BookOpen size={26} />,       color: '#a855f7',          route: '/alejandria' },
  { name: 'MICHELIN',   label: 'Michelin',    sub: 'Restaurantes destacados',   icon: <UtensilsCrossed size={26} />, color: '#ef4444',         route: '/michelin' },
  { name: 'ODYSSEIA',   label: 'Odysseia',    sub: 'Viajes y destinos',         icon: <Globe size={26} />,          color: '#38bdf8',          route: '/odysseia' },
  { name: 'NEMESIS',    label: 'Nemesis',     sub: 'Desafíos personales',       icon: <Swords size={26} />,         color: '#fb923c',          route: '/nemesis' },
  { name: 'KUBERA',     label: 'Kubera',      sub: 'Metas financieras',         icon: <Target size={26} />,         color: '#fbbf24',          route: '/kubera' },
  { name: 'PROEZA',     label: 'Proeza',      sub: 'Logros físicos',            icon: <Trophy size={26} />,         color: '#f472b6',          route: '/proeza' },
  { name: 'PRODIGY',    label: 'Prodigy',     sub: 'Habilidades adquiridas',    icon: <Zap size={26} />,            color: '#818cf8',          route: '/prodigy' },
]

function SectionCard({ section }: { section: Section }) {
  return (
    <TouchableOpacity
      style={[s.card, { borderColor: `${section.color}25` }]}
      onPress={() => router.push(section.route as any)}
      activeOpacity={0.75}
    >
      <View style={[s.iconWrap, { backgroundColor: `${section.color}15` }]}>
        {React.cloneElement(section.icon as React.ReactElement, { color: section.color })}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.sectionName}>{section.name}</Text>
        <Text style={s.sectionSub}>{section.sub}</Text>
      </View>
      <View style={[s.arrow, { borderColor: `${section.color}30` }]}>
        <Text style={[s.arrowT, { color: section.color }]}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function SeccionesScreen() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>SECCIONES</Text>
        <Text style={s.headerSub}>Módulos de vida</Text>
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <SectionCard key={section.name} section={section} />
        ))}
        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg[800] },
  header: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: 'Cinzel-Bold', fontSize: 22, fontWeight: '700', color: colors.gold[200], letterSpacing: 2 },
  headerSub: { fontFamily: 'Inter', fontSize: 13, color: colors.textDim, marginTop: 2 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg[700], borderRadius: 16, borderWidth: 1,
    padding: spacing.md,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionName: { fontFamily: 'Cinzel-SemiBold', fontSize: 13, fontWeight: '600', color: colors.text, letterSpacing: 1 },
  sectionSub: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim },
  arrow: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arrowT: { fontSize: 20, fontWeight: '700', lineHeight: 22 },
})
