import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
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

  if (isLoading || !data) {
    return <View style={styles.center}><Text>Loading profile…</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: data.displayName }} />
      <Pressable onPress={() => router.back()}><Text>Back</Text></Pressable>
      <View style={styles.hero}>
        <Text style={styles.name}>{data.displayName}{data.age ? `, ${data.age}` : ''}</Text>
        <Text style={styles.intent}>{data.relationshipIntent || 'No relationship intent set'}</Text>
      </View>
      <Text style={styles.section}>About</Text>
      <Text style={styles.body}>{data.bio || 'No bio yet.'}</Text>
      {data.interests.length ? <><Text style={styles.section}>Interests</Text><Text style={styles.body}>{data.interests.join(' · ')}</Text></> : null}
      {data.education ? <><Text style={styles.section}>Education</Text><Text style={styles.body}>{data.education}</Text></> : null}
      {data.occupation ? <><Text style={styles.section}>Work</Text><Text style={styles.body}>{data.occupation}</Text></> : null}
      {data.locationCity || data.locationCountry ? <><Text style={styles.section}>Location</Text><Text style={styles.body}>{[data.locationCity, data.locationCountry].filter(Boolean).join(', ')}</Text></> : null}
      <View style={styles.meta}><Text>Profile completion: {data.profileCompletion}%</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, gap: 12 },
  hero: { padding: 24, borderWidth: 1, borderRadius: 24, gap: 8 },
  name: { fontSize: 28, fontWeight: '800' },
  intent: { textTransform: 'capitalize' },
  section: { marginTop: 12, fontSize: 16, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24 },
  meta: { marginTop: 12, padding: 16, borderWidth: 1, borderRadius: 16 },
});
