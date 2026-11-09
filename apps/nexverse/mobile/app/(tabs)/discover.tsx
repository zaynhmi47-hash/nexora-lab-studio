import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { StoryCard } from '@/components/StoryCard';
import { genres, stories } from '@/data/catalog';
import { palette } from '@/constants/theme';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Semua');
  const filtered = useMemo(() => stories.filter(story =>
    (genre === 'Semua' || story.genre === genre) &&
    `${story.title} ${story.author} ${story.genre}`.toLowerCase().includes(query.toLowerCase())
  ), [genre, query]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>TEMUKAN DUNIA BARU</Text>
      <Text style={styles.title}>Jelajahi cerita</Text>
      <View style={styles.search}><Ionicons name="search-outline" color={palette.muted} size={19} /><TextInput value={query} onChangeText={setQuery} placeholder="Judul, penulis, atau genre" placeholderTextColor={palette.muted} style={styles.input} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {genres.map(item => <Pressable key={item} onPress={() => setGenre(item)} style={[styles.chip, genre === item && styles.chipActive]}><Text style={[styles.chipText, genre === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.results}><Text style={styles.count}>{filtered.length} cerita ditemukan</Text><Text style={styles.sort}>Pilihan Nexverse</Text></View>
      {filtered.map(story => <StoryCard key={story.id} story={story} horizontal />)}
      {filtered.length === 0 && <View style={styles.empty}><Ionicons name="book-outline" size={32} color={palette.muted} /><Text style={styles.emptyTitle}>Belum ada cerita</Text><Text style={styles.emptyBody}>Coba kata kunci atau genre lainnya.</Text></View>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 30 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginTop: 12 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 18 },
  search: { height: 48, borderRadius: 14, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  input: { flex: 1, color: palette.ink, fontSize: 13 },
  chips: { gap: 8, paddingVertical: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  chipActive: { backgroundColor: palette.green, borderColor: palette.green },
  chipText: { color: palette.muted, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  results: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  count: { color: palette.ink, fontWeight: '700', fontSize: 12 },
  sort: { color: palette.muted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: palette.muted, fontSize: 12 }
});