import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
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
  const [interests, setInterests] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => { if (data) { setDisplayName(data.displayName); setBio(data.bio); setIntent(data.relationshipIntent || 'dating'); setMinAge(String(data.preferredMinAge)); setMaxAge(String(data.preferredMaxAge)); setInterests(data.interests.join(', ')); setEducation(data.education); setOccupation(data.occupation); setCity(data.locationCity); } }, [data]);
  const save = useMutation({
    mutationFn: () => api.updateMyProfile({ display_name: displayName, bio, relationship_intent: intent, preferred_min_age: Number(minAge), preferred_max_age: Number(maxAge), interests: interests.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20), education, occupation, location_city: city }),
    onSuccess: (next) => queryClient.setQueryData(['dating', 'profile'], next),
  });

  return <View style={styles.container}>
    <Text style={styles.title}>Your profile</Text>
    {isLoading ? <Text>Loading…</Text> : null}
    <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
    <TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} placeholder="Tell people about you" multiline />
    <View style={styles.choices}>{['dating', 'relationship', 'friendship'].map((value) => <Pressable key={value} onPress={() => setIntent(value)} style={[styles.choice, intent === value && styles.selected]}><Text>{value}</Text></Pressable>)}</View>
    <Text style={styles.label}>About you</Text>
    <TextInput style={styles.input} value={interests} onChangeText={setInterests} placeholder="Interests (comma separated)" />
    <TextInput style={styles.input} value={education} onChangeText={setEducation} placeholder="Education" />
    <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Occupation" />
    <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
    {data ? <Text style={styles.completion}>Profile completion: {data.profileCompletion}%</Text> : null}
    <Text style={styles.label}>Preferred age range</Text>
    <View style={styles.ageRow}><TextInput style={[styles.input, styles.ageInput]} value={minAge} onChangeText={setMinAge} keyboardType="number-pad" /><Text>to</Text><TextInput style={[styles.input, styles.ageInput]} value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" /></View>
    <Pressable disabled={save.isPending} onPress={() => save.mutate()} style={styles.save}><Text>{save.isPending ? 'Saving…' : 'Save profile'}</Text></Pressable>
    {save.isSuccess ? <Text>Saved.</Text> : null}
    <Pressable onPress={() => router.push('/(app)/settings/notifications')} style={styles.settings}><Text style={styles.settingsTitle}>Notification settings</Text><Text style={styles.settingsSubtitle}>Control match, message, and safety push notifications.</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 14, padding: 14 }, bio: { minHeight: 120, textAlignVertical: 'top' }, choices: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, choice: { padding: 12, borderWidth: 1, borderRadius: 12 }, label: { fontWeight: '700' }, ageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, ageInput: { flex: 1 }, selected: { opacity: 0.55 }, save: { padding: 16, borderWidth: 1, borderRadius: 14, alignItems: 'center' }, completion: { fontWeight: '700' }, settings: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 4 }, settingsTitle: { fontWeight: '800' }, settingsSubtitle: { opacity: 0.6 } });
