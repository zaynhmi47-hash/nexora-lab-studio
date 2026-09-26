import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { useDatingApi } from '@/src/api/provider';

export default function ProfileDetailScreen() {
  const api = useDatingApi();
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['dating', 'profile', profileId],
    queryFn: () => api.getProfile(profileId),
    enabled: !!profileId,
  });

  const mediaQuery = useQuery({ queryKey: ['dating', 'profile-media', profileId], queryFn: () => api.getProfileMedia(profileId), enabled: !!profileId });
  const [mediaIndex, setMediaIndex] = useState(0);
  const mediaItems = [...(mediaQuery.data?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentMedia = mediaItems[mediaIndex];
  const [swiping, setSwiping] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const submitSafety = async (action: 'block' | 'report') => {
    if (!profileId) return;
    try {
      if (action === 'block') { await api.blockUser(profileId); Alert.alert('Blocked', 'This profile has been blocked.', [{ text: 'OK', onPress: () => router.back() }]); }
      else { await api.reportUser(profileId, 'other', 'Reported from profile.'); Alert.alert('Report submitted', 'Thank you for helping keep the community safe.'); }
    } catch (error) { Alert.alert('Safety', error instanceof Error ? error.message : 'Unable to complete this action.'); }
    finally { setSafetyOpen(false); }
  };

  const submitSwipe = async (action: 'like' | 'pass') => {
    if (!profileId || swiping) return;
    setSwiping(true);
    try {
      const result = await api.swipe(profileId, action);
      if (result.matched) {
        Alert.alert('It’s a match!', 'You and this person liked each other.', [{ text: 'Continue', onPress: () => router.back() }]);
      } else router.back();
    } catch (error) {
      Alert.alert('Swipe', error instanceof Error ? error.message : 'Unable to process this action.');
    } finally { setSwiping(false); }
  };

  if (isLoading || !data) {
    return <View style={styles.center}><Text>Loading profile…</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: data.displayName }} />
      <View style={styles.topBar}><Pressable onPress={() => router.back()}><Text>Back</Text></Pressable><Pressable onPress={() => setSafetyOpen(true)}><Text>Safety</Text></Pressable></View>
      <View style={styles.hero}>
        <Text style={styles.name}>{data.displayName}{data.age !== null ? `, ${data.age}` : ''}</Text>
        <View style={styles.contextRow}><View style={styles.compatibilityBadge}><Text style={styles.compatibilityText}>{Math.round(data.compatibilityScore)}% match</Text></View>{data.distanceKm !== null ? <Text style={styles.contextText}>{data.distanceKm} km away</Text> : null}</View>
        <Text style={styles.intent}>{data.relationshipIntent || 'No relationship intent set'}</Text>
      </View>
      {mediaItems.length ? (
        <View style={styles.galleryCard}>
          <Image source={{ uri: currentMedia?.url }} style={styles.featuredImage} accessibilityLabel="Profile photo" />
          {mediaItems.length > 1 ? <View style={styles.galleryControls}><Pressable disabled={mediaIndex === 0} onPress={() => setMediaIndex((value) => Math.max(0, value - 1))} style={styles.galleryButton}><Text>Previous</Text></Pressable><Text>{mediaIndex + 1} / {mediaItems.length}</Text><Pressable disabled={mediaIndex === mediaItems.length - 1} onPress={() => setMediaIndex((value) => Math.min(mediaItems.length - 1, value + 1))} style={styles.galleryButton}><Text>Next</Text></Pressable></View> : null}
          <View style={styles.thumbnailRow}>{mediaItems.map((item, itemIndex) => <Pressable key={item.id} onPress={() => setMediaIndex(itemIndex)}><Image source={{ uri: item.url }} style={[styles.thumbnail, itemIndex === mediaIndex && styles.thumbnailActive]} /></Pressable>)}</View>
        </View>
      ) : data.photoUrl ? <Image source={{ uri: data.photoUrl }} style={styles.featuredImage} accessibilityLabel="Profile photo" /> : null
      <View style={styles.compatibilityCard}>
        <Text style={styles.section}>Compatibility context</Text>
        <Text style={styles.body}>Compatibility: {Math.round(data.compatibilityScore)}%</Text>
        {data.sharedInterests.length ? <Text style={styles.body}>Shared interests: {data.sharedInterests.join(' · ')}</Text> : <Text style={styles.muted}>No shared interests identified yet.</Text>}
        {data.distanceKm !== null ? <Text style={styles.body}>Distance: {data.distanceKm} km</Text> : data.locationCity ? <Text style={styles.body}>City: {data.locationCity}</Text> : null}
      </View>
      <Text style={styles.section}>About</Text>
      <Text style={styles.body}>{data.bio || 'No bio yet.'}</Text>
      {data.interests.length ? <><Text style={styles.section}>Interests</Text><Text style={styles.body}>{data.interests.join(' · ')}</Text></> : null}
      {data.education ? <><Text style={styles.section}>Education</Text><Text style={styles.body}>{data.education}</Text></> : null}
      {data.occupation ? <><Text style={styles.section}>Work</Text><Text style={styles.body}>{data.occupation}</Text></> : null}
      {data.locationCity || data.locationCountry ? <><Text style={styles.section}>Location</Text><Text style={styles.body}>{[data.locationCity, data.locationCountry].filter(Boolean).join(', ')}</Text></> : null}
      <View style={styles.meta}><Text>Profile completion: {data.profileCompletion}%</Text></View>
      {safetyOpen ? <View style={styles.safetyCard}><Text style={styles.section}>Safety</Text><Text style={styles.muted}>If something feels wrong, you can block this person or report the profile.</Text><View style={styles.safetyActions}><Pressable onPress={() => void submitSafety('report')} style={styles.safetyButton}><Text>Report</Text></Pressable><Pressable onPress={() => Alert.alert('Block profile?', 'You will no longer see or interact with this profile.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Block', style: 'destructive', onPress: () => void submitSafety('block') }])} style={styles.safetyButton}><Text>Block</Text></Pressable></View></View> : null}
      <View style={styles.actions}><Pressable disabled={swiping} onPress={() => submitSwipe('pass')} style={styles.passButton}><Text>{swiping ? '…' : 'Pass'}</Text></Pressable><Pressable disabled={swiping} onPress={() => submitSwipe('like')} style={styles.likeButton}><Text>{swiping ? '…' : 'Like'}</Text></Pressable></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, gap: 12 },
  galleryCard: { gap: 10 },
  featuredImage: { width: '100%', height: 420, borderRadius: 20 },
  galleryControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  galleryButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  thumbnailRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  thumbnail: { width: 64, height: 64, borderRadius: 10, opacity: 0.7 },
  thumbnailActive: { opacity: 1, borderWidth: 2 },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  compatibilityBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  compatibilityText: { fontWeight: '800' },
  contextText: { opacity: 0.65 },
  compatibilityCard: { padding: 16, borderWidth: 1, borderRadius: 16, gap: 6 },
  muted: { opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  passButton: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  likeButton: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  safetyCard: { padding: 16, borderWidth: 1, borderRadius: 16, gap: 8 },
  safetyActions: { flexDirection: 'row', gap: 8 },
  safetyButton: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  hero: { padding: 24, borderWidth: 1, borderRadius: 24, gap: 8 },
  name: { fontSize: 28, fontWeight: '800' },
  intent: { textTransform: 'capitalize' },
  section: { marginTop: 12, fontSize: 16, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24 },
  meta: { marginTop: 12, padding: 16, borderWidth: 1, borderRadius: 16 },
});
