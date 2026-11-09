import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { stories } from '@/data/catalog';
import { palette } from '@/constants/theme';

export default function WorkDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const story = stories.find(item => item.id === slug);
  if (!story) return <View style={styles.notFound}><Text style={styles.title}>Cerita tidak ditemukan</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Kembali</Text></Pressable></View>;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={palette.ink} /><Text style={styles.backText}>Kembali</Text></Pressable>
      <View style={styles.hero}><Image source={{ uri: story.cover }} style={styles.cover} /><View style={styles.heroText}><Text style={styles.genre}>{story.genre.toUpperCase()}</Text><Text style={styles.title}>{story.title}</Text><Text style={styles.author}>oleh {story.author}</Text><Text style={styles.status}>{story.status} · {story.chapters} bab</Text></View></View>
      <View style={styles.stats}><View><Text style={styles.statValue}>{story.reads}</Text><Text style={styles.statLabel}>Pembaca</Text></View><View><Text style={styles.statValue}>{story.chapters}</Text><Text style={styles.statLabel}>Bab</Text></View><View><Text style={styles.statValue}>4.8</Text><Text style={styles.statLabel}>Rating demo</Text></View></View>
      <Text style={styles.section}>Tentang cerita</Text><Text style={styles.synopsis}>{story.synopsis}</Text>
      <Text style={styles.section}>Daftar bab</Text>
      {[1, 2, 3].map(chapter => <View key={chapter} style={styles.chapter}><View><Text style={styles.chapterTitle}>Bab {chapter} · {['Pertemuan pertama', 'Kota yang menyimpan rahasia', 'Hal yang belum terucap'][chapter - 1]}</Text><Text style={styles.chapterMeta}>Pratinjau konten · 5 menit baca</Text></View><Ionicons name="chevron-forward" color={palette.muted} size={18} /></View>)}
      <Pressable style={styles.primary} onPress={() => router.push({ pathname: '/reader/[slug]', params: { slug: story.id } })}><Text style={styles.primaryText}>Baca bab pertama</Text><Ionicons name="arrow-forward" color="#FFFFFF" size={17} /></Pressable>
      <Text style={styles.disclaimer}>Katalog dan bab pada build ini merupakan konten demo untuk pengembangan UI. Belum ada transaksi atau hak akses berbayar yang aktif.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 22 }, backText: { color: palette.ink, fontSize: 13, fontWeight: '600' },
  hero: { flexDirection: 'row', gap: 17, alignItems: 'center' }, cover: { width: 128, height: 174, borderRadius: 14, backgroundColor: palette.mint },
  heroText: { flex: 1 }, genre: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, title: { color: palette.ink, fontSize: 23, lineHeight: 28, fontWeight: '800', marginTop: 8 }, author: { color: palette.muted, fontSize: 12, marginTop: 7 }, status: { color: palette.green, fontSize: 11, fontWeight: '700', marginTop: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: palette.surface, borderRadius: 15, padding: 16, marginTop: 22, borderWidth: 1, borderColor: palette.line },
  statValue: { color: palette.ink, fontWeight: '800', fontSize: 17, textAlign: 'center' }, statLabel: { color: palette.muted, fontSize: 10, marginTop: 4 },
  section: { color: palette.ink, fontSize: 17, fontWeight: '800', marginTop: 25, marginBottom: 10 }, synopsis: { color: '#56645C', fontSize: 13, lineHeight: 21 },
  chapter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line },
  chapterTitle: { color: palette.ink, fontSize: 12, fontWeight: '700' }, chapterMeta: { color: palette.muted, fontSize: 10, marginTop: 5 },
  primary: { backgroundColor: palette.green, borderRadius: 14, paddingVertical: 15, marginTop: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, disclaimer: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 14 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' }, link: { color: palette.green, marginTop: 12 }
});