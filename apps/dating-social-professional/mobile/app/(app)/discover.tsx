import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDatingApi } from '@/src/api/provider';
import { useDatingSession } from '@/src/auth/session';

export default function DiscoverScreen() {
  const api = useDatingApi();
  const { token, loading: sessionLoading } = useDatingSession();
  const queryClient = useQueryClient();
  const [interestFilter, setInterestFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['dating', 'discovery'],
    queryFn: () => api.getDiscovery({ ...(interestFilter ? { interest: interestFilter } : {}), ...(cityFilter ? { city: cityFilter } : {}) }),
    enabled: !sessionLoading && !!token,
  });



  const showSafetyActions = () => {
    if (!current) return;
    Alert.alert("Safety", "Choose an action for this profile.", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => { await api.blockUser(current.id); } },
      { text: "Report", onPress: () => showReportActions() },
    ]);
  };

  const showReportActions = () => {
    if (!current) return;
    Alert.alert("Report profile", "Choose a reason.", [
      { text: "Cancel", style: "cancel" },
      { text: "Harassment", onPress: () => api.reportUser(current.id, "harassment") },
      { text: "Scam", onPress: () => api.reportUser(current.id, "scam") },
      { text: "Impersonation", onPress: () => api.reportUser(current.id, "impersonation") },
      { text: "Inappropriate", onPress: () => api.reportUser(current.id, "inappropriate") },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>
      {sessionLoading ? <Text>Loading session…</Text> : null}
      {!sessionLoading && !token ? <Text>Sign in through Nexora Identity to start discovering.</Text> : null}
      <View style={styles.filters}><TextInput style={styles.filterInput} value={interestFilter} onChangeText={setInterestFilter} placeholder="Interest filter" /><TextInput style={styles.filterInput} value={cityFilter} onChangeText={setCityFilter} placeholder="City filter" />
        <Pressable style={styles.applyFilter} onPress={() => queryClient.invalidateQueries({ queryKey: ["dating", "discovery"] })}><Text>Apply</Text></Pressable></View>
      {isLoading ? <Text>Loading profiles…</Text> : null}
      {!isLoading && !current ? <Text>No profiles available yet.</Text> : null}
      {current ? (
        <View style={styles.card}>
          <Text style={styles.name}>{current.displayName}, {current.age}</Text>
          <Text style={styles.bio}>{current.bio || 'No bio yet.'}</Text>
          {current.interests.length ? <Text>Interests: {current.interests.join(' · ')}</Text> : null}
          {current.education ? <Text>Education: {current.education}</Text> : null}
          {current.occupation ? <Text>Work: {current.occupation}</Text> : null}
          {current.locationCity ? <Text>Location: {current.locationCity}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={() => api.swipe(current.id, 'pass')}>
              <Text>Pass</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => api.swipe(current.id, 'like')}>
              <Text>Like</Text>
            </Pressable>
          </View>
          <Pressable style={styles.safetyButton} onPress={showSafetyActions}>
            <Text>Safety</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 18 },
  title: { fontSize: 32, fontWeight: '800' },
  card: { padding: 24, borderWidth: 1, borderRadius: 24, gap: 12 },
  name: { fontSize: 24, fontWeight: '800' },
  bio: { fontSize: 16, lineHeight: 23 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1, borderRadius: 16 },
  filters: { gap: 8 }, applyFilter: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }, filterInput: { borderWidth: 1, borderRadius: 12, padding: 12 }, safetyButton: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10 }
});