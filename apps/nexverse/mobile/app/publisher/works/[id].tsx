import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '@/constants/theme';

const manuscript = {
  title: 'Peta Pulang yang Hilang',
  author: 'Alya Prameswari',
  genre: 'Drama · Fiksi kontemporer',
  synopsis: 'Ketika sebuah surat lama ditemukan di rumah masa kecilnya, Nara mulai menyusuri jejak keluarga yang selama ini sengaja disembunyikan.',
  chapters: [
    { title: 'Rumah di ujung gang', words: '1.840 kata', body: 'Hujan turun sejak sore ketika Nara kembali ke rumah itu. Di balik lemari kayu, ia menemukan sebuah peta yang dilipat berkali-kali dan sebuah nama yang tidak pernah didengar sebelumnya.' },
    { title: 'Nama yang tertinggal', words: '2.120 kata', body: 'Nama itu muncul lagi di halaman kedua surat. Tinta yang mulai pudar justru membuat Nara semakin yakin bahwa seseorang pernah berusaha menghapus jejaknya.' },
  ],
};

export default function PublisherWorkReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [expanded, setExpanded] = useState(0);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={palette.ink} /><Text style={styles.backText}>Kembali ke antrean</Text></Pressable>
      <Text style={styles.eyebrow}>TINJAUAN NASKAH · {id ?? 'NV-1042'}</Text>
      <Text style={styles.title}>{manuscript.title}</Text>
      <Text style={styles.author}>oleh {manuscript.author}</Text>
      <View style={styles.tags}><Text style={styles.tag}>{manuscript.genre}</Text><Text style={styles.tag}>18 bab · 32.400 kata</Text></View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sinopsis</Text>
        <Text style={styles.body}>{manuscript.synopsis}</Text>
      </View>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Manuskrip</Text><Text style={styles.sectionMeta}>Pratinjau konten</Text></View>
      {manuscript.chapters.map((chapter, index) => <View key={chapter.title} style={styles.chapter}>
        <Pressable style={styles.chapterHead} onPress={() => setExpanded(expanded === index ? -1 : index)}>
          <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
          <View style={styles.chapterInfo}><Text style={styles.chapterTitle}>{chapter.title}</Text><Text style={styles.chapterMeta}>{chapter.words}</Text></View>
          <Ionicons name={expanded === index ? 'chevron-up' : 'chevron-down'} size={18} color={palette.muted} />
        </Pressable>
        {expanded === index && <Text style={styles.chapterBody}>{chapter.body}</Text>}
      </View>)}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Riwayat review</Text>
        <View style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.timelineCopy}><Text style={styles.timelineTitle}>Naskah dikirim oleh penulis</Text><Text style={styles.timelineMeta}>Hari ini · 09.42 WIB</Text></View></View>
        <Text style={styles.timelineEmpty}>Belum ada keputusan moderator pada contoh naskah ini.</Text>
      </View>
      <Text style={styles.sectionTitle}>Catatan moderator</Text>
      <TextInput value={note} onChangeText={setNote} multiline placeholder="Tulis catatan untuk penulis atau tim penerbit..." placeholderTextColor={palette.muted} style={styles.noteInput} textAlignVertical="top" />
      {decision && <View style={styles.result}><Ionicons name="information-circle-outline" size={17} color="#8A641C" /><Text style={styles.resultText}>{decision === 'approve' ? 'Simulasi: naskah ditandai untuk persetujuan.' : 'Simulasi: naskah ditandai untuk revisi.'} Belum ada perubahan yang dikirim ke server.</Text></View>}
      <View style={styles.actions}>
        <Pressable style={styles.rejectButton} onPress={() => setDecision('reject')}><Ionicons name="refresh-outline" size={17} color="#9A594B" /><Text style={styles.rejectText}>Minta revisi</Text></Pressable>
        <Pressable style={styles.approveButton} onPress={() => setDecision('approve')}><Ionicons name="checkmark" size={18} color="#FFFFFF" /><Text style={styles.approveText}>Setujui naskah</Text></Pressable>
      </View>
      <Text style={styles.disclaimer}>Tombol keputusan hanya mengubah status pratinjau lokal. Integrasi API, validasi peran publisher, dan konfirmasi server wajib tersedia sebelum digunakan untuk moderasi sungguhan.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 20, paddingBottom: 44 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 22 },
  backText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 8 },
  author: { color: palette.muted, fontSize: 12, marginTop: 6 },
  tags: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 15, marginBottom: 19 },
  tag: { color: palette.greenDark, backgroundColor: palette.mint, fontSize: 10, fontWeight: '700', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  panel: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 15, padding: 15, marginBottom: 21 },
  panelTitle: { color: palette.ink, fontSize: 14, fontWeight: '800', marginBottom: 9 },
  body: { color: '#56645C', fontSize: 12, lineHeight: 19 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  sectionMeta: { color: palette.muted, fontSize: 10 },
  chapter: { backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, marginBottom: 9, padding: 13 },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  chapterNumber: { width: 35, height: 35, borderRadius: 11, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  chapterNumberText: { color: palette.green, fontSize: 11, fontWeight: '900' },
  chapterInfo: { flex: 1 },
  chapterTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  chapterMeta: { color: palette.muted, fontSize: 10, marginTop: 4 },
  chapterBody: { color: '#56645C', fontSize: 12, lineHeight: 20, paddingTop: 13, marginTop: 12, borderTopWidth: 1, borderTopColor: palette.line },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.green },
  timelineCopy: { flex: 1 },
  timelineTitle: { color: palette.ink, fontSize: 11, fontWeight: '700' },
  timelineMeta: { color: palette.muted, fontSize: 10, marginTop: 3 },
  timelineEmpty: { color: palette.muted, fontSize: 10, marginTop: 12, lineHeight: 15 },
  noteInput: { minHeight: 100, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: 13, padding: 13, color: palette.ink, fontSize: 12, marginBottom: 13 },
  result: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF5DF', borderRadius: 11, padding: 11, marginBottom: 13 },
  resultText: { flex: 1, color: '#76571C', fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 9 },
  rejectButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: palette.rose },
  rejectText: { color: '#9A594B', fontSize: 11, fontWeight: '800' },
  approveButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: palette.green },
  approveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  disclaimer: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 16 },
});
