import { StyleSheet, Text, View } from 'react-native';

export default function MatchesScreen() {
  return <View style={styles.container}><Text style={styles.title}>Matches</Text><Text>Your mutual matches will appear here.</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '800' }
});