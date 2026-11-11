import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TextInput, Pressable, View, ActivityIndicator } from 'react-native';
import { StoryCard } from '@/components/StoryCard';
import { genres, type Story } from '@/data/catalog';
import { palette } from '@/constants/theme';
import { getCatalog, getNexverseApiErrorMessage } from '@/services/catalog';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [genre, setGenre] = useState('Semua');
  const [stories, setStories] = useState<Story[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCatalog({
        query: submittedQuery,
        genre: genre === 'Semua' ? undefined : genre,
        pageSize: 30,
      });
      setStories(response.items);
      setTotal(response.pagination.totalItems);
    } catch (cause) {
      setStories([]);
      setTotal(0);
      setError(getNexverseApiErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [genre, submittedQuery]);

  useEffect(() => { void load(); }, [load]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>TEMUKAN DUNIA BARU</Text>
      <Text style={styles.title}>Jelajahi cerita</Text>
      <View style={styles.search}>
        <Ionicons name="search-outline" color={palette.muted} size={19} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSubmittedQuery(query.trim())}
          returnKeyType="search"
          placeholder="Judul, penulis, atau genre"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />
        {query.length > 0 ? <Pressable onPress={() => { setQuery(''); setSubmittedQuery(''); }}><Ionicons name="close-circle" color={palette.muted} size={18} /></Pressable> : null}
        <Pressable accessibilityLabel="Cari cerita" onPress={() => setSubmittedQuery(query.trim())}><Ionicons name="arrow-forward-circle" color={palette.green} size={24} /></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {genres.map(item => <Pressable key={item} onPress={() => setGenre(item)} style={[styles.chip, genre === item && styles.chipActive]}><Text style={[styles.chipText, genre === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.results}>
        <Text style={styles.count}>{total} cerita ditemukan</Text>
        <Pressable onPress={() => void load()} accessibilityLabel="Muat ulang katalog"><Ionicons name="refresh" size={17} color={palette.green} /></Pressable>
      </View>
      {loading ? (
        <View style={styles.state}><ActivityIndicator color={palette.green} /><Text style={styles.emptyBody}>Memuat hasil dari Nexora API…</Text></View>
      ) : error ? (
        <View style={styles.state}><Ionicons name="cloud-offline-outline" size={28} color={palette.muted} /><Text style={styles.emptyTitle}>Pencarian belum tersedia</Text><Text style={styles.emptyBody}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable></View>
      ) : stories.length > 0 ? (
        stories.map(story => <StoryCard key={story.id} story={story} horizontal />)
      ) : (
        <View style={styles.state}><Ionicons name="book-outline" size={32} color={palette.muted} /><Text style={styles.emptyTitle}>Belum ada cerita</Text><Text style={styles.emptyBody}>Coba kata kunci atau genre lainnya.</Text></View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 30 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginTop: 12 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 18 },
  search: { minHeight: 48, borderRadius: 14, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  input: { flex: 1, color: palette.ink, fontSize: 13, paddingVertical: 10 },
  chips: { gap: 8, paddingVertical: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  chipActive: { backgroundColor: palette.green, borderColor: palette.green },
  chipText: { color: palette.muted, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  results: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  count: { color: palette.ink, fontWeight: '700', fontSize: 12 },
  state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 9, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 15 },
  emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retry: { marginTop: 4, backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
