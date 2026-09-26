import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function MatchesScreen() {
  const api = useDatingApi();
  const { data, isLoading } = useQuery({ queryKey: ['dating', 'matches'], queryFn: () => api.getMatches() });
  return <View style={styles.container}>
    <Text style={styles.title}>Matches</Text>
    {isLoading ? <Text>Loading…</Text> : null}
    {!isLoading && !data?.items.length ? <Text>No matches yet.</Text> : null}
    {data?.items.map((match) => <View key={match.id} style={styles.card}><Text>Match {match.id.slice(0, 8)}</Text><Text>{new Date(match.matchedAt).toLocaleDateString()}</Text></View>)}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800' }, card: { padding: 18, borderWidth: 1, borderRadius: 16, gap: 5 } });
