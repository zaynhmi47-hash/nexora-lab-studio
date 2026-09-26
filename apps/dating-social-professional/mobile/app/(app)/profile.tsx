import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';

export default function ProfileScreen() {
  const api = useDatingApi();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['dating', 'profile'], queryFn: () => api.getMyProfile() });
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [intent, setIntent] = useState('dating');

  useEffect(() => { if (data) { setDisplayName(data.displayName); setBio(data.bio); setIntent(data.relationshipIntent || 'dating'); } }, [data]);
  const save = useMutation({
    mutationFn: () => api.updateMyProfile({ display_name: displayName, bio, relationship_intent: intent }),
    onSuccess: (next) => queryClient.setQueryData(['dating', 'profile'], next),
  });

  return <View style={styles.container}>
    <Text style={styles.title}>Your profile</Text>
    {isLoading ? <Text>Loading…</Text> : null}
    <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
    <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} placeholder="Tell people about you" multiline />
    <View style={styles.choices}>{['dating', 'relationship', 'friendship'].map((value) => <Pressable key={value} onPress={() => setIntent(value)} style={[styles.choice, intent === value && styles.selected]}><Text>{value}</Text></Pressable>)}</View>
    <Pressable disabled={save.isPending} onPress={() => save.mutate()} style={styles.save}><Text>{save.isPending ? 'Saving…' : 'Save profile'}</Text></Pressable>
    {save.isSuccess ? <Text>Saved.</Text> : null}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 14, padding: 14 }, bio: { minHeight: 120, textAlignVertical: 'top' }, choices: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, choice: { padding: 12, borderWidth: 1, borderRadius: 12 }, selected: { opacity: 0.55 }, save: { padding: 16, borderWidth: 1, borderRadius: 14, alignItems: 'center' } });
