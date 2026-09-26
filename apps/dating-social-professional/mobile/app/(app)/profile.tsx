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
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('99');

  useEffect(() => { if (data) { setDisplayName(data.displayName); setBio(data.bio); setIntent(data.relationshipIntent || 'dating'); setMinAge(String(data.preferredMinAge)); setMaxAge(String(data.preferredMaxAge)); } }, [data]);
  const save = useMutation({
    mutationFn: () => api.updateMyProfile({ display_name: displayName, bio, relationship_intent: intent, preferred_min_age: Number(minAge), preferred_max_age: Number(maxAge) }),
    onSuccess: (next) => queryClient.setQueryData(['dating', 'profile'], next),
  });

  return <View style={styles.container}>
    <Text style={styles.title}>Your profile</Text>
    {isLoading ? <Text>Loading…</Text> : null}
    <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
    <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} placeholder="Tell people about you" multiline />
    <View style={styles.choices}>{['dating', 'relationship', 'friendship'].map((value) => <Pressable key={value} onPress={() => setIntent(value)} style={[styles.choice, intent === value && styles.selected]}><Text>{value}</Text></Pressable>)}</View>
    <Text style={styles.label}>Preferred age range</Text>
    <View style={styles.ageRow}><TextInput style={[styles.input, styles.ageInput]} value={minAge} onChangeText={setMinAge} keyboardType="number-pad" /><Text>to</Text><TextInput style={[styles.input, styles.ageInput]} value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" /></View>
    <Pressable disabled={save.isPending} onPress={() => save.mutate()} style={styles.save}><Text>{save.isPending ? 'Saving…' : 'Save profile'}</Text></Pressable>
    {save.isSuccess ? <Text>Saved.</Text> : null}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 14, padding: 14 }, bio: { minHeight: 120, textAlignVertical: 'top' }, choices: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, choice: { padding: 12, borderWidth: 1, borderRadius: 12 }, label: { fontWeight: '700' }, ageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, ageInput: { flex: 1 }, selected: { opacity: 0.55 }, save: { padding: 16, borderWidth: 1, borderRadius: 14, alignItems: 'center' } });
