import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { palette } from '@/constants/theme';
import { getChapterContent, getNexverseApiErrorMessage, NexverseApiError, type ChapterContent } from '@/services/catalog';

export default function ReaderScreen() {
  const { slug, chapterId } = useLocalSearchParams<{ slug: string; chapterId: string }>();
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [fontSize, setFontSize] = useState(17);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumRequired, setPremiumRequired] = useState(false);

  const loadChapter = useCallback(async () => {
    if (!slug || !chapterId) {
      setError('Alamat bab tidak lengkap. Buka bab melalui halaman detail cerita.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setPremiumRequired(false);
    try {
      setChapter(await getChapterContent(slug, chapterId));
    } catch (cause) {
      setChapter(null);
      setError(getNexverseApiErrorMessage(cause));
      setPremiumRequired(cause instanceof NexverseApiError && (cause.status === 403 || cause.code === 'ENTITLEMENT_REQUIRED'));
    } finally {
      setLoading(false);
    }
  }, [chapterId, slug]);

  useEffect(() => { void loadChapter(); }, [loadChapter]);

  const paragraphs = chapter?.content.split(/\n{2,}/).map(value => value.trim()).filter(Boolean) ?? [];

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali"><Ionicons name="close" size={24} color={palette.ink} /></Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.bookTitle}>{slug || 'Nexverse'}</Text>
          <Text style={styles.chapterLabel}>{chapter ? 'Bab ' + chapter.number + ' · ' + chapter.title : 'Pembaca Nexverse'}</Text>
        </View>
        <Pressable onPress={() => setFontSize(value => Math.min(22, value + 1))} accessibilityLabel="Perbesar teks"><Ionicons name="add-circle-outline" size={22} color={palette.ink} /></Pressable>
        <Pressable onPress={() => setFontSize(value => Math.max(14, value - 1))} accessibilityLabel="Perkecil teks"><Text style={styles.minus}>A−</Text></Pressable>
      </View>

      {loading ? (
        <View style={styles.state}><ActivityIndicator color={palette.green} /><Text style={styles.stateText}>Memuat bab dari Nexora API…</Text></View>
      ) : error || !chapter ? (
        <View style={styles.state}>
          <Ionicons name={premiumRequired ? 'lock-closed-outline' : 'cloud-offline-outline'} size={32} color={palette.muted} />
          <Text style={styles.stateTitle}>{premiumRequired ? 'Akses premium diperlukan' : 'Bab belum dapat dibuka'}</Text>
          <Text style={styles.stateText}>{error || 'Konten bab tidak tersedia.'}</Text>
          <Pressable onPress={() => premiumRequired ? router.back() : void loadChapter()} style={styles.retry}>
            <Text style={styles.retryText}>{premiumRequired ? 'Kembali ke cerita' : 'Coba lagi'}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.reading} showsVerticalScrollIndicator={false}>
            <Text style={styles.chapterKicker}>NEXVERSE · PRATINJAU GRATIS</Text>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            <Text style={styles.chapterMeta}>Bab {chapter.number}</Text>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={[styles.paragraph, { fontSize, lineHeight: fontSize * 1.8 }]}>{paragraph}</Text>
            ))}
            <Text style={styles.endNote}>— Akhir pratinjau —</Text>
          </ScrollView>
          <View style={styles.bottom}>
            <Text style={styles.progress}>Bab {chapter.number} · Konten dikirim oleh Nexora API</Text>
            <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
            <View style={styles.controls}>
              <Text style={styles.pageNumber}>Ukuran teks {fontSize}</Text>
              <Pressable onPress={() => router.back()} style={styles.nextButton}><Text style={styles.nextText}>Daftar bab</Text><Ionicons name="list-outline" size={17} color="#FFFFFF" /></Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FCFBF7' },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { flex: 1 }, bookTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' }, chapterLabel: { color: palette.muted, fontSize: 10, marginTop: 3 }, minus: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  reading: { paddingHorizontal: 25, paddingTop: 42, paddingBottom: 50 },
  chapterKicker: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  chapterTitle: { color: palette.ink, fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  chapterMeta: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 34 },
  paragraph: { color: '#35423B', marginBottom: 22, textAlign: 'left' },
  endNote: { color: palette.green, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 15 },
  bottom: { borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  progress: { color: palette.muted, fontSize: 10, marginBottom: 8 },
  progressTrack: { height: 3, backgroundColor: palette.line, borderRadius: 2 },
  progressFill: { width: '100%', height: 3, backgroundColor: palette.green, borderRadius: 2 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  pageNumber: { color: palette.muted, fontSize: 11 },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: palette.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  nextText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  stateTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  stateText: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  retry: { marginTop: 4, backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
