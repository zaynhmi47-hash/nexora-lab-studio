import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/theme';
import { listReadingProgress, type ReadingProgress } from '@/services/reading';

export default function LibraryScreen() {
  const [items, setItems] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listReadingProgress();
      setItems(response.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Progres bacaan belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>RUANG BACA PRIBADIMU</Text>
      <Text style={styles.title}>Lanjut membaca</Text>
      <View style={styles.summary}>
        <View><Text style={styles.summaryNumber}>{items.length}</Text><Text style={styles.summaryLabel}>Cerita dengan progres tersimpan</Text></View>
        <Ionicons name="book" color="#FFFFFF" size={30} />
      </View>
      {loading ? (
        <View style={styles.state}><ActivityIndicator color={palette.green} /><Text style={styles.stateBody}>Memuat progres bacaan dari akun Nexora…</Text></View>
      ) : error ? (
        <View style={styles.state}>
          <Ionicons name="cloud-offline-outline" size={30} color={palette.muted} />
          <Text style={styles.stateTitle}>Progres belum tersedia</Text>
          <Text style={styles.stateBody}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.button}><Text style={styles.buttonText}>Coba lagi</Text></Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.state}>
          <Ionicons name="library-outline" size={34} color={palette.green} />
          <Text style={styles.stateTitle}>Belum ada progres bacaan</Text>
          <Text style={styles.stateBody}>Buka cerita dan mulai membaca pratinjau gratis. Posisi bacaan akan tersimpan di akun Nexora.</Text>
          <Pressable onPress={() => router.push('/discover')} style={styles.button}><Text style={styles.buttonText}>Jelajahi cerita</Text></Pressable>
        </View>
      ) : items.map(item => (
        <View key={item.workId} style={styles.item}>
          <View style={styles.itemIcon}><Ionicons name="book-outline" size={22} color={palette.green} /></View>
          <View style={styles.itemBody}>
            <Text style={styles.workTitle} numberOfLines={1}>{item.workTitle}</Text>
            <Text style={styles.chapter}>Bab {item.chapterNumber} · {item.chapterTitle}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: item.progressPercent + '%' }]} /></View>
            <Text style={styles.percent}>{item.progressPercent}% tersimpan</Text>
          </View>
          <Pressable
            accessibilityLabel={'Buka ' + item.workTitle}
            onPress={() => router.push({ pathname: '/reader/[slug]', params: { slug: item.workSlug, chapterId: item.chapterId, workId: item.workId } })}
            style={styles.continue}
          >
            <Ionicons name="play" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 35 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginTop: 12 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 20 },
  summary: { backgroundColor: palette.greenDark, borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  summaryNumber: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  summaryLabel: { color: '#D8E9DF', fontSize: 11, marginTop: 2 },
  state: { minHeight: 230, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line },
  stateTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateBody: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  button: { marginTop: 5, backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  buttonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 15, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, marginBottom: 10 },
  itemIcon: { width: 42, height: 48, borderRadius: 10, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1 }, workTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' }, chapter: { color: palette.muted, fontSize: 10, marginTop: 4 },
  track: { height: 4, backgroundColor: palette.line, borderRadius: 3, marginTop: 9 }, fill: { height: 4, backgroundColor: palette.green, borderRadius: 3 },
  percent: { color: palette.muted, fontSize: 9, marginTop: 5 }, continue: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center' },
});
