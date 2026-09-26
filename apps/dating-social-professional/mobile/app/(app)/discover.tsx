import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

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
  const [mediaIndex, setMediaIndex] = useState(0);
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
  const next = items[index + 1];
  const { data: mediaData } = useQuery({
    queryKey: ['dating', 'discovery-media', current?.id],
    queryFn: () => api.getProfileMedia(current!.id),
    enabled: !!current?.id,
  });
  const mediaItems = mediaData?.items ?? [];
  const orderedMedia = [...mediaItems].sort((a, b) => a.sortOrder - b.sortOrder);
  const safeMediaIndex = orderedMedia.length ? Math.min(mediaIndex, orderedMedia.length - 1) : 0;
  const currentMedia = orderedMedia[safeMediaIndex];

  useEffect(() => {
    if (!next?.id) return;
    queryClient.prefetchQuery({
      queryKey: ['dating', 'discovery-media', next.id],
      queryFn: () => api.getProfileMedia(next.id),
    });
  }, [api, next?.id, queryClient]);

  const retryDiscovery = () => {
    setIndex(0);
    setMediaIndex(0);
    queryClient.invalidateQueries({ queryKey: ['dating', 'discovery', appliedFilters.interest, appliedFilters.city] });
  };

  const applyFilters = () => {
    setIndex(0);
    setMediaIndex(0);
    setAppliedFilters({ interest: interestFilter.trim(), city: cityFilter.trim() });
  };

  const advance = () => {
    setMediaIndex(0);
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

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, translateX.value / 90)),
    transform: [{ rotate: '-12deg' }, { scale: 0.9 + Math.min(0.1, Math.max(0, translateX.value / 900)) }],
  }));

  const passOverlayStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -translateX.value / 90)),
    transform: [{ rotate: '12deg' }, { scale: 0.9 + Math.min(0.1, Math.max(0, -translateX.value / 900)) }],
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
      {!isLoading && !current ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptyText}>Try changing your filters or refresh discovery to look for new candidates.</Text>
          <Pressable style={styles.refreshButton} onPress={retryDiscovery}>
            <Text style={styles.refreshText}>Refresh discovery</Text>
          </Pressable>
        </View>
      ) : null}

      {current ? (
        <View style={styles.stack}>
          {next ? (
            <View pointerEvents="none" style={[styles.card, styles.nextCard]}>
              <View style={styles.nextCardPlaceholder}>
                <Text style={styles.nextCardLabel}>Next</Text>
                <Text style={styles.nextCardName}>{next.displayName}{next.age !== null ? `, ${next.age}` : ''}</Text>
              </View>
            </View>
          ) : null}
          <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <Pressable onPress={() => router.push(`/profile/${current.id}`)}>
            <View style={styles.mediaFrame}>
              {currentMedia?.url ? (
                <Image source={{ uri: currentMedia.url }} style={styles.profileImage} resizeMode="cover" />
              ) : (
                <View style={styles.imageFallback}>
                  <Text style={styles.imageFallbackText}>{current.displayName?.trim().charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
              {orderedMedia.length > 1 ? (
                <View style={styles.mediaZones}>
                  <Pressable style={styles.mediaZone} onPress={(event) => { event.stopPropagation(); setMediaIndex((value) => Math.max(0, value - 1)); }} accessibilityLabel="Previous profile photo" />
                  <Pressable style={styles.mediaZone} onPress={(event) => { event.stopPropagation(); setMediaIndex((value) => Math.min(orderedMedia.length - 1, value + 1)); }} accessibilityLabel="Next profile photo" />
                </View>
              ) : null}
              {orderedMedia.length > 1 ? (
                <View style={styles.mediaIndicators}>
                  {orderedMedia.map((media, itemIndex) => (
                    <View key={media.id} style={[styles.mediaIndicator, itemIndex === safeMediaIndex && styles.mediaIndicatorActive]} />
                  ))}
                </View>
              ) : null}
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>{orderedMedia.length ? (safeMediaIndex + 1) + ' / ' + orderedMedia.length : 'Profile'}</Text>
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
          <Animated.View pointerEvents="none" style={[styles.swipeOverlay, styles.likeOverlay, likeOverlayStyle]}>
            <Text style={styles.swipeOverlayText}>LIKE</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeOverlay, styles.passOverlay, passOverlayStyle]}>
            <Text style={styles.swipeOverlayText}>PASS</Text>
          </Animated.View>
          </Animated.View>
        </GestureDetector>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 18 },
  stack: { position: 'relative' },
  title: { fontSize: 32, fontWeight: '800' },
  card: { padding: 16, borderWidth: 1, borderRadius: 24, gap: 14 },
  nextCard: { position: 'absolute', left: 8, right: 8, top: 8, opacity: 0.35, transform: [{ scale: 0.97 }] },
  nextCardPlaceholder: { height: 460, alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextCardLabel: { fontSize: 14, fontWeight: '700', opacity: 0.55, textTransform: 'uppercase' },
  nextCardName: { fontSize: 22, fontWeight: '800' },
  swipeOverlay: { position: 'absolute', top: 28, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 3, borderRadius: 12 },
  likeOverlay: { left: 28, borderColor: '#168a4a', transform: [{ rotate: '-12deg' }] },
  passOverlay: { right: 28, borderColor: '#b3261e', transform: [{ rotate: '12deg' }] },
  swipeOverlayText: { fontSize: 28, fontWeight: '900' },
  mediaFrame: { height: 320, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  profileImage: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 72, fontWeight: '800', opacity: 0.25 },
  mediaZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  mediaZone: { flex: 1 },
  mediaIndicators: { position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', gap: 4 },
  mediaIndicator: { flex: 1, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  mediaIndicatorActive: { backgroundColor: '#fff' },
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
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptyText: { textAlign: 'center', opacity: 0.65, lineHeight: 21 },
  refreshButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginTop: 4 },
  refreshText: { fontWeight: '700' },
});
