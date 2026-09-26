import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function MatchesScreen() {
  const api = useDatingApi();
  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: ['dating', 'matches'], queryFn: () => api.getMatches() });
  return <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => void refetch()} />}>
    <Text style={styles.title}>Matches</Text>
    {isLoading ? <Text>Loading…</Text> : null}
    {!isLoading && !data?.items.length ? <Text>No matches yet.</Text> : null}
    {data?.items.map((match) => <Pressable key={match.id} style={styles.card} onPress={async () => { try { const conversation = await api.createConversation(match.id); router.push(`/chat/${conversation.id}`); } catch (error) { Alert.alert('Match', error instanceof Error ? error.message : 'Unable to open conversation.'); } }}>
      {match.counterpart?.photoUrl ? <Image source={{ uri: match.counterpart.photoUrl }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text>?</Text></View>}
      <View style={styles.info}>
        <Text style={styles.name}>{match.counterpart?.displayName ?? 'Your match'}</Text>
        <Text style={styles.secondary}>{match.counterpart?.age ? `${match.counterpart.age} years old` : 'New match'}</Text>
        <Text style={styles.secondary}>{new Date(match.matchedAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.action}>Open chat</Text>
    </Pressable>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800' }, card: { padding: 14, borderWidth: 1, borderRadius: 16, gap: 10, flexDirection: 'row', alignItems: 'center' }, avatar: { width: 58, height: 58, borderRadius: 29 }, avatarPlaceholder: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, info: { flex: 1, gap: 2 }, name: { fontSize: 18, fontWeight: '700' }, secondary: { opacity: 0.55 }, action: { fontWeight: '700' } });
