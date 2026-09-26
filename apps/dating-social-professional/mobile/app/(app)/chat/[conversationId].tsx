import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const api = useDatingApi();
  const client = useQueryClient();
  const [body, setBody] = useState('');
  const detail = useQuery({ queryKey: ['dating', 'conversation', conversationId], queryFn: () => api.getConversation(conversationId), enabled: Boolean(conversationId), refetchInterval: 5000 });
  const safety = useMutation({ mutationFn: async (action: 'unmatch' | 'block' | 'report') => {
    if (action === 'unmatch') return api.unmatch(detail.data?.matchId ?? '');
    if (action === 'block') return api.blockConversation(conversationId);
    return api.reportConversation(conversationId, 'other', 'Reported from chat.');
  }, onSuccess: (_, action) => {
    client.invalidateQueries({ queryKey: ['dating', 'matches'] });
    if (action !== 'report') {
      client.invalidateQueries({ queryKey: ['dating', 'conversation', conversationId] });
      Alert.alert('Chat', action === 'unmatch' ? 'The match has been removed.' : 'The conversation has been blocked.', [{ text: 'OK', onPress: () => router.back() }]);
    } else Alert.alert('Chat', 'Report submitted.');
  } });
  const openSafety = () => Alert.alert('Chat safety', 'Choose an action', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Report', onPress: () => safety.mutate('report') },
    { text: 'Block', style: 'destructive', onPress: () => safety.mutate('block') },
    { text: 'Unmatch', style: 'destructive', onPress: () => safety.mutate('unmatch') },
  ]);
  const query = useQuery({ queryKey: ['dating', 'messages', conversationId], queryFn: () => api.getMessages(conversationId), enabled: Boolean(conversationId), refetchInterval: 5000 });
  useEffect(() => { if (conversationId) void api.markConversationRead(conversationId).then(() => client.invalidateQueries({ queryKey: ['dating', 'messages', conversationId] })); }, [conversationId, api, client]);
  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return undefined;
      void api.setConversationPresence(conversationId);
      return () => { void api.clearConversationPresence(conversationId); };
    }, [api, conversationId]),
  );
  const send = useMutation({ mutationFn: () => api.sendMessage(conversationId, body), onSuccess: () => { setBody(''); client.invalidateQueries({ queryKey: ['dating', 'messages', conversationId] }); } });
  return <View style={styles.container}>
    <View style={styles.header}><View><Text style={styles.title}>{detail.data?.counterpart.displayName ?? "Chat"}</Text><Text style={styles.subtitle}>{detail.data?.counterpart.age ? `${detail.data.counterpart.age} years old` : "Nexora Dating"}</Text></View><Pressable onPress={openSafety} disabled={safety.isPending} style={styles.safety}><Text>•••</Text></Pressable></View>
    <ScrollView style={styles.messages} contentContainerStyle={styles.messageList}>
      {query.data?.items.map((message) => <View key={message.id} style={[styles.message, message.senderId === detail.data?.counterpart.id ? styles.received : styles.sent]}><Text>{message.body}</Text><Text style={styles.meta}>{new Date(message.createdAt).toLocaleTimeString()}</Text></View>)}
    </ScrollView>
    <View style={styles.composer}><TextInput style={styles.input} value={body} onChangeText={setBody} placeholder="Write a message…" multiline /><Pressable disabled={send.isPending || !body.trim()} onPress={() => send.mutate()} style={styles.send}><Text>Send</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 18, gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 24, fontWeight: '800' }, subtitle: { opacity: 0.55, marginTop: 2 }, safety: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }, messages: { flex: 1 }, messageList: { gap: 10, paddingVertical: 8 }, message: { borderWidth: 1, borderRadius: 14, padding: 12, maxWidth: '88%' }, received: { alignSelf: 'flex-start' }, sent: { alignSelf: 'flex-end' }, meta: { marginTop: 5, opacity: 0.55, fontSize: 11 }, composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' }, input: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, maxHeight: 110 }, send: { borderWidth: 1, borderRadius: 14, padding: 14 } });
