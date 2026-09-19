import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';
import { useFinanceCategoryBreakdown, useFinanceSummary } from '@/lib/features/summary';
import { useTransactions } from '@/lib/features/transactions';

type PeriodKey = 'this_month' | 'last_month' | 'three_months';

interface PeriodOption {
  key: PeriodKey;
  label: string;
}

const PERIODS: PeriodOption[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'three_months', label: 'Last 3 months' },
];

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

function getPeriodDates(key: PeriodKey) {
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  if (key === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: toDateString(start), endDate: toDateString(end) };
  }

  if (key === 'three_months') {
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return { startDate: toDateString(start), endDate: toDateString(end) };
  }

  return {
    startDate: toDateString(currentMonthStart),
    endDate: toDateString(today),
  };
}

const formatIdr = (amountMinor: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amountMinor);

export default function HomeScreen() {
  const { isMobile } = useResponsive();
  const [periodKey, setPeriodKey] = useState<PeriodKey>('this_month');
  const period = useMemo(() => getPeriodDates(periodKey), [periodKey]);

  const { summary, loading: summaryLoading, error: summaryError } = useFinanceSummary(period);
  const {
    breakdown,
    loading: breakdownLoading,
    error: breakdownError,
  } = useFinanceCategoryBreakdown(period);
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactions({ status: 'posted', startDate: period.startDate, endDate: period.endDate, page: 1, pageSize: 8 });

  const loading = summaryLoading || breakdownLoading || transactionsLoading;
  const error = summaryError ?? breakdownError ?? transactionsError;

  const incomeBreakdown = useMemo(
    () => breakdown.filter((item) => item.direction === 'income'),
    [breakdown],
  );
  const expenseBreakdown = useMemo(
    () => breakdown.filter((item) => item.direction === 'expense'),
    [breakdown],
  );

  const renderBreakdown = (title: string, rows: typeof breakdown, total: number) => (
    <View style={styles.breakdownCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {breakdownLoading && rows.length === 0 ? (
        <Text style={styles.hint}>Loading breakdown…</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.hint}>No posted {title.toLowerCase()} for this period.</Text>
      ) : (
        rows.slice(0, 6).map((item) => {
          const percentage = total > 0 ? (item.amountMinor / total) * 100 : 0;
          return (
            <View key={item.direction + ':' + item.category} style={styles.breakdownRow}>
              <View style={styles.breakdownMain}>
                <View style={styles.breakdownTitleRow}>
                  <Text style={styles.breakdownCategory} numberOfLines={1}>{item.category}</Text>
                  <Text style={styles.breakdownPercentage}>{percentage.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: percentage + '%' }]} />
                </View>
                <Text style={styles.hint}>
                  {item.transactionCount} transaction{item.transactionCount === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={styles.breakdownAmount}>{formatIdr(item.amountMinor)}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1440}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader
            title="Dashboard"
            subtitle={summary ? 'Financial overview · ' + summary.startDate + ' to ' + summary.endDate : 'Your financial overview'}
          />

          <View style={styles.periodSection}>
            <Text style={styles.periodLabel}>Summary period</Text>
            <View style={styles.periodRow}>
              {PERIODS.map((periodOption) => {
                const selected = periodOption.key === periodKey;
                return (
                  <Pressable
                    key={periodOption.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setPeriodKey(periodOption.key)}
                    style={[styles.periodButton, selected && styles.periodButtonSelected]}
                  >
                    <Text style={[styles.periodText, selected && styles.periodTextSelected]}>
                      {periodOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertTitle}>Unable to load financial data</Text>
              <Text style={styles.hint}>{error.message}</Text>
            </View>
          ) : null}

          <ResponsiveGrid gap={12}>
            {[
              ['Income', loading && !summary ? 'Loading…' : formatIdr(summary?.totalIncomeMinor ?? 0), 'Posted income'],
              ['Expenses', loading && !summary ? 'Loading…' : formatIdr(summary?.totalExpenseMinor ?? 0), 'Posted expenses'],
              ['Net cash flow', loading && !summary ? 'Loading…' : formatIdr(summary?.netCashFlowMinor ?? 0), 'Income − expenses'],
              ['Transactions', loading && !summary ? 'Loading…' : String(summary?.transactionCount ?? 0), 'Posted transactions'],
            ].map(([label, value, hint]) => (
              <View key={label} style={[styles.card, !isMobile && styles.cardWide]}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.hint}>{hint}</Text>
              </View>
            ))}
          </ResponsiveGrid>

          <ResponsiveGrid gap={12}>
            {renderBreakdown('Income by category', incomeBreakdown, summary?.totalIncomeMinor ?? 0)}
            {renderBreakdown('Expenses by category', expenseBreakdown, summary?.totalExpenseMinor ?? 0)}
          </ResponsiveGrid>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent transactions</Text>
            {transactionsLoading && transactions.length === 0 ? (
              <Text style={styles.hint}>Loading transactions…</Text>
            ) : transactions.length === 0 ? (
              <Text style={styles.hint}>No posted transactions in this period.</Text>
            ) : (
              transactions.map((item) => (
                <View key={item.id} style={styles.transactionRow}>
                  <View style={styles.transactionMain}>
                    <Text style={styles.transactionTitle}>{item.description || item.category}</Text>
                    <Text style={styles.hint}>
                      {item.category} · {new Date(item.occurredAt).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, item.direction === 'expense' && styles.expenseAmount]}>
                    {item.direction === 'expense' ? '−' : '+'}{formatIdr(item.amountMinor)}
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
  periodSection: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 10 },
  periodLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, justifyContent: 'center' },
  periodButtonSelected: { borderColor: theme.colors.text, backgroundColor: theme.colors.text },
  periodText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  periodTextSelected: { color: theme.colors.surface },
  card: { width: '100%', padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 6 },
  cardWide: { width: '23.5%', minWidth: 220 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  value: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  hint: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
  alert: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 4 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  section: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  breakdownCard: { width: '100%', flex: 1, minWidth: 320, padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 12 },
  breakdownRow: { minHeight: 72, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  breakdownMain: { flex: 1, gap: 5 },
  breakdownTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  breakdownCategory: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  breakdownPercentage: { fontSize: 13, fontWeight: '700', color: theme.colors.muted },
  progressTrack: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: theme.colors.border },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.text },
  breakdownAmount: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  transactionRow: { minHeight: 64, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  transactionMain: { flex: 1, gap: 2 },
  transactionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  transactionAmount: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  expenseAmount: { color: theme.colors.muted },
});
