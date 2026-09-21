import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NexoraButton, NexoraCard } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { useTheme } from '@/lib/theme';

export default function WorkspaceScreen() {
  const { user } = useAuth();
  const { workspaces, activeWorkspace, loading, error, selectWorkspace, refresh } = useWorkspace();
  const { theme } = useTheme();

  const choose = async (workspaceId: string) => {
    await selectWorkspace(workspaceId);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <NexoraCard style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Choose workspace</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          Signed in as {user?.email ?? 'user'}.
        </Text>

        {loading && workspaces.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={[styles.helper, { color: theme.colors.muted }]}>Loading your workspaces…</Text>
          </View>
        ) : error ? (
          <View style={styles.content}>
            <Text style={[styles.error, { color: theme.colors.danger }]}>{error.message}</Text>
            <NexoraButton variant="secondary" onPress={() => void refresh()}>Try again</NexoraButton>
          </View>
        ) : workspaces.length === 0 ? (
          <View style={styles.content}>
            <Text style={[styles.helper, { color: theme.colors.muted }]}>
              No active workspace is available for this account yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={workspaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <NexoraButton
                variant={activeWorkspace?.id === item.id ? 'primary' : 'secondary'}
                onPress={() => void choose(item.id)}
                disabled={loading}
              >
                {item.name}
              </NexoraButton>
            )}
          />
        )}
      </NexoraCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 480, gap: 16 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  content: { gap: 12 },
  list: { gap: 10, paddingVertical: 4 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  helper: { fontSize: 14, textAlign: 'center' },
  error: { fontSize: 14 },
});
