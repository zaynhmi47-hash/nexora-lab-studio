import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function NotificationsScreen() {
  const api = useDatingApi();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['dating', 'notifications'], queryFn: () => api.getNotifications() });

  useEffect(() => {
    if (query.data?.unreadCount) {
      void api.markNotificationsRead().then(() => client.invalidateQueries({ queryKey: ['dating', 'notifications'] }));
    }
  }, [query.data?.unreadCount]);

  return <View style={styles.container}>
    <Text style={styles.title}>Notifications</Text>
    {query.data?.items.map((item) => <View key={item.id} style={styles.card}><Text style={styles.itemTitle}>{item.title}</Text><Text>{item.body}</Text><Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text></View>)}
    {!query.data?.items.length ? <Text>No notifications yet.</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 32, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 5 },
  itemTitle: { fontWeight: '700' },
  meta: { opacity: 0.55, fontSize: 11 },
});
