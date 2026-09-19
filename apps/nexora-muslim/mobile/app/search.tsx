import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockSearch, nexoraCoreSearchRepository, type GlobalSearchPort, type GlobalSearchResult } from '@/lib/search';

export default function SearchScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const repository = useMemo<GlobalSearchPort>(() => session?.user.provider === 'firebase' ? nexoraCoreSearchRepository(session) : mockSearch, [session]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    const value = query.trim();
    if (value.length < 2) { setResults([]); return; }
    setLoading(true); setError(null);
    try { setResults((await repository.search(value)).results); }
    catch { setError('Search failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>NEXORA MUSLIM</Text>
        <Text style={styles.heading}>Search</Text>
        <Text style={styles.muted}>Search Quran, Hadith, Dua, and learning content from one place.</Text>
        <View style={styles.searchRow}>
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={runSearch} returnKeyType="search" placeholder="Search content..." placeholderTextColor={colors.textMuted} style={styles.input} />
          <Pressable onPress={runSearch} style={styles.button}><Text style={styles.buttonText}>{loading ? '…' : 'Search'}</Text></Pressable>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {results.length === 0 && !loading && query.trim().length >= 2 && <Text style={styles.empty}>No results found.</Text>}
        {results.map((item) => (
          <Pressable key={`${item.type}-${item.id}`} onPress={() => router.push(item.route as never)}>
            <Card style={styles.card}>
              <Text style={styles.type}>{item.type.replaceAll('_', ' ').toUpperCase()}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.muted}>{item.subtitle}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 21 },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface },
  button: { minHeight: 48, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center' },
  buttonText: { color: colors.white, fontWeight: '800' },
  error: { color: colors.danger, marginTop: spacing.md, fontWeight: '700' },
  empty: { color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
  card: { marginTop: spacing.md },
  type: { fontSize: 10, fontWeight: '800', color: colors.primary },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 4 },
});
