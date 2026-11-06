import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';
import { datingColors, datingRadii, datingShadows, datingSpacing } from '@/src/ui/tokens';

export default function MatchesScreen() {
  const api = useDatingApi();
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dating', 'matches'],
    queryFn: () => api.getMatches(),
  });

  type MatchItem = NonNullable<typeof data>['items'][number];
  const openConversation = async (match: MatchItem) => {
    try {
      const conversation = match.conversationId
        ? { id: match.conversationId }
        : await api.createConversation(match.id);
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      Alert.alert('Belum bisa membuka chat', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => void refetch()} tintColor={datingColors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR CONNECTIONS</Text>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>Setiap koneksi punya cerita. Mulai dari satu sapaan.</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}><Text style={styles.heart}>♥</Text></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{data?.items.length ?? 0} koneksi baru</Text>
          <Text style={styles.summarySubtitle}>Orang yang saling tertarik denganmu</Text>
        </View>
      </View>

      {isLoading ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Menemukan koneksimu…</Text><Text style={styles.stateText}>Sebentar, kami sedang memuat daftar match.</Text></View> : null}
      {!isLoading && !data?.items.length ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Text style={styles.emptyHeart}>♡</Text></View>
          <Text style={styles.emptyTitle}>Cerita baru dimulai di Discover</Text>
          <Text style={styles.stateText}>Saat kamu dan seseorang saling tertarik, koneksi kalian akan muncul di sini.</Text>
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push('/discover')}>
            <Text style={styles.primaryButtonText}>Jelajahi Discover</Text>
          </Pressable>
        </View>
      ) : null}

      {data?.items.map((match) => (
        <Pressable key={match.id} accessibilityRole="button" style={styles.matchCard} onPress={() => void openConversation(match)}>
          {match.counterpart?.photoUrl
            ? <Image source={{ uri: match.counterpart.photoUrl }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{(match.counterpart?.displayName ?? '?').slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{match.counterpart?.displayName ?? 'Your match'}</Text>
              {match.unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{match.unreadCount > 99 ? '99+' : match.unreadCount}</Text></View> : null}
            </View>
            <Text style={styles.preview} numberOfLines={1}>{match.lastMessage?.body ?? 'Mulai percakapan pertamamu ✨'}</Text>
            <Text style={styles.meta}>{match.lastMessage ? new Date(match.lastMessage.createdAt).toLocaleDateString() : `Match · ${new Date(match.matchedAt).toLocaleDateString()}`}</Text>
          </View>
          <View style={styles.openIcon}><Text style={styles.openIconText}>›</Text></View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: datingColors.background },
  content: { padding: datingSpacing.lg, paddingBottom: 36, gap: datingSpacing.md },
  header: { gap: 4, paddingTop: 6 },
  eyebrow: { color: '#8B7A98', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: datingColors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: datingColors.textSecondary, fontSize: 13, lineHeight: 19 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: datingColors.accentSoft, borderRadius: datingRadii.lg, padding: 15 },
  summaryIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: datingColors.surface, alignItems: 'center', justifyContent: 'center' },
  heart: { color: datingColors.accent, fontSize: 21 },
  summaryCopy: { flex: 1, gap: 2 },
  summaryTitle: { color: datingColors.text, fontWeight: '900', fontSize: 14 },
  summarySubtitle: { color: datingColors.textSecondary, fontSize: 11 },
  matchCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: datingColors.surface, borderWidth: 1, borderColor: datingColors.border, borderRadius: datingRadii.lg, ...datingShadows.card },
  avatar: { width: 62, height: 62, borderRadius: 22, backgroundColor: datingColors.surfaceMuted },
  avatarPlaceholder: { width: 62, height: 62, borderRadius: 22, backgroundColor: datingColors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: datingColors.primary, fontSize: 22, fontWeight: '900' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: datingColors.text, fontSize: 15, fontWeight: '900', flexShrink: 1 },
  preview: { color: '#514B57', fontSize: 12 },
  meta: { color: datingColors.textSecondary, fontSize: 10 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: datingColors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: datingColors.white, fontSize: 10, fontWeight: '900' },
  openIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: datingColors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  openIconText: { color: datingColors.primary, fontSize: 22, lineHeight: 24 },
  stateCard: { padding: 20, borderRadius: datingRadii.lg, backgroundColor: datingColors.surface, gap: 5 },
  stateTitle: { color: datingColors.text, fontSize: 15, fontWeight: '800' },
  stateText: { color: datingColors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyCard: { alignItems: 'center', padding: 24, borderRadius: datingRadii.xl, backgroundColor: datingColors.surface, borderWidth: 1, borderColor: datingColors.border, gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: datingColors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyHeart: { color: datingColors.accent, fontSize: 42 },
  emptyTitle: { color: datingColors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  primaryButton: { backgroundColor: datingColors.primary, borderRadius: datingRadii.pill, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  primaryButtonText: { color: datingColors.white, fontWeight: '800', fontSize: 12 },
});
