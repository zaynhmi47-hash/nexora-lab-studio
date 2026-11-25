import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { WorkDetail } from '@/services/catalog';
import { getNexverseApiErrorMessage, getWorkDetail } from '@/services/catalog';
import { palette } from '@/constants/theme';
import { addBookmark, listBookmarkedWorks, removeBookmark } from '@/services/reading';

export default function WorkDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [story, setStory] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getWorkDetail(slug);
      setStory(detail);
      try {
        const saved = await listBookmarkedWorks();
        setBookmarked(saved.items.some(item => item.workId === detail.id));
      } catch {
        setBookmarked(false);
      }
    } catch (cause) {
      setStory(null);
      setError(getNexverseApiErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const toggleBookmark = async () => {
    if (!story || bookmarkBusy) return;
    setBookmarkBusy(true);
    setBookmarkMessage(null);
    try {
      if (bookmarked) {
        await removeBookmark(story.id);
        setBookmarked(false);
        setBookmarkMessage('Cerita dihapus dari koleksi.');
      } else {
        await addBookmark(story.id);
        setBookmarked(true);
        setBookmarkMessage('Cerita tersimpan di koleksi akun Nexora.');
      }
    } catch (cause) {
      setBookmarkMessage(cause instanceof Error ? cause.message : 'Koleksi memerlukan sesi akun Nexora.');
    } finally {
      setBookmarkBusy(false);
    }
  };

  const openChapter = (chapterId: string) => {
    if (!story) return;
    router.push({ pathname: '/reader/[slug]', params: { slug: story.slug, chapterId, workId: story.id } });
  };

  if (loading) {
    return <View style={styles.state}><ActivityIndicator color={palette.green} /><Text style={styles.stateText}>Memuat detail cerita…</Text></View>;
  }
  if (error || !story) {
    return (
      <View style={styles.state}>
        <Ionicons name="book-outline" size={30} color={palette.muted} />
        <Text style={styles.stateTitle}>{error ? 'Cerita belum dapat dibuka' : 'Cerita tidak ditemukan'}</Text>
        {error ? <Text style={styles.stateText}>{error}</Text> : null}
        <Pressable onPress={() => error ? void load() : router.back()} style={styles.retry}><Text style={styles.retryText}>{error ? 'Coba lagi' : 'Kembali'}</Text></Pressable>
      </View>
    );
  }

  const firstPreview = story.chapterList.find(chapter => chapter.freePreview);
  const publicationLabel = story.status === 'completed' ? 'Tamat' : story.status === 'hiatus' ? 'Hiatus' : 'Berjalan';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={palette.ink} /><Text style={styles.backText}>Kembali</Text></Pressable>
      <View style={styles.hero}>
        {story.cover ? <Image source={{ uri: story.cover }} style={styles.cover} /> : <View style={[styles.cover, styles.coverFallback]}><Ionicons name="book-outline" size={32} color={palette.green} /></View>}
        <View style={styles.heroText}>
          <Text style={styles.genre}>{story.genre.toUpperCase()}</Text>
          <Text style={styles.title}>{story.title}</Text>
          <Text style={styles.author}>oleh {story.author}</Text>
          <Text style={styles.status}>{publicationLabel} · {story.chapters} bab</Text>
          <Text style={styles.rating}>Rating konten: {story.contentRating}</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <View><Text style={styles.statValue}>{story.reads}</Text><Text style={styles.statLabel}>Pembaca</Text></View>
        <View><Text style={styles.statValue}>{story.chapters}</Text><Text style={styles.statLabel}>Bab terbit</Text></View>
        <View><Text style={styles.statValue}>{story.language.toUpperCase()}</Text><Text style={styles.statLabel}>Bahasa</Text></View>
      </View>
      <Pressable onPress={() => void toggleBookmark()} disabled={bookmarkBusy} style={styles.bookmarkButton}>
        <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={palette.green} />
        <Text style={styles.bookmarkText}>{bookmarkBusy ? 'Menyimpan…' : bookmarked ? 'Tersimpan di koleksi' : 'Simpan ke koleksi'}</Text>
      </Pressable>
      {bookmarkMessage ? <Text style={styles.bookmarkMessage}>{bookmarkMessage}</Text> : null}
      <Text style={styles.section}>Tentang cerita</Text>
      <Text style={styles.synopsis}>{story.synopsis || 'Belum ada sinopsis untuk cerita ini.'}</Text>
      <View style={styles.chapterHeading}><Text style={styles.section}>Daftar bab</Text><Text style={styles.chapterCount}>{story.chapterList.length} bab tersedia</Text></View>
      {story.chapterList.length === 0 ? (
        <Text style={styles.empty}>Belum ada bab yang diterbitkan.</Text>
      ) : story.chapterList.map(chapter => (
        <Pressable key={chapter.id} onPress={() => openChapter(chapter.id)} style={[styles.chapter, !chapter.freePreview && styles.chapterLocked]}>
          <View style={styles.chapterMain}>
            <Text style={styles.chapterTitle}>Bab {chapter.number} · {chapter.title}</Text>
            <Text style={styles.chapterMeta}>{chapter.freePreview ? 'Pratinjau gratis' : 'Akses premium · diverifikasi server'}</Text>
            {chapter.summary ? <Text style={styles.chapterSummary} numberOfLines={2}>{chapter.summary}</Text> : null}
          </View>
          <Ionicons name={chapter.freePreview ? 'chevron-forward' : 'lock-closed-outline'} color={palette.muted} size={18} />
        </Pressable>
      ))}
      {firstPreview ? (
        <Pressable style={styles.primary} onPress={() => openChapter(firstPreview.id)}>
          <Text style={styles.primaryText}>Baca pratinjau pertama</Text>
          <Ionicons name="arrow-forward" color="#FFFFFF" size={17} />
        </Pressable>
      ) : (
        <View style={styles.notice}><Ionicons name="lock-closed-outline" size={16} color={palette.muted} /><Text style={styles.noticeText}>Belum ada bab pratinjau gratis. Pembelian premium belum dapat dilakukan dari aplikasi karena integrasi payment gateway belum diaktifkan.</Text></View>
      )}
      <Text style={styles.disclaimer}>Konten bab dan hak akses dikirim serta diperiksa oleh Nexora API. Bab premium tidak dapat dibaca hanya dengan mengubah aplikasi.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 22 }, backText: { color: palette.ink, fontSize: 13, fontWeight: '600' },
  hero: { flexDirection: 'row', gap: 17, alignItems: 'center' }, cover: { width: 128, height: 174, borderRadius: 14, backgroundColor: palette.mint }, coverFallback: { alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 }, genre: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, title: { color: palette.ink, fontSize: 23, lineHeight: 28, fontWeight: '800', marginTop: 8 }, author: { color: palette.muted, fontSize: 12, marginTop: 7 }, status: { color: palette.green, fontSize: 11, fontWeight: '700', marginTop: 12 }, rating: { color: palette.muted, fontSize: 10, marginTop: 5 },
  bookmarkButton: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: palette.green, backgroundColor: palette.mint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, bookmarkText: { color: palette.greenDark, fontSize: 12, fontWeight: '800' }, bookmarkMessage: { color: palette.muted, fontSize: 10, textAlign: 'center', marginTop: 7 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: palette.surface, borderRadius: 15, padding: 16, marginTop: 22, borderWidth: 1, borderColor: palette.line },
  statValue: { color: palette.ink, fontWeight: '800', fontSize: 17, textAlign: 'center' }, statLabel: { color: palette.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  section: { color: palette.ink, fontSize: 17, fontWeight: '800', marginTop: 25, marginBottom: 10 }, synopsis: { color: '#56645C', fontSize: 13, lineHeight: 21 },
  chapterHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chapterCount: { color: palette.muted, fontSize: 10, marginTop: 15 },
  chapter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line, gap: 12 }, chapterLocked: { opacity: 0.72 }, chapterMain: { flex: 1 },
  chapterTitle: { color: palette.ink, fontSize: 12, fontWeight: '700' }, chapterMeta: { color: palette.green, fontSize: 10, marginTop: 5 }, chapterSummary: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  primary: { backgroundColor: palette.green, borderRadius: 14, paddingVertical: 15, marginTop: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }, primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 22, padding: 13, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line }, noticeText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 16 },
  empty: { color: palette.muted, fontSize: 12 }, disclaimer: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 14 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: palette.paper }, stateTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' }, stateText: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' }, retry: { marginTop: 4, backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 }, retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
