import { StyleSheet, Text, View } from 'react-native';

export default function AcademicScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Academic</Text>
      <Text style={styles.body}>SIAKAD, KRS, grades, and attendance will be implemented as isolated feature modules.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  body: { marginTop: 8, fontSize: 16, lineHeight: 24 },
});
