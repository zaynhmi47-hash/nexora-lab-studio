import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrganization } from '../../lib/organization/OrganizationProvider';

export default function DashboardTab() {
  const { activeOrganization, activeMembership, loading, error, refresh } = useOrganization();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>MULTI-TENANT FINANCE PLATFORM</Text>
        <Text style={styles.title}>Universal Executive Core</Text>
        <Text style={styles.subtitle}>Nexora Finance across Android, iOS, and Web.</Text>
      </View>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#38bdf8" />
          <Text style={styles.stateText}>Memuat workspace...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.errorTitle}>Workspace belum tersedia</Text>
          <Text style={styles.stateText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : activeOrganization ? (
        <View style={styles.organizationCard}>
          <View style={styles.organizationCopy}>
            <Text style={styles.cardLabel}>ACTIVE ORGANIZATION</Text>
            <Text style={styles.organizationName}>{activeOrganization.name}</Text>
            <Text style={styles.organizationMeta}>{activeOrganization.slug}</Text>
          </View>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>{activeMembership?.status ?? 'active'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.stateCard}>
          <Text style={styles.errorTitle}>Belum ada organization aktif</Text>
          <Text style={styles.stateText}>Akun ini belum memiliki workspace Finance yang dapat digunakan.</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Revenue (MTD)</Text><Text style={styles.statValue}>Rp 428.500.000</Text><Text style={styles.statChange}>Demo data — belum terhubung ledger</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Net Margin</Text><Text style={styles.statValue}>28.6%</Text><Text style={styles.statChange}>Demo data — belum terhubung ledger</Text></View>
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
  organizationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 20 }, organizationCopy: { flex: 1 }, cardLabel: { color: '#38bdf8', fontSize: 9, fontWeight: '800', letterSpacing: 1 }, organizationName: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 4 }, organizationMeta: { color: '#64748b', fontSize: 11, marginTop: 2 }, membershipBadge: { borderRadius: 999, backgroundColor: '#052e2b', paddingHorizontal: 10, paddingVertical: 6 }, membershipText: { color: '#34d399', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  stateCard: { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 20, alignItems: 'center' }, stateText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 8 }, errorTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', textAlign: 'center' }, retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: '#1e293b' }, retryText: { color: '#38bdf8', fontSize: 12, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 }, statCard: { flex: 1, backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' }, statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' }, statValue: { fontSize: 16, fontWeight: '800', color: '#38bdf8', marginVertical: 4 }, statChange: { fontSize: 9, color: '#64748b', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }, actionCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 }, actionTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff' }, actionDesc: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});
