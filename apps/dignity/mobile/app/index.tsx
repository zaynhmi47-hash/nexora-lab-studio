import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  return status === 'signed_in'
    ? <Redirect href="/(tabs)" />
    : <Redirect href="/sign-in" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
