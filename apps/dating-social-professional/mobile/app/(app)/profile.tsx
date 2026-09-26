import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDatingApi } from '@/src/api/provider';

export default function ProfileScreen() {
  const api = useDatingApi();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['dating', 'profile'], queryFn: () => api.getMyProfile() });
  const mediaQuery = useQuery({ queryKey: ['dating', 'profile-media', data?.id], queryFn: () => api.getProfileMedia(data!.id), enabled: !!data?.id });
  const [mediaUrl, setMediaUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [intent, setIntent] = useState('dating');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('99');
  const [interests, setInterests] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [maxDistance, setMaxDistance] = useState('100');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);

  useEffect(() => { if (data) { setDisplayName(data.displayName); setBio(data.bio); setIntent(data.relationshipIntent || 'dating'); setMinAge(String(data.preferredMinAge)); setMaxAge(String(data.preferredMaxAge)); setInterests(data.interests.join(', ')); setEducation(data.education); setOccupation(data.occupation); setCity(data.locationCity); setMaxDistance(String(data.maxDistanceKm)); setDiscoveryEnabled(data.discoveryEnabled); } }, [data]);
  const save = useMutation({
    mutationFn: () => api.updateMyProfile({ display_name: displayName, bio, relationship_intent: intent, preferred_min_age: Number(minAge), preferred_max_age: Number(maxAge), interests: interests.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20), education, occupation, location_city: city, max_distance_km: Number(maxDistance), discovery_enabled: discoveryEnabled }),
    onSuccess: (next) => queryClient.setQueryData(['dating', 'profile'], next),
  });

  const addMedia = async () => { if (!data || !mediaUrl.trim()) return; try { await api.addProfileMedia(data.id, { url: mediaUrl.trim(), media_type: 'image', sort_order: mediaQuery.data?.items.length ?? 0, is_primary: !(mediaQuery.data?.items.length) }); setMediaUrl(''); await mediaQuery.refetch(); } catch (error) { Alert.alert('Media', error instanceof Error ? error.message : 'Unable to add media.'); } };
  const pickMedia = async () => {
    if (!data) return;
    if ((mediaQuery.data?.items.length ?? 0) >= 6) { Alert.alert('Media', 'You can have at most 6 profile photos.'); return; }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Media', 'Photo library permission is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      await api.uploadProfileMedia(data.id, { uri: asset.uri, name: asset.fileName ?? `profile-${Date.now()}.jpg`, mimeType: asset.mimeType });
      await mediaQuery.refetch();
    } catch (error) {
      Alert.alert('Media', error instanceof Error ? error.message : 'Unable to upload photo.');
    }
  };
  const setPrimary = async (mediaId: string) => { if (!data) return; try { await api.updateProfileMedia(data.id, mediaId, { is_primary: true }); await mediaQuery.refetch(); await queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] }); } catch (error) { Alert.alert('Media', error instanceof Error ? error.message : 'Unable to set primary photo.'); } };
  const moveMedia = async (mediaId: string, nextIndex: number) => { if (!data) return; try { await api.updateProfileMedia(data.id, mediaId, { sort_order: nextIndex }); await mediaQuery.refetch(); } catch (error) { Alert.alert('Media', error instanceof Error ? error.message : 'Unable to reorder photos.'); } };
  const removeMedia = async (mediaId: string) => { if (!data) return; try { await api.removeProfileMedia(data.id, mediaId); await mediaQuery.refetch(); await queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] }); } catch (error) { Alert.alert('Media', error instanceof Error ? error.message : 'Unable to remove media.'); } };

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Your profile</Text>
    <Text style={styles.label}>Profile photos</Text>
    <View style={styles.gallery}>
      {mediaQuery.data?.items.map((item, index, items) => (
        <View key={item.id} style={styles.mediaItem}>
          <Image source={{ uri: item.url }} style={styles.mediaImage} />
          <Text>{item.isPrimary ? 'Primary' : 'Photo ' + (item.sortOrder + 1)}</Text>
          <View style={styles.mediaActions}>
            {!item.isPrimary ? <Pressable onPress={() => setPrimary(item.id)}><Text>Set primary</Text></Pressable> : null}
            {index > 0 ? <Pressable onPress={() => moveMedia(item.id, index - 1)}><Text>Move left</Text></Pressable> : null}
            {index < items.length - 1 ? <Pressable onPress={() => moveMedia(item.id, index + 1)}><Text>Move right</Text></Pressable> : null}
            <Pressable onPress={() => removeMedia(item.id)}><Text>Remove</Text></Pressable>
          </View>
        </View>
      ))}
    </View>)}</View>
    <TextInput style={styles.input} value={mediaUrl} onChangeText={setMediaUrl} placeholder="Image URL" autoCapitalize="none" />
    <View style={styles.choices}><Pressable onPress={pickMedia} style={styles.save}><Text>Choose photo</Text></Pressable><Pressable onPress={addMedia} style={styles.save}><Text>Add URL</Text></Pressable></View>
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
    <View style={styles.preferenceRow}><View style={styles.preferenceCopy}><Text style={styles.label}>Discovery</Text><Text style={styles.muted}>Allow your profile to appear in discovery.</Text></View><Switch value={discoveryEnabled} onValueChange={setDiscoveryEnabled} /></View>
    <Text style={styles.label}>Maximum discovery distance (km)</Text><TextInput style={styles.input} value={maxDistance} onChangeText={setMaxDistance} keyboardType="number-pad" />
    <Text style={styles.label}>Preferred age range</Text>
    <View style={styles.ageRow}><TextInput style={[styles.input, styles.ageInput]} value={minAge} onChangeText={setMinAge} keyboardType="number-pad" /><Text>to</Text><TextInput style={[styles.input, styles.ageInput]} value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" /></View>
    <Pressable disabled={save.isPending} onPress={() => save.mutate()} style={styles.save}><Text>{save.isPending ? 'Saving…' : 'Save profile'}</Text></Pressable>
    {save.isSuccess ? <Text>Saved.</Text> : null}
    <Pressable onPress={() => router.push('/(app)/settings/notifications')} style={styles.settings}><Text style={styles.settingsTitle}>Notification settings</Text><Text style={styles.settingsSubtitle}>Control match, message, and safety push notifications.</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({ gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, mediaItem: { width: 110, gap: 6 }, mediaActions: { gap: 6 }, mediaImage: { width: 110, height: 110, borderRadius: 14 }, container: { flex: 1, padding: 24, gap: 14 }, title: { fontSize: 30, fontWeight: '800', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 14, padding: 14 }, bio: { minHeight: 120, textAlignVertical: 'top' }, choices: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, choice: { padding: 12, borderWidth: 1, borderRadius: 12 }, label: { fontWeight: '700' }, ageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, ageInput: { flex: 1 }, selected: { opacity: 0.55 }, save: { padding: 16, borderWidth: 1, borderRadius: 14, alignItems: 'center' }, completion: { fontWeight: '700' }, settings: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 4 }, settingsTitle: { fontWeight: '800' }, settingsSubtitle: { opacity: 0.6 } });
