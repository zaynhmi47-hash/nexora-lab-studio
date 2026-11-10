import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/theme';

export default function LibraryScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>RUANG BACA PRIBADIMU</Text>
      <Text style={styles.title}>Koleksi saya</Text>
      <View style={styles.summary}>
        <View><Text style={styles.summaryNumber}>—</Text><Text style={styles.summaryLabel}>Tersimpan</Text></View>
        <Ionicons name="bookmark" color="#FFFFFF" size={30} />
      </View>
      <View style={styles.empty}>
        <Ionicons name="library-outline" size={34} color={palette.green} />
        <Text style={styles.emptyTitle}>Koleksimu akan muncul di sini</Text>
        <Text style={styles.emptyBody}>Sinkronisasi bookmark dan progres membaca memerlukan endpoint akun Nexora Core. Untuk sekarang, jelajahi cerita yang sudah diterbitkan.</Text>
        <Pressable onPress={() => router.push('/discover')} style={styles.button}><Text style={styles.buttonText}>Jelajahi cerita</Text></Pressable>
      </View>
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
  empty: { minHeight: 250, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  button: { marginTop: 5, backgroundColor: palette.green, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  buttonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
