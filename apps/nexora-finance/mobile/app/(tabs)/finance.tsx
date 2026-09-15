import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFinanceApi, type FinanceTransaction } from '../../lib/api/finance';
import { useOrganization } from '../../lib/organization/OrganizationProvider';

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function FinanceTab() {
  const { activeOrganization } = useOrganization();
  const financeApi = useFinanceApi();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!financeApi.ready) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const response = await financeApi.listTransactions();
      setTransactions(response.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memuat transaksi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [financeApi]);

  useEffect(() => { void load(); }, [load, activeOrganization?.id]);

  const totals = useMemo(() => transactions.reduce(
    (result, item) => {
      const amount = Number(item.amount);
      if (item.transaction_type === 'income') result.income += amount;
      else result.expense += amount;
      return result;
    },
    { income: 0, expense: 0 },
  ), [transactions]);

  const currency = transactions[0]?.currency ?? 'IDR';
  const net = totals.income - totals.expense;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Keuangan</Text>
        <Text style={styles.period}>{activeOrganization?.name ?? 'Workspace'} • Nexora Core</Text>
      </View>

      {!financeApi.ready && (
        <View style={styles.card}><Text style={styles.muted}>Pilih workspace aktif untuk melihat data keuangan.</Text></View>
      )}
      {loading && financeApi.ready && <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Memuat transaksi…</Text></View>}
      {error && <View style={styles.error}><Text style={styles.errorTitle}>Gagal memuat data</Text><Text style={styles.errorText}>{error}</Text></View>}

      {!loading && !error && financeApi.ready && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ringkasan berjalan</Text>
            <View style={styles.summaryRow}>
              <View><Text style={styles.label}>Pendapatan</Text><Text style={styles.income}>{formatAmount(totals.income, currency)}</Text></View>
              <View><Text style={styles.label}>Pengeluaran</Text><Text style={styles.expense}>{formatAmount(totals.expense, currency)}</Text></View>
            </View>
            <View style={styles.netRow}><Text style={styles.label}>Arus bersih</Text><Text style={styles.net}>{formatAmount(net, currency)}</Text></View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaksi terbaru</Text>
            {transactions.length === 0 && <Text style={styles.muted}>Belum ada transaksi untuk workspace ini.</Text>}
            {transactions.map((item) => (
              <View key={item.id} style={styles.transaction}>
                <View style={styles.transactionCopy}>
                  <Text style={styles.transactionCategory}>{item.category}</Text>
                  <Text style={styles.transactionDescription}>{item.description || item.transaction_type}</Text>
                </View>
                <Text style={item.transaction_type === 'income' ? styles.income : styles.expense}>
                  {item.transaction_type === 'expense' ? '-' : '+'}{formatAmount(Number(item.amount), item.currency)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 20, gap: 16 },
  header: { marginBottom: 2 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  period: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  card: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  netRow: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  income: { fontSize: 13, color: '#34d399', fontWeight: '700' },
  expense: { fontSize: 13, color: '#f87171', fontWeight: '700' },
  net: { fontSize: 14, color: '#fff', fontWeight: '700' },
  transaction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12 },
  transactionCopy: { flex: 1 },
  transactionCategory: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  transactionDescription: { color: '#64748b', fontSize: 11, marginTop: 2 },
  muted: { color: '#94a3b8', fontSize: 12 },
  center: { padding: 32, alignItems: 'center', gap: 8 },
  error: { backgroundColor: '#450a0a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#7f1d1d' },
  errorTitle: { color: '#fecaca', fontWeight: '700', fontSize: 13 },
  errorText: { color: '#fca5a5', fontSize: 12, marginTop: 4 },
});
