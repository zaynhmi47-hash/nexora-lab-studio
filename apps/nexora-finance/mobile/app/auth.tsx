import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NexoraButton, NexoraCard } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function AuthScreen() {
  const { signInDemo } = useAuth();
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <NexoraCard style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nexora Finance</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Authentication foundation is ready for Firebase Auth integration.</Text>
        <NexoraButton onPress={() => { signInDemo({ id: 'demo-user', email: 'demo@nexora.local', displayName: 'Demo User', emailVerified: true }); router.replace('/workspace'); }}>Continue with demo account</NexoraButton>
      </NexoraCard>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, card: { width: '100%', maxWidth: 480, gap: 16 }, title: { fontSize: 28, fontWeight: '800' }, subtitle: { fontSize: 15, lineHeight: 22 } });
