import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  mockRamadan,
  nexoraCoreRamadanRepository,
  type RamadanDashboard,
  type RamadanPort,
} from '@/lib/ramadan';

export default function RamadanScreen() {
  const { session } = useAuth();
  const repository = useMemo<RamadanPort>(
    () => session?.user.provider === 'firebase'
      ? nexoraCoreRamadanRepository(session)
      : mockRamadan,
    [session],
  );
  const [dashboard, setDashboard] = useState<RamadanDashboard | null>(null);

  useEffect(() => {
    repository.getDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, [repository]);

  const refresh = async () => setDashboard(await repository.getDashboard());

  return (
    <Screen>
      <Text style={styles.eyebrow}>WORSHIP</Text>
      <Text style={styles.heading}>Ramadan Mode</Text>
      <Text style={styles.muted}>
        A focused dashboard for fasting, Quran, dhikr, and learning goals.
      </Text>

      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>
          {dashboard?.isRamadan
            ? 'Ramadan ' + dashboard.year + ' · Day ' + dashboard.day
            : 'Ramadan is not active today'}
        </Text>
        <Text style={styles.muted}>
          {dashboard?.startDate && dashboard?.endDate
            ? dashboard.startDate + ' → ' + dashboard.endDate
            : 'Season dates are not configured for today.'}
        </Text>
      </Card>

      <View style={styles.row}>
        <Card style={styles.small}>
          <Text style={styles.value}>{dashboard?.fasting.fastedDays ?? 0}</Text>
          <Text style={styles.muted}>Fasted days</Text>
        </Card>
        <Card style={styles.small}>
          <Text style={styles.value}>{dashboard?.fasting.brokenDays ?? 0}</Text>
          <Text style={styles.muted}>Broken</Text>
        </Card>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Daily targets</Text>
        <Text style={styles.target}>Quran · {dashboard?.targets.quranPages ?? 4} pages</Text>
        <Text style={styles.target}>Dhikr · {dashboard?.targets.dhikrCount ?? 100} counts</Text>
        <Text style={styles.target}>
          Learning · {dashboard?.targets.learningMinutes ?? 15} minutes
        </Text>
      </Card>

      <Card style={styles.note}>
        <Text style={styles.cardTitle}>Date verification</Text>
        <Text style={styles.muted}>
          {dashboard?.sourceStatus ??
            'Expected Ramadan dates must be verified with the local moon-sighting authority.'}
        </Text>
      </Card>

      <Pressable style={styles.button} onPress={refresh}>
        <Text style={styles.buttonText}>Refresh Ramadan dashboard</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 20 },
  hero: { marginTop: spacing.lg },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  small: { flex: 1 },
  value: { fontSize: 28, fontWeight: '900', color: colors.text },
  card: { marginTop: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  target: { color: colors.text, paddingVertical: spacing.xs },
  note: { marginTop: spacing.md, backgroundColor: colors.surfaceMuted },
  button: { marginTop: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '800' },
});
