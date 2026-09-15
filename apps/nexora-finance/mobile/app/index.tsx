import { StyleSheet, Text, View } from 'react-native';

export default function FinanceHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Nexora Finance</Text>
      <Text style={styles.title}>Your finances, in one place.</Text>
      <Text style={styles.subtitle}>
        Universal Expo foundation — Android, iOS, and Web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
  },
});
