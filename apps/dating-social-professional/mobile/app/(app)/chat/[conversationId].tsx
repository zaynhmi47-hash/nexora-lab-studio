import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const api = useDatingApi();
  const client = useQueryClient();
  const [body, setBody] = useState('');
  const query = useQuery({ queryKey: ['dating', 'messages', conversationId], queryFn: () => api.getMessages(conversationId), enabled: Boolean(conversationId) });
  useEffect(() => { if (conversationId) void api.markConversationRead(conversationId).then(() => client.invalidateQueries({ queryKey: ['dating', 'messages', conversationId] })); }, [conversationId]);
  const send = useMutation({ mutationFn: () => api.sendMessage(conversationId, body), onSuccess: () => { setBody(''); client.invalidateQueries({ queryKey: ['dating', 'messages', conversationId] }); } });
  return <View style={styles.container}>
    <Text style={styles.title}>Chat</Text>
    <ScrollView style={styles.messages} contentContainerStyle={styles.messageList}>
      {query.data?.items.map((message) => <View key={message.id} style={styles.message}><Text>{message.body}</Text><Text style={styles.meta}>{new Date(message.createdAt).toLocaleTimeString()}</Text></View>)}
    </ScrollView>
    <View style={styles.composer}><TextInput style={styles.input} value={body} onChangeText={setBody} placeholder="Write a message…" multiline /><Pressable disabled={send.isPending || !body.trim()} onPress={() => send.mutate()} style={styles.send}><Text>Send</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 18, gap: 12 }, title: { fontSize: 28, fontWeight: '800' }, messages: { flex: 1 }, messageList: { gap: 10, paddingVertical: 8 }, message: { borderWidth: 1, borderRadius: 14, padding: 12, maxWidth: '88%' }, meta: { marginTop: 5, opacity: 0.55, fontSize: 11 }, composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' }, input: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, maxHeight: 110 }, send: { borderWidth: 1, borderRadius: 14, padding: 14 } });
