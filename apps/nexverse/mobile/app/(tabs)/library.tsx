import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StoryCard } from '@/components/StoryCard';
import { stories } from '@/data/catalog';
import { palette } from '@/constants/theme';

export default function LibraryScreen() {
  const [saved] = useState([stories[0], stories[2]]);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>RUANG BACA PRIBADIMU</Text>
      <Text style={styles.title}>Koleksi saya</Text>
      <View style={styles.summary}><View><Text style={styles.summaryNumber}>{saved.length}</Text><Text style={styles.summaryLabel}>Tersimpan</Text></View><Ionicons name="bookmark" color="#FFFFFF" size={30} /></View>
      <Text style={styles.section}>Lanjutkan membaca</Text>
      {saved.map(story => <StoryCard key={story.id} story={story} horizontal />)}
      <Text style={styles.note}>Koleksi saat ini menggunakan data demo lokal. Sinkronisasi akun dan progres lintas perangkat akan dihubungkan pada tahap backend.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 35 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginTop: 12 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 20 },
  summary: { backgroundColor: palette.greenDark, borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  summaryNumber: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  summaryLabel: { color: '#D8E9DF', fontSize: 11, marginTop: 2 },
  section: { color: palette.ink, fontSize: 17, fontWeight: '800', marginBottom: 15 },
  note: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 10 }
});