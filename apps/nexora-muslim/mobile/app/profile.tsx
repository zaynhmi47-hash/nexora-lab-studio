import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockProfileRepository, type ProfileSnapshot } from '@/lib/profile';

const progressItems = [
  ['Quran Reading', 'quranReading'],
  ['Tajwid', 'tajwid'],
  ['Arabic', 'arabic'],
  ['Kitab Kuning', 'kitabKuning'],
] as const;

export default function ProfileScreen() {
  const { session, loading: authLoading, signIn, signOut } = useAuth();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    let active = true;
    void mockProfileRepository.getSnapshot().then((next) => {
      if (active) setSnapshot(next);
    });
    return () => { active = false; };
  }, []);

  const updatePreference = async (key: keyof ProfileSnapshot['preferences'], value: boolean) => {
    if (!snapshot) return;
    setSavingPreferences(true);
    try {
      const next = await mockProfileRepository.updatePreferences({
        ...snapshot.preferences,
        [key]: value,
      });
      setSnapshot(next);
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>My Journey</Text>
        <Card style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(session?.user.displayName ?? 'G').charAt(0).toUpperCase()}</Text></View>
          <View style={styles.identity}>
            <Text style={styles.name}>{session?.user.displayName ?? 'Guest'}</Text>
            <Text style={styles.muted}>{session ? session.user.email : 'Sign in to sync your journey'}</Text>
          </View>
        </Card>

        <View style={styles.authButton}>
          <Button title={authLoading ? 'Please wait…' : session ? 'Sign out' : 'Sign in (Development)'} onPress={session ? signOut : signIn} disabled={authLoading} />
        </View>

        {snapshot ? (
          <>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}><Text style={styles.statValue}>{snapshot.stats.learningXp}</Text><Text style={styles.muted}>XP</Text></Card>
              <Card style={styles.statCard}><Text style={styles.statValue}>{snapshot.stats.learningLevel}</Text><Text style={styles.muted}>Level</Text></Card>
              <Card style={styles.statCard}><Text style={styles.statValue}>{snapshot.stats.currentStreak}</Text><Text style={styles.muted}>Day streak</Text></Card>
            </View>

            <Text style={styles.section}>Learning progress</Text>
            {progressItems.map(([label, key]) => {
              const progress = snapshot.progress[key];
              return (
                <Card key={key} style={styles.progressCard}>
                  <View style={styles.row}><Text style={styles.title}>{label}</Text><Text style={styles.value}>{progress}%</Text></View>
                  <View style={styles.bar}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
                </Card>
              );
            })}

            <Text style={styles.section}>Preferences</Text>
            <Card>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceCopy}>
                  <Text style={styles.title}>Notifications</Text>
                  <Text style={styles.muted}>Receive reminders and learning updates.</Text>
                </View>
                <Switch
                  value={snapshot.preferences.notificationsEnabled}
                  onValueChange={(value) => void updatePreference('notificationsEnabled', value)}
                  disabled={savingPreferences}
                />
              </View>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceCopy}>
                  <Text style={styles.title}>Arabic transliteration</Text>
                  <Text style={styles.muted}>Show transliteration where supported.</Text>
                </View>
                <Switch
                  value={snapshot.preferences.showArabicTransliteration}
                  onValueChange={(value) => void updatePreference('showArabicTransliteration', value)}
                  disabled={savingPreferences}
                />
              </View>
            </Card>
          </>
        ) : (
          <Text style={styles.muted}>Loading your journey…</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text },
  profile: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  identity: { marginLeft: spacing.md, flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, marginTop: 4 },
  authButton: { marginTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statCard: { flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm, fontSize: 19, fontWeight: '800', color: colors.text },
  progressCard: { marginTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '700', color: colors.text },
  value: { color: colors.textMuted },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: 8, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.primary, borderRadius: 8 },
  preferenceRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  preferenceCopy: { flex: 1, paddingRight: spacing.md },
});
