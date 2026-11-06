import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';
import { datingColors, datingRadii, datingShadows, datingSpacing } from '@/src/ui/tokens';

export default function ChatsScreen() {
  const api = useDatingApi();
  const matches = useQuery({ queryKey: ['dating', 'matches'], queryFn: () => api.getMatches() });
  type MatchItem = NonNullable<typeof matches.data>['items'][number];
  const open = useMutation({
    mutationFn: async (match: MatchItem) => {
      return match.conversationId ? { id: match.conversationId } : api.createConversation(match.id);
    },
    onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
    onError: (error) => Alert.alert('Chat', error instanceof Error ? error.message : 'Tidak dapat membuka percakapan.'),
  });
  const items = matches.data?.items ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={matches.isFetching} onRefresh={() => void matches.refetch()} tintColor={datingColors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STAY CONNECTED</Text>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>Percakapan yang baik dimulai dengan rasa ingin tahu.</Text>
      </View>

      <View style={styles.searchHint}>
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchHintText}>Percakapan dengan koneksimu</Text>
      </View>

      {matches.isLoading ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Memuat percakapan…</Text></View> : null}
      {!matches.isLoading && items.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Text style={styles.emptyBubble}>✉</Text></View>
          <Text style={styles.emptyTitle}>Belum ada percakapan</Text>
          <Text style={styles.emptyText}>Setelah match, kamu bisa memulai obrolan dan mengenal satu sama lain lebih dekat.</Text>
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push('/discover')}>
            <Text style={styles.primaryButtonText}>Temukan koneksi</Text>
          </Pressable>
        </View>
      ) : null}

      {items.map((match) => (
        <Pressable
          key={match.id}
          accessibilityRole="button"
          disabled={open.isPending}
          onPress={() => open.mutate(match)}
          style={styles.chatRow}
        >
          {match.counterpart?.photoUrl
            ? <Image source={{ uri: match.counterpart.photoUrl }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{(match.counterpart?.displayName ?? '?').slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.chatCopy}>
            <View style={styles.nameLine}>
              <Text style={styles.name} numberOfLines={1}>{match.counterpart?.displayName ?? 'Your match'}</Text>
              {match.lastMessage ? <Text style={styles.time}>{new Date(match.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text> : null}
            </View>
            <View style={styles.previewLine}>
              <Text style={styles.preview} numberOfLines={1}>{match.lastMessage?.body ?? 'Kirim sapaan pertamamu ✨'}</Text>
              {match.unreadCount > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{match.unreadCount > 99 ? '99+' : match.unreadCount}</Text></View> : null}
            </View>
          </View>
        </Pressable>
      ))}
      {open.isPending ? <Text style={styles.pending}>Membuka percakapan…</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: datingColors.background },
  content: { padding: datingSpacing.lg, paddingBottom: 36, gap: datingSpacing.md },
  header: { paddingTop: 6, gap: 4 },
  eyebrow: { color: '#8B7A98', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: datingColors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: datingColors.textSecondary, fontSize: 13, lineHeight: 19 },
  searchHint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: datingRadii.pill, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: datingColors.surface, borderWidth: 1, borderColor: datingColors.border },
  searchIcon: { color: datingColors.primary, fontSize: 21 },
  searchHintText: { color: datingColors.textSecondary, fontSize: 12 },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, backgroundColor: datingColors.surface, borderRadius: datingRadii.lg, borderWidth: 1, borderColor: datingColors.border, ...datingShadows.card },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: datingColors.surfaceMuted },
  avatarPlaceholder: { width: 58, height: 58, borderRadius: 20, backgroundColor: datingColors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: datingColors.primary, fontSize: 21, fontWeight: '900' },
  chatCopy: { flex: 1, gap: 6 },
  nameLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { color: datingColors.text, fontSize: 14, fontWeight: '900', flex: 1 },
  time: { color: datingColors.textSecondary, fontSize: 10 },
  previewLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { color: datingColors.textSecondary, fontSize: 12, flex: 1 },
  unread: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: datingColors.accent, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: datingColors.white, fontSize: 10, fontWeight: '900' },
  emptyCard: { alignItems: 'center', padding: 24, borderRadius: datingRadii.xl, backgroundColor: datingColors.surface, borderWidth: 1, borderColor: datingColors.border, gap: 12, ...datingShadows.card },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: datingColors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyBubble: { color: datingColors.primary, fontSize: 30 },
  emptyTitle: { color: datingColors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: datingColors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  primaryButton: { backgroundColor: datingColors.primary, borderRadius: datingRadii.pill, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  primaryButtonText: { color: datingColors.white, fontWeight: '800', fontSize: 12 },
  pending: { color: datingColors.textSecondary, textAlign: 'center', fontSize: 11 },
});
