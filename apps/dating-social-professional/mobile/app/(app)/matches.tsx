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
    {data?.items.map((match) => <Pressable key={match.id} style={styles.card} onPress={async () => {
      try {
        const conversation = match.conversationId ? { id: match.conversationId } : await api.createConversation(match.id);
        router.push(`/chat/${conversation.id}`);
      } catch (error) {
        Alert.alert('Match', error instanceof Error ? error.message : 'Unable to open conversation.');
      }
    }}>
      {match.counterpart?.photoUrl ? <Image source={{ uri: match.counterpart.photoUrl }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text>?</Text></View>}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{match.counterpart?.displayName ?? 'Your match'}</Text>
          {match.unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{match.unreadCount > 99 ? '99+' : match.unreadCount}</Text></View> : null}
        </View>
        {match.lastMessage ? <Text style={styles.preview} numberOfLines={1}>{match.lastMessage.body}</Text> : <Text style={styles.secondary}>Start the conversation</Text>}
        <Text style={styles.secondary}>{match.lastMessage ? new Date(match.lastMessage.createdAt).toLocaleString() : new Date(match.matchedAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.action}>Chat</Text>
    </Pressable>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800' }, card: { padding: 14, borderWidth: 1, borderRadius: 16, gap: 10, flexDirection: 'row', alignItems: 'center' }, avatar: { width: 58, height: 58, borderRadius: 29 }, avatarPlaceholder: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, info: { flex: 1, gap: 2 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, name: { fontSize: 18, fontWeight: '700' }, preview: { fontWeight: '600' }, secondary: { opacity: 0.55 }, badge: { minWidth: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }, badgeText: { fontSize: 11, fontWeight: '800' }, action: { fontWeight: '700' } });
