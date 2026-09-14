import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>MULTI-TENANT FINANCE PLATFORM</Text>
        <Text style={styles.title}>Universal Executive Core</Text>
        <Text style={styles.subtitle}>Nexora Finance across Android, iOS, and Web.</Text>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Revenue (MTD)</Text><Text style={styles.statValue}>Rp 428.500.000</Text><Text style={styles.statChange}>+18.4% vs last month</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Net Margin</Text><Text style={styles.statValue}>28.6%</Text><Text style={styles.statChange}>Operating Cashflow Positive</Text></View>
      </View>
      <Text style={styles.sectionTitle}>Quick Navigation</Text>
      <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/pos')}><Text style={styles.actionTitle}>🚀 Kasir Smart POS</Text><Text style={styles.actionDesc}>Kasir, split bill, invoice, dan QRIS.</Text></TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/finance')}><Text style={styles.actionTitle}>📊 Financial Statements & Ledger</Text><Text style={styles.actionDesc}>Laba rugi, neraca, arus kas, dan rekonsiliasi.</Text></TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/modal')}><Text style={styles.actionTitle}>📷 Scanner</Text><Text style={styles.actionDesc}>Barcode/QR transaction workflow.</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, content: { padding: 20, paddingBottom: 40 }, header: { marginBottom: 20 },
  badge: { color: '#38bdf8', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }, title: { fontSize: 24, fontWeight: '900', color: '#fff' }, subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 }, statCard: { flex: 1, backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' }, statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' }, statValue: { fontSize: 16, fontWeight: '800', color: '#38bdf8', marginVertical: 4 }, statChange: { fontSize: 10, color: '#10b981', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }, actionCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 }, actionTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff' }, actionDesc: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});
