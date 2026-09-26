import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDatingApi } from '@/src/api/provider';
import { useRouter } from 'expo-router';
import { useDatingSession } from '@/src/auth/session';

export default function DiscoverScreen() {
  const api = useDatingApi();
  const router = useRouter();
  const { token, loading: sessionLoading } = useDatingSession();
  const queryClient = useQueryClient();
  const [interestFilter, setInterestFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ interest: '', city: '' });
  const [index, setIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const { data, isLoading } = useQuery({
    queryKey: ['dating', 'discovery', appliedFilters.interest, appliedFilters.city],
    queryFn: () => api.getDiscovery({
      ...(appliedFilters.interest ? { interest: appliedFilters.interest } : {}),
      ...(appliedFilters.city ? { city: appliedFilters.city } : {}),
    }),
    enabled: !sessionLoading && !!token,
  });

  const items = data?.items ?? [];
  const current = items[index];
  const { data: mediaData } = useQuery({
    queryKey: ['dating', 'discovery-media', current?.id],
    queryFn: () => api.getProfileMedia(current!.id),
    enabled: !!current?.id,
  });
  const mediaItems = mediaData?.items ?? [];
  const primaryMedia = mediaItems.find((item) => item.isPrimary) ?? mediaItems[0];

  const applyFilters = () => {
    setIndex(0);
    setAppliedFilters({ interest: interestFilter.trim(), city: cityFilter.trim() });
  };

  const advance = () => {
    if (index < items.length - 1) {
      setIndex((value) => value + 1);
    } else {
      queryClient.invalidateQueries({ queryKey: ['dating', 'discovery', appliedFilters.interest, appliedFilters.city] });
    }
  };

  const submitSwipe = async (action: 'like' | 'pass') => {
    if (!current) return;
    try {
      const result = await api.swipe(current.id, action);
      if (result.matched) {
        Alert.alert('It’s a match!', 'You and this person liked each other.');
      }
      advance();
    } catch (error) {
      Alert.alert('Swipe', error instanceof Error ? error.message : 'Unable to process this action.');
    } finally {
      translateX.value = 0;
      rotate.value = 0;
      setSwiping(false);
    }
  };

  const swipe = (action: 'like' | 'pass') => {
    if (!current || swiping) return;
    setSwiping(true);
    const direction = action === 'like' ? width + 160 : -width - 160;
    translateX.value = withTiming(direction, { duration: 220 }, (finished) => {
      if (finished) runOnJS(submitSwipe)(action);
    });
    rotate.value = withTiming(action === 'like' ? 18 : -18, { duration: 220 });
  };

  const panGesture = Gesture.Pan()
    .enabled(!!current && !swiping)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = event.translationX / 18;
    })
    .onEnd((event) => {
      const threshold = Math.max(100, width * 0.25);
      if (Math.abs(event.translationX) > threshold || Math.abs(event.velocityX) > 900) {
        const action = event.translationX >= 0 ? 'like' : 'pass';
        const direction = action === 'like' ? width + 160 : -width - 160;
        translateX.value = withTiming(direction, { duration: 220 }, (finished) => {
          if (finished) runOnJS(submitSwipe)(action);
        });
        rotate.value = withTiming(action === 'like' ? 18 : -18, { duration: 220 });
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: String(rotate.value) + 'deg' }],
  }));

  const showSafetyActions = () => {
    if (!current) return;
    Alert.alert('Safety', 'Choose an action for this profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => { try { await api.blockUser(current.id); advance(); } catch (error) { Alert.alert('Safety', error instanceof Error ? error.message : 'Unable to block profile.'); } } },
      { text: 'Report', onPress: () => showReportActions() },
    ]);
  };

  const showReportActions = () => {
    if (!current) return;
    Alert.alert('Report profile', 'Choose a reason.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Harassment', onPress: async () => { await api.reportUser(current.id, 'harassment'); advance(); } },
      { text: 'Scam', onPress: async () => { await api.reportUser(current.id, 'scam'); advance(); } },
      { text: 'Impersonation', onPress: async () => { await api.reportUser(current.id, 'impersonation'); advance(); } },
      { text: 'Inappropriate', onPress: async () => { await api.reportUser(current.id, 'inappropriate'); advance(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>
      {sessionLoading ? <Text>Loading session…</Text> : null}
      {!sessionLoading && !token ? <Text>Sign in through Nexora Identity to start discovering.</Text> : null}

      <View style={styles.filters}>
        <TextInput style={styles.filterInput} value={interestFilter} onChangeText={setInterestFilter} placeholder="Interest filter" />
        <TextInput style={styles.filterInput} value={cityFilter} onChangeText={setCityFilter} placeholder="City filter" />
        <Pressable style={styles.applyFilter} onPress={applyFilters}><Text>Apply</Text></Pressable>
      </View>

      {isLoading ? <Text>Loading profiles…</Text> : null}
      {!isLoading && !current ? <Text>No more profiles available.</Text> : null}

      {current ? (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <Pressable onPress={() => router.push(`/profile/${current.id}`)}>
            <View style={styles.mediaFrame}>
              {primaryMedia?.url ? (
                <Image source={{ uri: primaryMedia.url }} style={styles.profileImage} resizeMode="cover" />
              ) : (
                <View style={styles.imageFallback}>
                  <Text style={styles.imageFallbackText}>{current.displayName?.trim().charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>{mediaItems.length ? `${mediaItems.length} photos` : 'Profile'}</Text>
              </View>
            </View>
            <Text style={styles.position}>{index + 1} / {items.length}</Text>
            <Text style={styles.name}>{current.displayName}{current.age !== null ? `, ${current.age}` : ''}</Text>
            <View style={styles.contextRow}>
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityText}>{Math.round(current.compatibilityScore)}% match</Text>
              </View>
              {current.distanceKm !== null ? <Text style={styles.contextText}>{current.distanceKm} km away</Text> : current.locationCity ? <Text style={styles.contextText}>{current.locationCity}</Text> : null}
            </View>
            <Text style={styles.intent}>{current.relationshipIntent || 'Open to connect'}</Text>
            <Text style={styles.bio}>{current.bio || 'No bio yet.'}</Text>
            {current.sharedInterests.length ? <Text style={styles.sharedInterests}>Shared interests: {current.sharedInterests.join(' · ')}</Text> : null}
            {current.interests.length ? <Text>Interests: {current.interests.join(' · ')}</Text> : null}
            {current.education ? <Text>Education: {current.education}</Text> : null}
            {current.occupation ? <Text>Work: {current.occupation}</Text> : null}
            {current.locationCity ? <Text>Location: {current.locationCity}</Text> : null}
            <Text style={styles.detailsHint}>Tap to view full profile</Text>
          </Pressable>
          <View style={styles.actions}>
            <Pressable style={styles.passButton} onPress={() => swipe('pass')}><Text>Pass</Text></Pressable>
            <Pressable style={styles.likeButton} onPress={() => swipe('like')}><Text>Like</Text></Pressable>
          </View>
          <Pressable style={styles.safetyButton} onPress={showSafetyActions}><Text>Safety</Text></Pressable>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 18 },
  title: { fontSize: 32, fontWeight: '800' },
  card: { padding: 16, borderWidth: 1, borderRadius: 24, gap: 14 },
  mediaFrame: { height: 320, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  profileImage: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 72, fontWeight: '800', opacity: 0.25 },
  imageBadge: { position: 'absolute', left: 12, bottom: 12, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.55)' },
  imageBadgeText: { color: '#fff', fontWeight: '700' },
  position: { opacity: 0.6, marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '800' },
  intent: { fontWeight: '700', textTransform: 'capitalize' },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  compatibilityBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  compatibilityText: { fontWeight: '800' },
  contextText: { opacity: 0.65 },
  sharedInterests: { fontWeight: '700' },
  bio: { fontSize: 16, lineHeight: 23 },
  detailsHint: { marginTop: 6, opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 12 },
  passButton: { flex: 1, paddingVertical: 16, borderWidth: 1, borderRadius: 16, alignItems: 'center' },
  likeButton: { flex: 1, paddingVertical: 16, borderWidth: 1, borderRadius: 16, alignItems: 'center' },
  filters: { gap: 8 },
  applyFilter: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  filterInput: { borderWidth: 1, borderRadius: 12, padding: 12 },
  safetyButton: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10 },
});
