import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dignity</Text>
      <Text style={styles.subtitle}>Learning, academic, attendance, research, and library in one platform.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24 },
});
