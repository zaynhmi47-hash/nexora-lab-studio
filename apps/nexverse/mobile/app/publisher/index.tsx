import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '@/constants/theme';

type QueueItem = { id: string; title: string; author: string; genre: string; submitted: string; chapters: number; status: 'Menunggu review' | 'Perlu revisi' };

const demoQueue: QueueItem[] = [
  { id: 'nv-1042', title: 'Peta Pulang yang Hilang', author: 'Alya Prameswari', genre: 'Drama', submitted: '2 jam lalu', chapters: 18, status: 'Menunggu review' },
  { id: 'nv-1041', title: 'Orbit Terakhir', author: 'Raka Mahendra', genre: 'Fiksi ilmiah', submitted: '5 jam lalu', chapters: 24, status: 'Menunggu review' },
  { id: 'nv-1038', title: 'Musim yang Tidak Bernama', author: 'Nadia Putri', genre: 'Romansa', submitted: 'Kemarin', chapters: 12, status: 'Perlu revisi' },
];

export default function PublisherDashboardScreen() {
  const [filter, setFilter] = useState<'Semua' | 'Menunggu review' | 'Perlu revisi'>('Semua');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => demoQueue.filter(item =>
    (filter === 'Semua' || item.status === filter) &&
    (item.title.toLowerCase().includes(query.toLowerCase()) || item.author.toLowerCase().includes(query.toLowerCase()))
  ), [filter, query]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <View><Text style={styles.eyebrow}>NEXVERSE · INTERNAL TOOLS</Text><Text style={styles.title}>Publisher Studio</Text></View>
        <View style={styles.avatar}><Ionicons name="shield-checkmark" size={20} color={palette.green} /></View>
      </View>
      <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color="#8A641C" /><Text style={styles.noticeText}>Pratinjau antarmuka. Data dan keputusan di halaman ini belum dikirim ke server.</Text></View>
      <Text style={styles.greeting}>Ringkasan editorial</Text>
      <Text style={styles.subtitle}>Pantau naskah dan proses moderasi penerbitan.</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricValue}>12</Text><Text style={styles.metricLabel}>Antrean aktif</Text><View style={styles.metricIcon}><Ionicons name="documents-outline" size={16} color={palette.green} /></View></View>
        <View style={styles.metric}><Text style={styles.metricValue}>08</Text><Text style={styles.metricLabel}>Menunggu review</Text><View style={styles.metricIcon}><Ionicons name="time-outline" size={16} color="#A47726" /></View></View>
        <View style={styles.metric}><Text style={styles.metricValue}>04</Text><Text style={styles.metricLabel}>Diputuskan</Text><View style={styles.metricIcon}><Ionicons name="checkmark-circle-outline" size={16} color={palette.green} /></View></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Antrean naskah</Text><Text style={styles.count}>{filtered.length} naskah</Text></View>
      <View style={styles.search}><Ionicons name="search-outline" size={18} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Cari judul atau penulis" placeholderTextColor={palette.muted} style={styles.searchInput} /></View>
      <View style={styles.filters}>{(['Semua', 'Menunggu review', 'Perlu revisi'] as const).map(value => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value}</Text></Pressable>)}</View>
      {filtered.length ? filtered.map(item => (
        <Pressable key={item.id} onPress={() => router.push({ pathname: '/publisher/works/[id]', params: { id: item.id } })} style={styles.workCard}>
          <View style={styles.workTop}><Text style={styles.genre}>{item.genre.toUpperCase()}</Text><View style={[styles.status, item.status === 'Perlu revisi' && styles.statusRevision]}><Text style={[styles.statusText, item.status === 'Perlu revisi' && styles.statusRevisionText]}>{item.status}</Text></View></View>
          <Text style={styles.workTitle}>{item.title}</Text><Text style={styles.author}>oleh {item.author}</Text>
          <View style={styles.workMeta}><Text style={styles.metaText}>{item.chapters} bab · {item.submitted}</Text><Ionicons name="chevron-forward" size={18} color={palette.muted} /></View>
        </Pressable>
      )) : <View style={styles.empty}><Ionicons name="file-tray-outline" size={28} color={palette.muted} /><Text style={styles.emptyTitle}>Tidak ada naskah</Text><Text style={styles.emptyText}>Coba ubah kata kunci atau filter antrean.</Text></View>}
      <View style={styles.footer}><Ionicons name="lock-closed-outline" size={14} color={palette.muted} /><Text style={styles.footerText}>Akses produksi harus dibatasi melalui identitas dan peran moderator Nexora.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 20, paddingTop: 18, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: palette.ink, fontSize: 26, fontWeight: '900', marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: '#FFF5DF', borderRadius: 12, padding: 12, marginBottom: 23 },
  noticeText: { color: '#76571C', fontSize: 11, lineHeight: 16, flex: 1 },
  greeting: { color: palette.ink, fontSize: 19, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 12, marginTop: 5, marginBottom: 17 },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 27 },
  metric: { flex: 1, minHeight: 98, padding: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 14, justifyContent: 'space-between' },
  metricValue: { color: palette.ink, fontSize: 23, fontWeight: '900' },
  metricLabel: { color: palette.muted, fontSize: 9, lineHeight: 13 },
  metricIcon: { position: 'absolute', right: 9, top: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  count: { color: palette.muted, fontSize: 11 },
  search: { height: 46, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, color: palette.ink, fontSize: 12, paddingVertical: 0 },
  filters: { flexDirection: 'row', gap: 7, marginVertical: 13, flexWrap: 'wrap' },
  filter: { borderRadius: 20, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: palette.surface },
  filterActive: { backgroundColor: palette.green, borderColor: palette.green },
  filterText: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  workCard: { backgroundColor: palette.surface, borderRadius: 15, borderWidth: 1, borderColor: palette.line, padding: 14, marginBottom: 10 },
  workTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  genre: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  status: { backgroundColor: '#FFF3D9', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  statusRevision: { backgroundColor: palette.rose },
  statusText: { color: '#8A641C', fontSize: 9, fontWeight: '700' },
  statusRevisionText: { color: '#955F50' },
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
