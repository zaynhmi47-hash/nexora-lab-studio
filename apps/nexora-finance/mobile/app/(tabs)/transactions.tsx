import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveContainer } from '@/components/layout';
import { theme } from '@/lib/theme';

export default function TransactionsScreen() {
  return (
    <ResponsiveContainer maxWidth={1200}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Track income, expenses and transfers in one workspace.</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyText}>The transaction repository and domain flows will be connected here without changing the responsive UI layer.</Text>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 40, gap: 12 },
  title: { fontSize: theme.typography.title, fontWeight: '800', color: theme.colors.text },
  subtitle: { fontSize: 16, color: theme.colors.muted },
  empty: { marginTop: 12, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  emptyText: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
});
