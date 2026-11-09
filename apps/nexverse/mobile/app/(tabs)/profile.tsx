import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/theme';

const items = [
  { icon: 'person-outline' as const, title: 'Informasi akun', detail: 'Kelola profil Nexora' },
  { icon: 'time-outline' as const, title: 'Riwayat membaca', detail: 'Cerita yang pernah dibuka' },
  { icon: 'download-outline' as const, title: 'Unduhan', detail: 'Konten offline yang diizinkan' },
  { icon: 'settings-outline' as const, title: 'Pengaturan', detail: 'Tampilan dan preferensi' },
  { icon: 'help-circle-outline' as const, title: 'Pusat bantuan', detail: 'Bantuan dan masukan' }
];
export default function ProfileScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>RUANG PERSONAL</Text><Text style={styles.title}>Profil</Text>
      <View style={styles.profile}><View style={styles.avatar}><Ionicons name="person" size={28} color={palette.green} /></View><View><Text style={styles.name}>Pembaca Nexverse</Text><Text style={styles.email}>Masuk dengan akun Nexora</Text></View></View>
      <View style={styles.card}>{items.map((item, index) => <View key={item.title} style={[styles.item, index > 0 && styles.divider]}><Ionicons name={item.icon} size={20} color={palette.green} /><View style={styles.itemText}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={17} color={palette.muted} /></View>)}</View>
      <Text style={styles.disclaimer}>Mode awal aplikasi — autentikasi dan pengaturan akun akan terhubung ke Nexora Core pada tahap integrasi.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 35 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginTop: 12 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 22 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 24 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#E3EFE6', alignItems: 'center', justifyContent: 'center' },
  name: { color: palette.ink, fontSize: 15, fontWeight: '800' }, email: { color: palette.muted, fontSize: 11, marginTop: 4 },
  card: { backgroundColor: palette.surface, borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: palette.line },
  itemText: { flex: 1 }, itemTitle: { color: palette.ink, fontSize: 13, fontWeight: '700' }, detail: { color: palette.muted, fontSize: 10, marginTop: 3 },
  disclaimer: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 20 }
});