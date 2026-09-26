import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDatingApi } from '@/src/api/provider';

export default function NotificationsScreen() {
  const api = useDatingApi();
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['dating', 'notifications'], queryFn: () => api.getNotifications() });
  const markAll = useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: () => client.invalidateQueries({ queryKey: ['dating', 'notifications'] }),
  });

  const openNotification = (item: { id: string; data: Record<string, unknown>; readAt: string | null }) => {
    setSelected(item.id);
    if (!item.readAt) void markAll.mutateAsync();
    const conversationId = typeof item.data.conversationId === 'string' ? item.data.conversationId : typeof item.data.conversation_id === 'string' ? item.data.conversation_id : null;
    if (conversationId) router.push(`/(app)/chat/${conversationId}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => void query.refetch()} />}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Notifications</Text><Text style={styles.subtitle}>{query.data?.unreadCount ?? 0} unread</Text></View>
        {(query.data?.unreadCount ?? 0) > 0 ? <Pressable onPress={() => markAll.mutate()} disabled={markAll.isPending} style={styles.markAll}><Text>Mark all read</Text></Pressable> : null}
      </View>
      {query.data?.items.map((item) => (
        <Pressable key={item.id} onPress={() => openNotification(item)} style={[styles.card, !item.readAt && styles.unread, selected === item.id && styles.selected]}>
          <View style={styles.row}><Text style={styles.itemTitle}>{item.title}</Text>{!item.readAt ? <Text style={styles.badge}>NEW</Text> : null}</View>
          <Text>{item.body}</Text>
          <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
        </Pressable>
      ))}
      {!query.data?.items.length ? <Text>No notifications yet.</Text> : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { opacity: 0.55, marginTop: 2 },
  markAll: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 5 },
  unread: { borderWidth: 2 },
  selected: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { fontWeight: '700', flex: 1 },
  badge: { fontSize: 11, fontWeight: '800' },
  meta: { opacity: 0.55, fontSize: 11 },
});