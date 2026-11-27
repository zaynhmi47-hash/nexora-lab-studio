// mobile/app/(tabs)/finance/index.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFinanceStore } from '../../../store/financeStore';
import { Card } from '@/components/ui/Card';
import { FinanceChart } from '../../../components/finance/FinanceChart';
import { TransactionList } from '../../../components/finance/TransactionList';
import { Loader } from '../../../components/common/Loader';

export default function FinanceOverview() {
  const { 
    summary, 
    transactions, 
    fetchSummary, 
    fetchTransactions,
    isLoading 
  } = useFinanceStore();
  
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    await Promise.all([
      fetchSummary(),
      fetchTransactions({ limit: 10 })
    ]);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  if (isLoading && !summary) {
    return <Loader />;
  }
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={[styles.cardValue, styles.income]}>
            Rp {summary?.income?.toLocaleString() || '0'}
          </Text>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>Expense</Text>
          <Text style={[styles.cardValue, styles.expense]}>
            Rp {summary?.expense?.toLocaleString() || '0'}
          </Text>
        </Card>
        
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>Balance</Text>
          <Text style={styles.cardValue}>
            Rp {summary?.balance?.toLocaleString() || '0'}
          </Text>
        </Card>
      </View>
      
      {/* Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Spending Overview</Text>
        <FinanceChart period="monthly" />
      </Card>
      
      {/* Recent Transactions */}
      <Card style={styles.transactionsCard}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TransactionList transactions={transactions.slice(0, 5)} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  transactionsCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});