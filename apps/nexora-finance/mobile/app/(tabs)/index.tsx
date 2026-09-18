import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';

export default function HomeScreen() {
  const { isMobile, isUltrawide } = useResponsive();

  return (
    <ResponsiveContainer maxWidth={1440}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>NEXORA FINANCE</Text>
          <Text style={[styles.title, isMobile && styles.mobileTitle]}>Good morning</Text>
          <Text style={styles.subtitle}>Your financial overview, adapted to your device.</Text>
        </View>

        <ResponsiveGrid gap={12}>
          <View style={[styles.card, !isMobile && styles.cardWide]}>
            <Text style={styles.cardLabel}>Balance</Text>
            <Text style={styles.amount}>Rp 0</Text>
            <Text style={styles.muted}>Available balance</Text>
          </View>
          <View style={[styles.card, !isMobile && styles.cardWide]}>
            <Text style={styles.cardLabel}>This month</Text>
            <Text style={styles.amount}>Rp 0</Text>
            <Text style={styles.muted}>Income − expenses</Text>
          </View>
          <View style={[styles.card, !isMobile && styles.cardWide]}>
            <Text style={styles.cardLabel}>Budget</Text>
            <Text style={styles.amount}>0%</Text>
            <Text style={styles.muted}>Used this period</Text>
          </View>
        </ResponsiveGrid>

        <View style={[styles.section, isUltrawide && styles.sectionWide]}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <Text style={styles.muted}>The foundation is ready for Transactions, POS, Inventory, CRM, Accounting and NORA modules.</Text>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 40, gap: 24 },
  header: { gap: 6 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: theme.colors.primary },
  title: { fontSize: theme.typography.title, fontWeight: '800', color: theme.colors.text },
  mobileTitle: { fontSize: 24 },
  subtitle: { fontSize: theme.typography.body, color: theme.colors.muted },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: 6,
  },
  cardWide: { width: '31%', minWidth: 220 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  amount: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  muted: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: 8,
  },
  sectionWide: { maxWidth: 900 },
  sectionTitle: { fontSize: theme.typography.heading, fontWeight: '750', color: theme.colors.text },
});
