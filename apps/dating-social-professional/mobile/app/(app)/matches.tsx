import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function MatchesScreen() {
  const api = useDatingApi();
  const { data, isLoading } = useQuery({ queryKey: ['dating', 'matches'], queryFn: () => api.getMatches() });
  return <View style={styles.container}>
    <Text style={styles.title}>Matches</Text>
    {isLoading ? <Text>Loading…</Text> : null}
    {!isLoading && !data?.items.length ? <Text>No matches yet.</Text> : null}
    {data?.items.map((match) => <Pressable key={match.id} style={styles.card} onPress={async () => { const conversation = await api.createConversation(match.id); router.push(`/chat/${conversation.id}`); }}><Text>Match {match.id.slice(0, 8)}</Text><Text>{new Date(match.matchedAt).toLocaleDateString()}</Text><Text>Open chat</Text></Pressable>)}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800' }, card: { padding: 18, borderWidth: 1, borderRadius: 16, gap: 5 } });
