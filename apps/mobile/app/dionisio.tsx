import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ChevronLeft, Link, Play, Check, Clock } from 'lucide-react-native'

import { colors, spacing } from '@/theme'
import { useAuthStore } from '@/store/authStore'
import { api, type VideoProcessado, type PipelineStep } from '@/lib/api'

// ─── Pipeline display ─────────────────────────────────────────────────────────

const PIPELINE_STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'descargando',    label: 'Descargando video' },
  { key: 'extrayendo',     label: 'Extrayendo audio' },
  { key: 'transcribiendo', label: 'Transcribiendo (Whisper)' },
  { key: 'clasificando',   label: 'Clasificando (IA)' },
]

const STEP_ORDER: PipelineStep[] = ['descargando', 'extrayendo', 'transcribiendo', 'clasificando', 'completado']

function stepIndex(step: PipelineStep): number {
  return STEP_ORDER.indexOf(step)
}

function PipelineProgress({ currentStep }: { currentStep: PipelineStep }) {
  return (
    <View style={pipe.container}>
      {PIPELINE_STEPS.map((s, i) => {
        const current = currentStep
        const myIndex = i
        const currentIndex = stepIndex(current)
        const isDone = currentIndex > myIndex || current === 'completado'
        const isActive = stepIndex(current) === myIndex

        return (
          <View key={s.key} style={pipe.row}>
            <View style={pipe.leftCol}>
              <View style={[
                pipe.dot,
                isDone && pipe.dotDone,
                isActive && pipe.dotActive,
              ]}>
                {isDone ? (
                  <Check size={12} color="#fff" />
                ) : isActive ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={pipe.dotInner} />
                )}
              </View>
              {i < PIPELINE_STEPS.length - 1 && (
                <View style={[pipe.line, isDone && pipe.lineDone]} />
              )}
            </View>
            <Text style={[pipe.label, isDone && pipe.labelDone, isActive && pipe.labelActive]}>
              {s.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const pipe = StyleSheet.create({
  container: { gap: 0, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 48 },
  leftCol: { alignItems: 'center', width: 28 },
  dot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.bg[600], alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { borderColor: '#22c55e', backgroundColor: '#22c55e' },
  dotActive: { borderColor: colors.purple[300], backgroundColor: colors.purple[400] },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMute },
  line: { width: 2, flex: 1, backgroundColor: colors.border, minHeight: 20 },
  lineDone: { backgroundColor: '#22c55e' },
  label: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.textMute, paddingTop: 4 },
  labelDone: { color: colors.textDim },
  labelActive: { color: colors.text, fontWeight: '600' },
})

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video, onPress }: { video: VideoProcessado; onPress: () => void }) {
  const mins = Math.floor(video.duracion_segundos / 60)
  const secs = video.duracion_segundos % 60

  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.75}>
      {/* Thumbnail placeholder */}
      <View style={card.thumbnail}>
        <Play size={24} color={colors.purple[100]} />
      </View>
      <View style={card.info}>
        <Text style={card.titulo} numberOfLines={2}>{video.titulo}</Text>
        <Text style={card.meta}>
          {video.categoria} · {mins}:{String(secs).padStart(2, '0')}
        </Text>
        <Text style={card.xp}>+{video.xp_otorgado} XP</Text>
      </View>
    </TouchableOpacity>
  )
}

