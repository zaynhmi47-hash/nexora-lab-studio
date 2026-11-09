import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '@/constants/theme';
import { getModerationErrorMessage, getModerationQueue, ModerationApiError, ModerationWork } from '@/services/moderation';

export default function PublisherDashboardScreen() {
  const [items, setItems] = useState<ModerationWork[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadQueue = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const response = await getModerationQueue(1, 50);
      setItems(response.items);
      setTotal(response.pagination.totalItems);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(getModerationErrorMessage(err));
      setAccessDenied(err instanceof ModerationApiError && (err.status === 401 || err.status === 403));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  const filtered = useMemo(() => items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.author.penName.toLowerCase().includes(query.toLowerCase())
  ), [items, query]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadQueue(true)} tintColor={palette.green} />}>
      <View style={styles.topbar}>
        <View><Text style={styles.eyebrow}>NEXVERSE · INTERNAL TOOLS</Text><Text style={styles.title}>Publisher Studio</Text></View>
        <View style={styles.avatar}><Ionicons name="shield-checkmark" size={20} color={palette.green} /></View>
      </View>
      <View style={styles.liveNotice}><View style={styles.liveDot} /><Text style={styles.liveText}>Terhubung ke endpoint moderasi Nexora API</Text></View>
      <Text style={styles.greeting}>Ringkasan editorial</Text>
      <Text style={styles.subtitle}>Antrean naskah yang menunggu keputusan moderator.</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricValue}>{total}</Text><Text style={styles.metricLabel}>Menunggu review</Text><Ionicons name="documents-outline" size={16} color={palette.green} /></View>
        <View style={styles.metric}><Text style={styles.metricValue}>{filtered.length}</Text><Text style={styles.metricLabel}>Hasil pencarian</Text><Ionicons name="search-outline" size={16} color={palette.green} /></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Antrean naskah</Text><Pressable onPress={() => loadQueue(true)} accessibilityLabel="Muat ulang antrean"><Ionicons name="refresh" size={19} color={palette.green} /></Pressable></View>
      <View style={styles.search}><Ionicons name="search-outline" size={18} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Cari judul atau penulis" placeholderTextColor={palette.muted} style={styles.searchInput} /></View>
      {loading ? <View style={styles.state}><ActivityIndicator color={palette.green} /><Text style={styles.stateText}>Memuat antrean dari server...</Text></View> :
        error ? <View style={styles.errorCard}><Ionicons name={accessDenied ? 'lock-closed-outline' : 'cloud-offline-outline'} size={25} color="#9A594B" /><Text style={styles.errorTitle}>{accessDenied ? 'Akses moderator diperlukan' : 'Antrean belum dapat dimuat'}</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => loadQueue()} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable></View> :
        filtered.length ? filtered.map(item => (
          <Pressable key={item.id} onPress={() => router.push({ pathname: '/publisher/works/[id]', params: { id: item.id } })} style={styles.workCard}>
            <View style={styles.workTop}><Text style={styles.genre}>{(item.genre || 'NEXVERSE').toUpperCase()}</Text><View style={styles.status}><Text style={styles.statusText}>Menunggu review</Text></View></View>
            <Text style={styles.workTitle}>{item.title}</Text><Text style={styles.author}>oleh {item.author.penName}</Text>
            <View style={styles.workMeta}><Text style={styles.metaText}>{item.chapters.length} bab · {item.language.toUpperCase()}</Text><Ionicons name="chevron-forward" size={18} color={palette.muted} /></View>
          </Pressable>
        )) : <View style={styles.empty}><Ionicons name="file-tray-outline" size={28} color={palette.muted} /><Text style={styles.emptyTitle}>{items.length ? 'Naskah tidak ditemukan' : 'Antrean kosong'}</Text><Text style={styles.emptyText}>{items.length ? 'Ubah kata kunci pencarian.' : 'Belum ada naskah yang menunggu review.'}</Text></View>}
      <View style={styles.footer}><Ionicons name="lock-closed-outline" size={14} color={palette.muted} /><Text style={styles.footerText}>Izin moderator, keputusan, dan validasi role tetap ditegakkan oleh server Nexora.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 20, paddingTop: 18, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: palette.ink, fontSize: 26, fontWeight: '900', marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  liveNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.mint, borderRadius: 10, padding: 10, marginBottom: 22 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green },
  liveText: { color: palette.greenDark, fontSize: 10, fontWeight: '700' },
  greeting: { color: palette.ink, fontSize: 19, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 12, marginTop: 5, marginBottom: 17 },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 27 },
  metric: { flex: 1, minHeight: 91, padding: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 14, justifyContent: 'space-between', alignItems: 'flex-start' },
  metricValue: { color: palette.ink, fontSize: 23, fontWeight: '900' },
  metricLabel: { color: palette.muted, fontSize: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  search: { height: 46, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 13 },
  searchInput: { flex: 1, color: palette.ink, fontSize: 12, paddingVertical: 0 },
  state: { alignItems: 'center', padding: 30, gap: 10 },
  stateText: { color: palette.muted, fontSize: 11 },
  errorCard: { alignItems: 'center', padding: 22, backgroundColor: palette.surface, borderRadius: 15, borderWidth: 1, borderColor: palette.line },
  errorTitle: { color: palette.ink, fontSize: 14, fontWeight: '800', marginTop: 10 },
  errorText: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  retry: { backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 14 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  workCard: { backgroundColor: palette.surface, borderRadius: 15, borderWidth: 1, borderColor: palette.line, padding: 14, marginBottom: 10 },
  workTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  genre: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  status: { backgroundColor: '#FFF3D9', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#8A641C', fontSize: 9, fontWeight: '700' },
  workTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', marginTop: 10 },
  author: { color: palette.muted, fontSize: 11, marginTop: 4 },
  workMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: palette.line, marginTop: 13, paddingTop: 10 },
  metaText: { color: palette.muted, fontSize: 10 },
  empty: { alignItems: 'center', padding: 28, backgroundColor: palette.surface, borderRadius: 15, borderWidth: 1, borderColor: palette.line },
  emptyTitle: { color: palette.ink, fontWeight: '800', marginTop: 9 },
  emptyText: { color: palette.muted, fontSize: 11, marginTop: 5 },
  footer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 20 },
  footerText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 15 },
});
