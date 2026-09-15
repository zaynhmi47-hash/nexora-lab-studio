import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { status, identity } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>Authentication</Text>
      <Text style={styles.value}>{status}</Text>
      <Text style={styles.label}>Nexora identity</Text>
      <Text style={styles.value}>{identity?.displayName ?? 'Not signed in'}</Text>
      <Text style={styles.body}>
        Identity is represented by the Nexora user UUID. External authentication providers remain behind the auth boundary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  label: { marginTop: 20, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  value: { marginTop: 4, fontSize: 17 },
  body: { marginTop: 24, fontSize: 15, lineHeight: 22 },
});
