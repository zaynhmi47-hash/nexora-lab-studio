import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return <View style={styles.container}><Text style={styles.title}>Profile</Text><Text>Dating profile and preferences.</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '800' }
});