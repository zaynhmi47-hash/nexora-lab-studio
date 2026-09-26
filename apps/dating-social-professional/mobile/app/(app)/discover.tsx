import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  const swipe = async (action: 'like' | 'pass') => {
    if (!current) return;
    try {
      const result = await api.swipe(current.id, action);
      if (result.matched) {
        Alert.alert('It’s a match!', 'You and this person liked each other.');
      }
      advance();
    } catch (error) {
      Alert.alert('Swipe', error instanceof Error ? error.message : 'Unable to process this action.');
    }
  };

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
        <View style={styles.card}>
          <Pressable onPress={() => router.push(`/profile/${current.id}`)}>
            <Text style={styles.position}>{index + 1} / {items.length}</Text>
            <Text style={styles.name}>{current.displayName}{current.age !== null ? `, ${current.age}` : ''}</Text>
            <Text style={styles.intent}>{current.relationshipIntent || 'Open to connect'}</Text>
            <Text style={styles.bio}>{current.bio || 'No bio yet.'}</Text>
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
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 18 },
  title: { fontSize: 32, fontWeight: '800' },
  card: { padding: 24, borderWidth: 1, borderRadius: 24, gap: 14 },
  position: { opacity: 0.6, marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '800' },
  intent: { fontWeight: '700', textTransform: 'capitalize' },
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
