import { ScrollView, StyleSheet, Text, View } from 'react-native';

const missions = ['10 ayat Quran', '1 lesson Tajwid', '100x Dhikr'];

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Assalamu'alaikum 👋</Text>
      <Text style={styles.subtitle}>Your Muslim Journey</Text>
      <View style={styles.prayerCard}><Text style={styles.cardLabel}>NEXT PRAYER</Text><Text style={styles.prayer}>Maghrib</Text><Text style={styles.time}>18:02</Text><Text style={styles.light}>Prepare your heart and your prayer.</Text></View>
      <View style={styles.row}><View style={styles.stat}><Text style={styles.number}>17</Text><Text>🔥 day streak</Text></View><View style={styles.stat}><Text style={styles.number}>78%</Text><Text>Quran progress</Text></View></View>
      <Text style={styles.section}>Continue Quran</Text><View style={styles.card}><Text style={styles.title}>Al-Baqarah · 2:153</Text><Text style={styles.muted}>Continue reading where you left off.</Text></View>
      <Text style={styles.section}>Today's Mission</Text>{missions.map((mission) => <View style={styles.mission} key={mission}><Text>○</Text><Text style={styles.missionText}>{mission}</Text></View>)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container:{padding:24,paddingTop:60,backgroundColor:'#f7faf9',minHeight:'100%'}, greeting:{fontSize:26,fontWeight:'800',color:'#123b35'}, subtitle:{marginTop:4,color:'#6b7f7b'}, prayerCard:{marginTop:24,padding:22,borderRadius:24,backgroundColor:'#0f766e'}, cardLabel:{color:'#c7eee9',fontSize:11,fontWeight:'700'}, prayer:{color:'#fff',fontSize:28,fontWeight:'800',marginTop:8}, time:{color:'#fff',fontSize:42,fontWeight:'300'}, light:{color:'#d8f1ed',marginTop:6}, row:{flexDirection:'row',gap:12,marginTop:14}, stat:{flex:1,backgroundColor:'#fff',borderRadius:18,padding:18}, number:{fontSize:24,fontWeight:'800',color:'#123b35'}, section:{fontSize:19,fontWeight:'800',color:'#123b35',marginTop:28,marginBottom:10}, card:{backgroundColor:'#fff',padding:18,borderRadius:18}, title:{fontWeight:'700',color:'#183c37'}, muted:{color:'#70837f',marginTop:6}, mission:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10}, missionText:{color:'#29423e'}
});
