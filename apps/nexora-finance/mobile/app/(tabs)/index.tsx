import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';

export default function HomeScreen() {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1440}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader
            title="Dashboard"
            subtitle="Your financial overview"
          />
          <ResponsiveGrid gap={12}>
            {[
              ['Balance', 'Rp 0', 'Available balance'],
              ['This month', 'Rp 0', 'Income − expenses'],
              ['Budget', '0%', 'Used this period'],
            ].map(([label, value, hint]) => (
              <View key={label} style={[styles.card, !isMobile && styles.cardWide]}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.hint}>{hint}</Text>
              </View>
            ))}
          </ResponsiveGrid>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Text style={styles.hint}>
              Transactions, Accounting, POS, Inventory, CRM, Marketing and NORA will plug into this shell.
            </Text>
          </View>
        </ScrollView>
      </ResponsiveContainer>
    </ResponsiveScaffold>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 40, gap: 20 },
  card: {
    width: '100%',
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 6,
  },
  cardWide: { width: '31%', minWidth: 220 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  value: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  hint: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
  section: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
});
