import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';
import { useTransactions } from '@/lib/features/transactions';

const formatIdr = (amountMinor: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amountMinor);

export default function HomeScreen() {
  const { isMobile } = useResponsive();
  const { transactions, loading, error } = useTransactions();

  const posted = transactions.filter((item) => item.status === 'posted');
  const income = posted
    .filter((item) => item.direction === 'income')
    .reduce((total, item) => total + item.amountMinor, 0);
  const expense = posted
    .filter((item) => item.direction === 'expense')
    .reduce((total, item) => total + item.amountMinor, 0);
  const net = income - expense;

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1440}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader
            title="Dashboard"
            subtitle="Your financial overview"
          />

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertTitle}>Unable to load transactions</Text>
              <Text style={styles.hint}>{error.message}</Text>
            </View>
          ) : null}

          <ResponsiveGrid gap={12}>
            {[
              ['Income', loading ? 'Loading…' : formatIdr(income), 'Posted income'],
              ['Expenses', loading ? 'Loading…' : formatIdr(expense), 'Posted expenses'],
              ['Net cash flow', loading ? 'Loading…' : formatIdr(net), 'Income − expenses'],
            ].map(([label, value, hint]) => (
              <View key={label} style={[styles.card, !isMobile && styles.cardWide]}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.hint}>{hint}</Text>
              </View>
            ))}
          </ResponsiveGrid>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent transactions</Text>
            {loading && transactions.length === 0 ? (
              <Text style={styles.hint}>Loading transactions…</Text>
            ) : transactions.length === 0 ? (
              <Text style={styles.hint}>No transactions yet. Create your first income or expense to see it here.</Text>
            ) : (
              transactions.slice(0, 8).map((item) => (
                <View key={item.id} style={styles.transactionRow}>
                  <View style={styles.transactionMain}>
                    <Text style={styles.transactionTitle}>
                      {item.description || item.category}
                    </Text>
                    <Text style={styles.hint}>
                      {item.category} · {new Date(item.occurredAt).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      item.direction === 'expense' && styles.expenseAmount,
                    ]}
                  >
                    {item.direction === 'expense' ? '−' : '+'}
                    {formatIdr(item.amountMinor)}
                  </Text>
                </View>
              ))
            )}
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
  alert: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  section: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  transactionRow: {
    minHeight: 64,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionMain: { flex: 1, gap: 2 },
  transactionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  transactionAmount: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  expenseAmount: { color: theme.colors.muted },
});
