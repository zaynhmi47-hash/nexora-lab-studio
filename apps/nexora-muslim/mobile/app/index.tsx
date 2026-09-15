import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, radius, spacing, typography } from '@/constants/theme';

const missions = ['10 ayat Quran', '1 lesson Tajwid', '100x Dhikr'];

export default function HomeScreen() {
  return (
    <Screen>
      <Text style={styles.greeting}>Assalamu'alaikum 👋</Text>
      <Text style={styles.subtitle}>Your Muslim Journey</Text>

      <View style={styles.prayerCard}>
        <Text style={styles.cardLabel}>NEXT PRAYER</Text>
        <Text style={styles.prayer}>Maghrib</Text>
        <Text style={styles.time}>18:02</Text>
        <Text style={styles.light}>Prepare your heart and your prayer.</Text>
      </View>

      <View style={styles.row}>
        <Card><Text style={styles.number}>17</Text><Text style={styles.statLabel}>🔥 day streak</Text></Card>
        <Card><Text style={styles.number}>78%</Text><Text style={styles.statLabel}>Quran progress</Text></Card>
      </View>

      <SectionTitle title="Continue Quran" />
      <Card>
        <Text style={styles.title}>Al-Baqarah · 2:153</Text>
        <Text style={styles.muted}>Continue reading where you left off.</Text>
      </Card>

      <SectionTitle title="Today's Mission" />
      {missions.map((mission) => (
        <View style={styles.mission} key={mission}>
          <Text style={styles.check}>○</Text>
          <Text style={styles.missionText}>{mission}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: typography.title, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted, fontSize: typography.body },
  prayerCard: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.primary },
  cardLabel: { color: colors.primarySoft, fontSize: typography.small, fontWeight: '700' },
  prayer: { color: colors.white, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  time: { color: colors.white, fontSize: 42, fontWeight: '300' },
  light: { color: '#D8F1ED', marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  number: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.text, marginTop: spacing.xs },
  title: { fontWeight: '700', color: colors.text },
  muted: { color: colors.textMuted, marginTop: spacing.xs },
  mission: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  check: { color: colors.primary, fontSize: 20 },
  missionText: { color: colors.text, fontSize: typography.body },
});
