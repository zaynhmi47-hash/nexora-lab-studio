import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const api = useDatingApi();
  const client = useQueryClient();
  const [body, setBody] = useState('');
  const scrollRef = useRef<ScrollView>(null);
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
  const send = useMutation({
    mutationFn: () => api.sendMessage(conversationId, body.trim()),
    onSuccess: () => {
      setBody('');
      client.invalidateQueries({ queryKey: ['dating', 'messages', conversationId] });
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
  });
  const retryMessages = () => { void query.refetch(); };
  const retryConversation = () => { void detail.refetch(); };
  const canSend = Boolean(body.trim()) && body.trim().length <= 4000 && !send.isPending && detail.data?.active !== false;

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{detail.data?.counterpart.displayName ?? "Chat"}</Text>
        <Text style={styles.subtitle}>{detail.data?.counterpart.age ? `${detail.data.counterpart.age} years old` : "Nexora Dating"}</Text>
      </View>
      <Pressable onPress={openSafety} disabled={safety.isPending} style={styles.safety}><Text>•••</Text></Pressable>
    </View>
    {detail.isLoading ? <View style={styles.state}><Text>Loading conversation…</Text></View> :
      detail.isError || !detail.data ? <View style={styles.state}><Text>Could not load this conversation.</Text><Pressable onPress={retryConversation} style={styles.retry}><Text>Retry</Text></Pressable></View> :
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageList} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {query.isLoading ? <View style={styles.state}><Text>Loading messages…</Text></View> :
          query.isError ? <View style={styles.state}><Text>Could not load messages.</Text><Pressable onPress={retryMessages} style={styles.retry}><Text>Retry</Text></Pressable></View> :
          query.data?.items.length ? query.data.items.map((message) => <View key={message.id} style={[styles.message, message.senderId === detail.data.counterpart.id ? styles.received : styles.sent]}><Text>{message.body}</Text><Text style={styles.meta}>{new Date(message.createdAt).toLocaleTimeString()}</Text></View>) :
          <View style={styles.state}><Text>No messages yet. Start the conversation.</Text></View>}
      </ScrollView>}
    {send.isError && <View style={styles.errorBanner}><Text>Message failed to send. Check your connection and try again.</Text></View>}
    <View style={styles.composer}>
      <View style={styles.inputWrap}>
        <TextInput style={styles.input} value={body} onChangeText={setBody} placeholder="Write a message…" multiline maxLength={4000} editable={!send.isPending && detail.data?.active !== false} />
        <Text style={styles.counter}>{body.length}/4000</Text>
      </View>
      <Pressable disabled={!canSend} onPress={() => send.mutate()} style={[styles.send, !canSend && styles.sendDisabled]}><Text>{send.isPending ? "Sending…" : "Send"}</Text></Pressable>
    </View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 18, gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 24, fontWeight: '800' }, subtitle: { opacity: 0.55, marginTop: 2 }, safety: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }, messages: { flex: 1 }, messageList: { gap: 10, paddingVertical: 8 }, message: { borderWidth: 1, borderRadius: 14, padding: 12, maxWidth: '88%' }, received: { alignSelf: 'flex-start' }, sent: { alignSelf: 'flex-end' }, meta: { marginTop: 5, opacity: 0.55, fontSize: 11 }, composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' }, inputWrap: { flex: 1 }, input: { borderWidth: 1, borderRadius: 14, padding: 12, maxHeight: 110 }, counter: { textAlign: 'right', opacity: 0.5, fontSize: 10, marginTop: 3 }, send: { borderWidth: 1, borderRadius: 14, padding: 14 }, sendDisabled: { opacity: 0.45 }, state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }, retry: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 }, errorBanner: { borderWidth: 1, borderRadius: 10, padding: 9 } });
