import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NexoraButton, NexoraCard } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { useTheme } from '@/lib/theme';

export default function WorkspaceScreen() {
  const { user } = useAuth();
  const { setActiveWorkspace } = useWorkspace();
  const { theme } = useTheme();
  const choose = (type: 'personal' | 'business') => {
    setActiveWorkspace({ id: type === 'personal' ? 'personal-demo' : 'business-demo', name: type === 'personal' ? 'Personal Workspace' : 'Business Workspace', type, currency: 'IDR' });
    router.replace('/(tabs)');
  };
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <NexoraCard style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Choose workspace</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Signed in as {user?.email ?? 'user'}.</Text>
        <NexoraButton onPress={() => choose('personal')}>Personal workspace</NexoraButton>
        <NexoraButton variant="secondary" onPress={() => choose('business')}>Business workspace</NexoraButton>
      </NexoraCard>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, card: { width: '100%', maxWidth: 480, gap: 16 }, title: { fontSize: 26, fontWeight: '800' }, subtitle: { fontSize: 14 } });
