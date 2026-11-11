import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '@/constants/theme';
import { getModerationErrorMessage, getModerationWork, ModerationApiError, ModerationWork, submitModerationDecision } from '@/services/moderation';

export default function PublisherWorkReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [work, setWork] = useState<ModerationWork | null>(null);
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWork = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getModerationWork(id);
      setWork(result);
      setNote(result.reviewNote || '');
      setExpanded(result.chapters[0]?.id ?? null);
    } catch (err) {
      setError(getModerationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadWork(); }, [loadWork]);

  const decide = (decision: 'approve' | 'reject') => {
    if (!work || saving) return;
    if (work.reviewStatus !== 'submitted') {
      Alert.alert('Naskah tidak lagi menunggu review', 'Muat ulang data untuk melihat status terbaru.');
      return;
    }
    if (decision === 'reject' && !note.trim()) {
      Alert.alert('Catatan wajib diisi', 'Berikan alasan yang jelas saat meminta revisi atau menolak naskah.');
      return;
    }
    const title = decision === 'approve' ? 'Setujui dan terbitkan naskah?' : 'Tolak pengajuan naskah?';
    const message = decision === 'approve'
      ? 'Naskah dan babnya akan dipublikasikan setelah server mengonfirmasi keputusan.'
      : 'Penulis akan menerima catatan revisi yang Anda tulis.';
    Alert.alert(title, message, [
      { text: 'Batal', style: 'cancel' },
      { text: decision === 'approve' ? 'Setujui' : 'Tolak', style: decision === 'reject' ? 'destructive' : 'default', onPress: () => { void submitDecision(decision); } },
    ]);
  };

  const submitDecision = async (decision: 'approve' | 'reject') => {
    if (!work) return;
    setSaving(true);
    setError(null);
    try {
      const result = await submitModerationDecision(work.id, decision, note);
      setWork(previous => previous ? {
        ...previous,
        reviewStatus: result.reviewStatus,
        publicationStatus: result.publicationStatus,
        reviewNote: result.reviewNote,
      } : previous);
      Alert.alert(
        'Keputusan tersimpan',
        decision === 'approve' ? 'Server mengonfirmasi naskah telah disetujui dan diterbitkan.' : 'Server mengonfirmasi pengajuan ditolak.',
        [{ text: 'Kembali ke antrean', onPress: () => router.back() }],
      );
    } catch (err) {
      const message = getModerationErrorMessage(err);
      setError(message);
      if (err instanceof ModerationApiError && err.status === 409) {
        Alert.alert('Status naskah berubah', message, [{ text: 'Muat ulang', onPress: () => { void loadWork(); } }]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.green} /><Text style={styles.stateText}>Memuat manuskrip dari server...</Text></View>;
  if (!work) return <View style={styles.center}><Ionicons name="alert-circle-outline" size={30} color="#9A594B" /><Text style={styles.errorTitle}>Manuskrip tidak dapat dibuka</Text><Text style={styles.errorText}>{error || 'Naskah tidak ditemukan.'}</Text><Pressable onPress={() => loadWork()} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.backLink}>Kembali</Text></Pressable></View>;

  const canDecide = work.reviewStatus === 'submitted';
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={palette.ink} /><Text style={styles.backText}>Kembali ke antrean</Text></Pressable>
      <Text style={styles.eyebrow}>TINJAUAN NASKAH · {work.id.slice(0, 8).toUpperCase()}</Text>
      <Text style={styles.title}>{work.title}</Text>
      <Text style={styles.author}>oleh {work.author.penName}{work.author.verified ? ' · Penulis terverifikasi' : ''}</Text>
      <View style={styles.tags}><Text style={styles.tag}>{work.genre || 'Tanpa genre'}</Text><Text style={styles.tag}>{work.chapters.length} bab</Text><Text style={styles.tag}>{work.language.toUpperCase()}</Text></View>
      <View style={styles.statusPanel}><Text style={styles.statusLabel}>STATUS REVIEW</Text><Text style={styles.statusValue}>{work.reviewStatus === 'submitted' ? 'Menunggu keputusan' : work.reviewStatus === 'approved' ? 'Disetujui' : work.reviewStatus === 'rejected' ? 'Ditolak' : 'Draft'}</Text><Text style={styles.statusMeta}>Publikasi: {work.publicationStatus}</Text></View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sinopsis</Text>
        <Text style={styles.body}>{work.synopsis || 'Penulis belum menambahkan sinopsis.'}</Text>
      </View>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Manuskrip lengkap</Text><Text style={styles.sectionMeta}>{work.chapters.length} bab</Text></View>
      {work.chapters.map(chapter => <View key={chapter.id} style={styles.chapter}>
        <Pressable style={styles.chapterHead} onPress={() => setExpanded(expanded === chapter.id ? null : chapter.id)}>
          <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{String(chapter.number).padStart(2, '0')}</Text></View>
          <View style={styles.chapterInfo}><Text style={styles.chapterTitle}>{chapter.title}</Text><Text style={styles.chapterMeta}>{chapter.status} · {chapter.freePreview ? 'Pratinjau gratis' : 'Konten berbayar'}</Text></View>
          <Ionicons name={expanded === chapter.id ? 'chevron-up' : 'chevron-down'} size={18} color={palette.muted} />
        </Pressable>
        {expanded === chapter.id && <Text style={styles.chapterBody}>{chapter.content || 'Bab ini belum memiliki isi.'}</Text>}
      </View>)}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Riwayat review</Text>
        {work.reviewHistory.length ? work.reviewHistory.map((event, index) => <View key={event.createdAt + index} style={styles.historyItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineCopy}><Text style={styles.timelineTitle}>{event.decision === 'approved' ? 'Disetujui' : 'Ditolak'} · {event.moderatorRole}</Text><Text style={styles.timelineMeta}>{new Date(event.createdAt).toLocaleString('id-ID')}</Text>{event.note ? <Text style={styles.historyNote}>{event.note}</Text> : null}</View>
        </View>) : <Text style={styles.timelineEmpty}>Belum ada keputusan review sebelumnya.</Text>}
        {work.reviewNote ? <Text style={styles.latestNote}>Catatan terakhir: {work.reviewNote}</Text> : null}
      </View>
      {canDecide ? <>
        <Text style={styles.sectionTitle}>Catatan moderator</Text>
        <TextInput value={note} onChangeText={setNote} multiline maxLength={1000} placeholder="Tulis alasan persetujuan atau catatan revisi..." placeholderTextColor={palette.muted} style={styles.noteInput} textAlignVertical="top" />
        <Text style={styles.characterCount}>{note.length}/1000 karakter · Wajib saat menolak</Text>
        {error ? <View style={styles.errorBanner}><Ionicons name="alert-circle-outline" size={17} color="#9A594B" /><Text style={styles.errorBannerText}>{error}</Text></View> : null}
        <View style={styles.actions}>
          <Pressable disabled={saving} style={[styles.rejectButton, saving && styles.disabled]} onPress={() => decide('reject')}><Ionicons name="refresh-outline" size={17} color="#9A594B" /><Text style={styles.rejectText}>Tolak / revisi</Text></Pressable>
          <Pressable disabled={saving} style={[styles.approveButton, saving && styles.disabled]} onPress={() => decide('approve')}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark" size={18} color="#FFFFFF" /><Text style={styles.approveText}>Setujui & terbitkan</Text></>}</Pressable>
        </View>
      </> : <View style={styles.closedNotice}><Ionicons name="checkmark-circle-outline" size={19} color={palette.green} /><Text style={styles.closedText}>Keputusan sudah diproses. Naskah tidak dapat diputuskan kembali dari antrean ini.</Text></View>}
      <Text style={styles.disclaimer}>Konten manuskrip dan keputusan diambil dari server. Server tetap memvalidasi identitas, role reviewer/publisher, status pengajuan, dan pencatatan audit.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 20, paddingBottom: 44 },
  center: { flex: 1, backgroundColor: palette.paper, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  stateText: { color: palette.muted, fontSize: 11 },
  errorTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', marginTop: 8 },
  errorText: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  retry: { backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  backLink: { color: palette.green, fontSize: 12, fontWeight: '700', marginTop: 10 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 22 },
  backText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 8 },
  author: { color: palette.muted, fontSize: 12, marginTop: 6 },
  tags: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 15, marginBottom: 17 },
  tag: { color: palette.greenDark, backgroundColor: palette.mint, fontSize: 10, fontWeight: '700', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  statusPanel: { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 18 },
  statusLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  statusValue: { color: palette.ink, fontSize: 15, fontWeight: '800', marginTop: 5 },
  statusMeta: { color: palette.muted, fontSize: 10, marginTop: 4 },
  panel: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 15, padding: 15, marginBottom: 21 },
  panelTitle: { color: palette.ink, fontSize: 14, fontWeight: '800', marginBottom: 9 },
  body: { color: '#56645C', fontSize: 12, lineHeight: 19 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  sectionMeta: { color: palette.muted, fontSize: 10 },
  chapter: { backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, marginBottom: 9, padding: 13 },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  chapterNumber: { width: 35, height: 35, borderRadius: 11, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  chapterNumberText: { color: palette.green, fontSize: 11, fontWeight: '900' },
  chapterInfo: { flex: 1 },
  chapterTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  chapterMeta: { color: palette.muted, fontSize: 10, marginTop: 4 },
  chapterBody: { color: '#56645C', fontSize: 12, lineHeight: 20, paddingTop: 13, marginTop: 12, borderTopWidth: 1, borderTopColor: palette.line },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.green, marginTop: 4 },
  timelineCopy: { flex: 1 },
  timelineTitle: { color: palette.ink, fontSize: 11, fontWeight: '700' },
  timelineMeta: { color: palette.muted, fontSize: 10, marginTop: 3 },
  historyNote: { color: '#56645C', fontSize: 11, lineHeight: 17, marginTop: 6 },
  timelineEmpty: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  latestNote: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 10 },
  noteInput: { minHeight: 100, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: 13, padding: 13, color: palette.ink, fontSize: 12 },
  characterCount: { color: palette.muted, fontSize: 9, textAlign: 'right', marginTop: 5, marginBottom: 12 },
  errorBanner: { flexDirection: 'row', gap: 8, backgroundColor: palette.rose, padding: 11, borderRadius: 10, marginBottom: 12 },
  errorBannerText: { flex: 1, color: '#8A5145', fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 9 },
  rejectButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: palette.rose },
  rejectText: { color: '#9A594B', fontSize: 11, fontWeight: '800' },
  approveButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: palette.green },
  approveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  closedNotice: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: palette.mint, borderRadius: 12, padding: 13 },
  closedText: { color: palette.greenDark, fontSize: 11, lineHeight: 16, flex: 1 },
  disclaimer: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 16 },
});
