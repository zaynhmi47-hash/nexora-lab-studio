import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function ChatsScreen() {
  const api = useDatingApi();
  const matches = useQuery({ queryKey: ['dating', 'matches'], queryFn: () => api.getMatches() });
  const open = useMutation({ mutationFn: (matchId: string) => api.createConversation(matchId), onSuccess: (conversation) => router.push(`/chat/${conversation.id}`), onError: (error) => Alert.alert('Chat', error instanceof Error ? error.message : 'Unable to open conversation.') });
  return <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={matches.isFetching} onRefresh={() => void matches.refetch()} />}><Text style={styles.title}>Chats</Text>{matches.data?.items.map((match) => <Pressable key={match.id} style={styles.card} onPress={() => open.mutate(match.id)}><Text>Match {match.id.slice(0, 8)}</Text><Text>Open conversation</Text></Pressable>)}{!matches.data?.items.length ? <Text>Conversations will appear here after a match.</Text> : null}</ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '800' }, card: { padding: 16, borderWidth: 1, borderRadius: 14, gap: 6 }
});