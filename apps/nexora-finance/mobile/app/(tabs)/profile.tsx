import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveContainer } from '@/components/layout';
import { theme } from '@/lib/theme';

export default function ProfileScreen() {
  return (
    <ResponsiveContainer maxWidth={1000}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Identity, workspace and security settings will live here.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Workspace context</Text>
          <Text style={styles.text}>OrganizationProvider remains the boundary for active workspace and membership context.</Text>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 40, gap: 12 },
  title: { fontSize: theme.typography.title, fontWeight: '800', color: theme.colors.text },
  subtitle: { fontSize: 16, color: theme.colors.muted },
  card: { marginTop: 12, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  text: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
});
