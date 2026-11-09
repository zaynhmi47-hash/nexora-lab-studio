import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { stories } from '@/data/catalog';
import { palette } from '@/constants/theme';

const sampleParagraphs = [
  'Hujan turun pelan ketika langkahnya berhenti di depan kedai kecil itu. Lampu kuning dari dalam jendela jatuh ke trotoar, membuat genangan tampak seperti potongan senja yang tertinggal.',
  'Ia sudah berjanji pada dirinya sendiri untuk tidak kembali ke jalan ini. Namun ada hal-hal yang rupanya tidak selesai hanya karena seseorang memilih pergi.',
  'Di sudut ruangan, seseorang mengangkat wajah dari buku yang sedang dibacanya. Tatapan mereka bertemu sebentar—cukup lama untuk mengingatkan bahwa beberapa pertemuan memang datang tanpa aba-aba.',
  '“Kamu masih suka datang saat hujan?” tanyanya, seolah-olah jeda bertahun-tahun di antara mereka hanyalah satu halaman yang terlipat.'
];
export default function ReaderScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const story = stories.find(item => item.id === slug);
  const [fontSize, setFontSize] = useState(17);
  if (!story) return <View style={styles.page}><Text>Cerita tidak ditemukan.</Text></View>;
  return (
    <View style={styles.page}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><Ionicons name="close" size={24} color={palette.ink} /></Pressable><View style={styles.headerTitle}><Text style={styles.bookTitle}>{story.title}</Text><Text style={styles.chapterLabel}>Bab 1 · Pertemuan pertama</Text></View><Pressable onPress={() => setFontSize(value => Math.min(22, value + 1))}><Ionicons name="text" size={23} color={palette.ink} /></Pressable><Pressable onPress={() => setFontSize(value => Math.max(14, value - 1))}><Text style={styles.minus}>A−</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.reading} showsVerticalScrollIndicator={false}>
        <Text style={styles.chapterKicker}>NEXVERSE ORIGINAL</Text><Text style={styles.chapterTitle}>Pertemuan pertama</Text><Text style={styles.author}>{story.author}</Text>
        {sampleParagraphs.map((paragraph, index) => <Text key={index} style={[styles.paragraph, { fontSize, lineHeight: fontSize * 1.8 }]}>{paragraph}</Text>)}
        <Text style={styles.endNote}>— Bersambung —</Text>
      </ScrollView>
      <View style={styles.bottom}><Text style={styles.progress}>Bab 1 dari {story.chapters}</Text><View style={styles.progressTrack}><View style={styles.progressFill} /></View><View style={styles.controls}><Pressable><Ionicons name="bookmark-outline" size={22} color={palette.ink} /></Pressable><Text style={styles.pageNumber}>1 / 1</Text><Pressable><Ionicons name="chevron-forward-circle" size={28} color={palette.green} /></Pressable></View></View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FCFBF7' }, header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { flex: 1 }, bookTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' }, chapterLabel: { color: palette.muted, fontSize: 10, marginTop: 3 }, minus: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  reading: { paddingHorizontal: 25, paddingTop: 42, paddingBottom: 50 }, chapterKicker: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  chapterTitle: { color: palette.ink, fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 12 }, author: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 34 },
  paragraph: { color: '#35423B', marginBottom: 22, textAlign: 'left' }, endNote: { color: palette.green, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 15 },
  bottom: { borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  progress: { color: palette.muted, fontSize: 10, marginBottom: 8 }, progressTrack: { height: 3, backgroundColor: palette.line, borderRadius: 2 }, progressFill: { width: '18%', height: 3, backgroundColor: palette.green, borderRadius: 2 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }, pageNumber: { color: palette.muted, fontSize: 11 }
});