const card = StyleSheet.create({
  container: {
    flexDirection: 'row', gap: spacing.md, padding: spacing.md,
    backgroundColor: colors.bg[700], borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  thumbnail: {
    width: 80, height: 60, borderRadius: 10, backgroundColor: colors.bg[500],
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  titulo: { fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: colors.text },
  meta: { fontFamily: 'Inter', fontSize: 11, color: colors.textDim },
  xp: { fontFamily: 'Cinzel-SemiBold', fontSize: 11, fontWeight: '600', color: colors.gold[200] },
})

// ─── Detail modal ─────────────────────────────────────────────────────────────

function VideoDetail({ video, onClose }: { video: VideoProcessado; onClose: () => void }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.detailSheet}>
        <View style={styles.handle} />
        <Text style={styles.detailTitle}>{video.titulo}</Text>
        <View style={styles.detailMeta}>
          <Text style={styles.detailTag}>{video.categoria}</Text>
          <Text style={styles.detailXP}>+{video.xp_otorgado} XP</Text>
        </View>
        <Text style={styles.transcriptLabel}>TRANSCRIPCIÓN</Text>
        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.transcriptText}>{video.transcripcion}</Text>
        </ScrollView>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeBtnText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DionisioScreen() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('descargando')
  const [selectedVideo, setSelectedVideo] = useState<VideoProcessado | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: videos = [] } = useQuery({
    queryKey: ['dionisio/videos'],
    queryFn: () => api.dionisio.videos(accessToken!),
    enabled: !!accessToken,
    staleTime: 30_000,
  })

  const processMutation = useMutation({
    mutationFn: () => api.dionisio.process(accessToken!, url),
    onSuccess: (data) => {
      setJobId(data.job_id)
      setPipelineStep('descargando')
      setUrl('')
    },
    onError: (err: any) => Alert.alert('Error', err?.message ?? 'URL inválida o error de red'),
  })

  // Poll pipeline status while job running
  useEffect(() => {
    if (!jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.dionisio.status(accessToken!, jobId)
        setPipelineStep(status.step)
        if (status.step === 'completado' || status.step === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
          setJobId(null)
          queryClient.invalidateQueries({ queryKey: ['dionisio/videos'] })
          if (status.step === 'error') Alert.alert('Error', 'No se pudo procesar el video')
        }
      } catch {}
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [jobId, accessToken])

  const isProcessing = jobId !== null

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>DIONISIO</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* URL input */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PROCESAR VIDEO TIKTOK</Text>
          <View style={styles.inputRow}>
            <Link size={16} color={colors.textDim} />
            <TextInput
              style={styles.urlInput}
              placeholder="https://www.tiktok.com/@..."
              placeholderTextColor={colors.textMute}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              editable={!isProcessing}
            />
          </View>
          <TouchableOpacity
            style={[styles.processBtn, (!url.trim() || isProcessing) && styles.processBtnDisabled]}
            onPress={() => url.trim() && processMutation.mutate()}
            activeOpacity={0.85}
            disabled={!url.trim() || isProcessing || processMutation.isPending}
          >
            <Text style={styles.processBtnText}>
              {processMutation.isPending ? 'Iniciando...' : 'Procesar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pipeline progress */}
        {isProcessing && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PROGRESO DEL PIPELINE</Text>
            <PipelineProgress currentStep={pipelineStep} />
          </View>
        )}

        {/* Videos list */}
        <Text style={styles.sectionLabel}>VIDEOS PROCESADOS</Text>
        {videos.length === 0 ? (
          <View style={styles.empty}>
            <Clock size={40} color={colors.textMute} />
            <Text style={styles.emptyText}>Aún no hay videos procesados</Text>
          </View>
        ) : (
          videos.map((v) => (
            <VideoCard key={v.id} video={v} onPress={() => setSelectedVideo(v)} />
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      {selectedVideo && (
        <VideoDetail video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
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
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    backgroundColor: colors.bg[700], borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.md,
  },
  sectionLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.sm },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(20,21,46,0.6)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: spacing.md,
  },
  urlInput: { flex: 1, paddingVertical: spacing.md, color: colors.text, fontFamily: 'Inter', fontSize: 13 },
  processBtn: {
    backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center',
  },
  processBtnDisabled: { opacity: 0.5 },
  processBtnText: { fontFamily: 'Cinzel-Bold', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: spacing.md },
  emptyText: { fontFamily: 'Inter', fontSize: 13, color: colors.textMute },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  detailSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg[700], borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, borderTopWidth: 1, borderColor: colors.border, maxHeight: '80%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  detailTitle: { fontFamily: 'Cinzel-Bold', fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  detailTag: {
    backgroundColor: `${colors.purple[300]}20`, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 2,
    fontFamily: 'Inter', fontSize: 12, color: colors.purple[100],
  },
  detailXP: { fontFamily: 'Cinzel-SemiBold', fontSize: 14, fontWeight: '600', color: colors.gold[200] },
  transcriptLabel: { fontFamily: 'Cinzel-Medium', fontSize: 10, color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.sm },
  transcriptText: { fontFamily: 'Inter', fontSize: 13, color: colors.text, lineHeight: 20 },
  closeBtn: {
    backgroundColor: colors.purple[300], borderRadius: 12, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.lg,
  },
  closeBtnText: { fontFamily: 'Cinzel-SemiBold', fontSize: 14, fontWeight: '600', color: '#fff' },
})
