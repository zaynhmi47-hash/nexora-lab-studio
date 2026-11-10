import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { palette } from '@/constants/theme';
import { getChapterContent, getNexverseApiErrorMessage, NexverseApiError, type ChapterContent } from '@/services/catalog';
import {
  DEFAULT_READER_PREFERENCES,
  getReadingProgress,
  loadReaderPreferences,
  saveReadingProgress,
  saveReaderPreferences,
  type ReaderPreferences,
} from '@/services/reading';

const readerThemes = {
  paper: { background: '#FCFBF7', text: '#35423B', muted: '#78847E', surface: '#FFFFFF' },
  sepia: { background: '#F1E5CF', text: '#4A3929', muted: '#806B54', surface: '#E9D9BF' },
  dark: { background: '#17211D', text: '#E4EAE5', muted: '#A5B2AA', surface: '#202D27' },
};

export default function ReaderScreen() {
  const { slug, chapterId, workId } = useLocalSearchParams<{ slug: string; chapterId: string; workId: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [preferences, setPreferences] = useState<ReaderPreferences>(DEFAULT_READER_PREFERENCES);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [resumeRatio, setResumeRatio] = useState<number | null>(null);
  const theme = readerThemes[preferences.theme];

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
      const [content] = await Promise.all([
        getChapterContent(slug, chapterId),
        loadReaderPreferences().then(value => { setPreferences(value); setPreferencesReady(true); }),
      ]);
      setChapter(content);
      if (workId) {
        try {
          const saved = await getReadingProgress(workId);
          const item = saved.item;
          if (item?.chapterId === chapterId && item.positionChars > 0 && content.content.length > 0) {
            const ratio = Math.min(1, item.positionChars / content.content.length);
            setResumeMessage('Posisi bacaan terakhir dipulihkan · ' + item.progressPercent + '%');
            setResumeRatio(ratio);
          } else {
            setResumeMessage(null);
          }
        } catch {
          setResumeMessage(null);
        }
      }
    } catch (cause) {
      setChapter(null);
      setError(getNexverseApiErrorMessage(cause));
      setPremiumRequired(cause instanceof NexverseApiError && (cause.status === 403 || cause.code === 'ENTITLEMENT_REQUIRED'));
    } finally {
      setLoading(false);
    }
  }, [chapterId, slug, workId]);

  useEffect(() => { void loadChapter(); }, [loadChapter]);

  useEffect(() => {
    if (resumeRatio !== null && contentHeight > 0 && viewportHeight > 0) {
      scrollRef.current?.scrollTo({ y: Math.max(0, (contentHeight - viewportHeight) * resumeRatio), animated: false });
      setResumeRatio(null);
    }
  }, [resumeRatio, contentHeight, viewportHeight]);

  useEffect(() => {
    if (preferencesReady) void saveReaderPreferences(preferences).catch(() => undefined);
  }, [preferences, preferencesReady]);

  const saveProgress = useCallback(async (offset: number, measuredHeight: number, visibleHeight: number) => {
    if (!workId || !chapter || !measuredHeight || !visibleHeight) return;
    const maxOffset = Math.max(1, measuredHeight - visibleHeight);
    const ratio = measuredHeight <= visibleHeight ? 1 : Math.min(1, Math.max(0, offset / maxOffset));
    setSaving(true);
    try {
      await saveReadingProgress(workId, {
        chapterId: chapter.id,
        positionChars: Math.round(chapter.content.length * ratio),
        progressPercent: Math.round(ratio * 100),
      });
      setResumeMessage('Progres tersimpan di akun Nexora');
    } catch {
      setResumeMessage('Progres belum tersinkron · periksa sesi dan koneksi');
    } finally {
      setSaving(false);
    }
  }, [chapter, workId]);

  const paragraphs = chapter?.content.split(/\n{2,}/).map(value => value.trim()).filter(Boolean) ?? [];

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.muted + '44', backgroundColor: theme.surface }]}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali"><Ionicons name="close" size={24} color={theme.text} /></Pressable>
        <View style={styles.headerTitle}>
          <Text style={[styles.bookTitle, { color: theme.text }]}>{slug || 'Nexverse'}</Text>
          <Text style={[styles.chapterLabel, { color: theme.muted }]}>{chapter ? 'Bab ' + chapter.number + ' · ' + chapter.title : 'Pembaca Nexverse'}</Text>
        </View>
        <Pressable onPress={() => setPreferences(value => ({ ...value, fontSize: Math.min(26, value.fontSize + 1) }))} accessibilityLabel="Perbesar teks"><Ionicons name="add-circle-outline" size={22} color={theme.text} /></Pressable>
        <Pressable onPress={() => setPreferences(value => ({ ...value, fontSize: Math.max(14, value.fontSize - 1) }))} accessibilityLabel="Perkecil teks"><Text style={[styles.minus, { color: theme.text }]}>A−</Text></Pressable>
        <Pressable onPress={() => setPreferences(value => ({ ...value, theme: value.theme === 'paper' ? 'sepia' : value.theme === 'sepia' ? 'dark' : 'paper' }))} accessibilityLabel="Ubah tema"><Ionicons name="contrast-outline" size={21} color={theme.text} /></Pressable>
      </View>

      {loading ? (
        <View style={styles.state}><ActivityIndicator color={palette.green} /><Text style={[styles.stateText, { color: theme.muted }]}>Memuat bab dari Nexora API…</Text></View>
      ) : error || !chapter ? (
        <View style={styles.state}>
          <Ionicons name={premiumRequired ? 'lock-closed-outline' : 'cloud-offline-outline'} size={32} color={theme.muted} />
          <Text style={[styles.stateTitle, { color: theme.text }]}>{premiumRequired ? 'Akses premium diperlukan' : 'Bab belum dapat dibuka'}</Text>
          <Text style={[styles.stateText, { color: theme.muted }]}>{error || 'Konten bab tidak tersedia.'}</Text>
          <Pressable onPress={() => premiumRequired ? router.back() : void loadChapter()} style={styles.retry}>
            <Text style={styles.retryText}>{premiumRequired ? 'Kembali ke cerita' : 'Coba lagi'}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.reading}
            showsVerticalScrollIndicator={false}
            onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}
            onContentSizeChange={(_, height) => setContentHeight(height)}
            onScroll={event => setScrollY(event.nativeEvent.contentOffset.y)}
            scrollEventThrottle={100}
            onScrollEndDrag={event => void saveProgress(event.nativeEvent.contentOffset.y, contentHeight, viewportHeight)}
            onMomentumScrollEnd={event => void saveProgress(event.nativeEvent.contentOffset.y, contentHeight, viewportHeight)}
          >
            <Text style={[styles.chapterKicker, { color: palette.green }]}>NEXVERSE · PRATINJAU GRATIS</Text>
            <Text style={[styles.chapterTitle, { color: theme.text }]}>{chapter.title}</Text>
            <Text style={[styles.chapterMeta, { color: theme.muted }]}>Bab {chapter.number}</Text>
            {resumeMessage ? <Text style={[styles.resume, { color: theme.muted }]}>{resumeMessage}</Text> : null}
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={[styles.paragraph, { color: theme.text, fontSize: preferences.fontSize, lineHeight: preferences.fontSize * preferences.lineHeight }]}>{paragraph}</Text>
            ))}
            <Text style={[styles.endNote, { color: palette.green }]}>— Akhir pratinjau —</Text>
          </ScrollView>
          <View style={[styles.bottom, { backgroundColor: theme.surface, borderTopColor: theme.muted + '44' }]}>
            <Text style={[styles.progress, { color: theme.muted }]}>{saving ? 'Menyimpan progres…' : resumeMessage || 'Posisi bacaan tersimpan saat berhenti menggulir'}</Text>
            <View style={[styles.progressTrack, { backgroundColor: theme.muted + '44' }]}><View style={[styles.progressFill, { width: `${contentHeight > viewportHeight ? Math.min(100, Math.round(scrollY / (contentHeight - viewportHeight) * 100)) : 100}%` as `${number}%` }]} /></View>
            <View style={styles.controls}>
              <Text style={[styles.pageNumber, { color: theme.muted }]}>{preferences.fontSize}px · {preferences.theme}</Text>
              <Pressable onPress={() => router.back()} style={styles.nextButton}><Text style={styles.nextText}>Daftar bab</Text><Ionicons name="list-outline" size={17} color="#FFFFFF" /></Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 13, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { flex: 1 }, bookTitle: { fontSize: 12, fontWeight: '800' }, chapterLabel: { fontSize: 10, marginTop: 3 }, minus: { fontSize: 12, fontWeight: '700' },
  reading: { paddingHorizontal: 25, paddingTop: 42, paddingBottom: 50 },
  chapterKicker: { fontSize: 9, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  chapterTitle: { fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  chapterMeta: { fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  resume: { fontSize: 10, textAlign: 'center', marginBottom: 20 },
  paragraph: { marginBottom: 22, textAlign: 'left' },
  endNote: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 15 },
  bottom: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 15 },
  progress: { fontSize: 10, marginBottom: 8 },
  progressTrack: { height: 3, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: palette.green, borderRadius: 2 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  pageNumber: { fontSize: 11 },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: palette.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  nextText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  stateTitle: { fontSize: 15, fontWeight: '800' },
  stateText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  retry: { marginTop: 4, backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
