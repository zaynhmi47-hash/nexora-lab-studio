import { ScrollView, StyleSheet, Text, View } from 'react-native';

const rows = [
  ['Pendapatan Usaha (Revenue)', 'Rp 428.500.000', 'income'],
  ['Beban Pokok Penjualan (COGS FIFO)', '-Rp 214.250.000', 'expense'],
  ['Laba Kotor (Gross Profit)', 'Rp 214.250.000', 'bold'],
  ['Beban Operasional & Marketing', '-Rp 91.800.000', 'expense'],
  ['Laba Bersih Operasional (EBIT)', 'Rp 122.450.000', 'highlight'],
] as const;

export default function FinanceTab() {
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.title}>Laporan Laba Rugi Eksekutif</Text><Text style={styles.period}>Periode Berjalan • SAK EMKM / IFRS</Text></View>
    <View style={styles.card}>{rows.map(([label, amount, type]) => <View key={label} style={[styles.row, type === 'highlight' && styles.highlightRow]}><Text style={[styles.rowLabel, (type === 'bold' || type === 'highlight') && styles.bold]}>{label}</Text><Text style={[styles.amount, type === 'income' && styles.income, type === 'expense' && styles.expense, type === 'highlight' && styles.highlight]}>{amount}</Text></View>)}</View>
    <View style={styles.aiInsight}><Text style={styles.aiTitle}>⚡ NORA AI Financial Copilot</Text><Text style={styles.aiText}>Rasio margin bersih mencapai 28,6%. Insight ini masih berupa prototype data dan akan terhubung ke Nexora Core.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({ container:{flex:1,backgroundColor:'#020617'},content:{padding:20},header:{marginBottom:16},title:{fontSize:18,fontWeight:'bold',color:'#fff'},period:{fontSize:12,color:'#94a3b8',marginTop:2},card:{backgroundColor:'#0f172a',borderRadius:16,padding:16,borderWidth:1,borderColor:'#1e293b',marginBottom:16},row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#1e293b'},highlightRow:{backgroundColor:'#064e3b33',paddingHorizontal:8,borderBottomWidth:0,borderRadius:8},rowLabel:{fontSize:12,color:'#cbd5e1',flex:1},amount:{fontSize:12,fontWeight:'600',color:'#fff'},bold:{fontWeight:'bold',color:'#fff'},income:{color:'#34d399'},expense:{color:'#f87171'},highlight:{color:'#10b981',fontWeight:'bold',fontSize:13},aiInsight:{backgroundColor:'#1e1b4b',borderRadius:16,padding:16,borderWidth:1,borderColor:'#6366f144'},aiTitle:{fontSize:13,fontWeight:'bold',color:'#a5b4fc',marginBottom:4},aiText:{fontSize:12,color:'#e0e7ff',lineHeight:18}}
});
