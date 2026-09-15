import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function QuranScreen() {
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>AL-QURAN</Text>
    <Text style={styles.heading}>Continue Reading</Text>
    <View style={styles.card}><Text style={styles.surah}>Al-Baqarah</Text><Text style={styles.meta}>2 · Ayah 153</Text><Text style={styles.arabic}>يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ</Text><Text style={styles.translation}>O believers! Seek comfort in patience and prayer.</Text></View>
    <Text style={styles.heading}>Explore</Text>
    {['Surah', 'Juz', 'Bookmarks', 'Tafsir', 'Audio Recitations'].map(x => <View style={styles.item} key={x}><Text style={styles.itemText}>{x}</Text><Text>›</Text></View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ container:{padding:24,paddingTop:60,backgroundColor:'#f7faf9'}, eyebrow:{fontSize:11,fontWeight:'800',color:'#0f766e'}, heading:{fontSize:22,fontWeight:'800',color:'#123b35',marginTop:8,marginBottom:14}, card:{backgroundColor:'#fff',borderRadius:22,padding:22}, surah:{fontSize:20,fontWeight:'800',color:'#123b35'}, meta:{color:'#70837f',marginTop:4}, arabic:{fontSize:28,lineHeight:50,textAlign:'right',marginTop:26,color:'#183c37'}, translation:{marginTop:16,lineHeight:24,color:'#526964'}, item:{backgroundColor:'#fff,padding:18,borderRadius:16,marginBottom:10,flexDirection':'row',justifyContent':'space-between'}, itemText:{fontWeight:'700',color:'#29423e'} });
