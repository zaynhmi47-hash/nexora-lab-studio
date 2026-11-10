import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { User } from 'firebase/auth';
import { palette } from '@/constants/theme';
import { signOutNexora, subscribeToNexoraAuth } from '@/services/firebaseAuth';

const items = [
  { icon: 'time-outline' as const, title: 'Riwayat membaca', detail: 'Cerita yang pernah dibuka' },
  { icon: 'download-outline' as const, title: 'Unduhan', detail: 'Konten offline yang diizinkan' },
  { icon: 'settings-outline' as const, title: 'Pengaturan', detail: 'Tampilan dan preferensi' },
  { icon: 'help-circle-outline' as const, title: 'Pusat bantuan', detail: 'Bantuan dan masukan' },
];

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToNexoraAuth(nextUser => {
        setUser(nextUser);
        setAuthReady(true);
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Firebase Auth belum dikonfigurasi.');
      setAuthReady(true);
    }
    return () => unsubscribe?.();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    setAuthError(null);
    try {
      await signOutNexora();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Tidak dapat keluar dari akun.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>RUANG PERSONAL</Text><Text style={styles.title}>Profil</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}><Ionicons name="person" size={28} color={palette.green} /></View>
        <View style={styles.identity}>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0] || 'Pembaca Nexverse'}</Text>
          <Text style={styles.email}>{user?.email || 'Masuk dengan akun Nexora'}</Text>
          {!authReady ? <ActivityIndicator size="small" color={palette.green} style={styles.spinner} /> : null}
        </View>
      </View>
      {user ? (
        <Pressable disabled={signingOut} onPress={() => void handleSignOut()} style={styles.signOut}>
          {signingOut ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="log-out-outline" size={17} color="#FFFFFF" /><Text style={styles.signOutText}>Keluar dari akun Nexora</Text></>}
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push('/publisher/login')} style={styles.signIn}>
          <Ionicons name="log-in-outline" size={17} color={palette.green} /><Text style={styles.signInText}>Masuk dengan akun Nexora</Text>
        </Pressable>
      )}
      {authError ? <Text style={styles.error}>{authError}</Text> : null}
      <View style={styles.card}>{items.map((item, index) => <View key={item.title} style={[styles.item, index > 0 && styles.divider]}><Ionicons name={item.icon} size={20} color={palette.green} /><View style={styles.itemText}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={17} color={palette.muted} /></View>)}</View>
      <Text style={styles.disclaimer}>Identitas menggunakan Firebase Nexora. Akses ke fitur internal tetap ditentukan oleh izin pada Nexora API.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper }, content: { padding: 20, paddingBottom: 35 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginTop: 12 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 22 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#E3EFE6', alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1 }, spinner: { alignSelf: 'flex-start', marginTop: 5 },
  name: { color: palette.ink, fontSize: 15, fontWeight: '800' }, email: { color: palette.muted, fontSize: 11, marginTop: 4 },
  signOut: { minHeight: 45, borderRadius: 12, backgroundColor: palette.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  signOutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  signIn: { minHeight: 45, borderRadius: 12, backgroundColor: palette.mint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  signInText: { color: palette.greenDark, fontSize: 12, fontWeight: '800' },
  error: { color: '#9A594B', fontSize: 11, lineHeight: 16, marginBottom: 14 },
  card: { backgroundColor: palette.surface, borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: palette.line },
  itemText: { flex: 1 }, itemTitle: { color: palette.ink, fontSize: 13, fontWeight: '700' }, detail: { color: palette.muted, fontSize: 10, marginTop: 3 },
  disclaimer: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 20 }
});
