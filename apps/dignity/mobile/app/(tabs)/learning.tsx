import { StyleSheet, Text, View } from 'react-native';

export default function LearningScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Learning</Text>
      <Text style={styles.body}>Course and Duolingo-inspired learning flows will live behind feature modules.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  body: { marginTop: 8, fontSize: 16, lineHeight: 24 },
});
