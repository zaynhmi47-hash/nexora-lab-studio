import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockPrayerSchedule } from '@/lib/prayer';
import { useAppState } from '@/lib/app-state';

type QuickAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: '/quran' | '/learn' | '/prayer' | '/qibla' | '/dhikr' | '/knowledge' | '/umrah' | '/ramadan';
};

const quickActions: QuickAction[] = [
  { label: 'Quran', icon: 'book-outline', route: '/quran' },
  { label: 'Learn', icon: 'school-outline', route: '/learn' },
  { label: 'Qibla', icon: 'compass-outline', route: '/qibla' },
  { label: 'Dhikr', icon: 'repeat-outline', route: '/dhikr' },
  { label: 'Knowledge', icon: 'library-outline', route: '/knowledge' },
  { label: 'Umrah', icon: 'airplane-outline', route: '/umrah' },
  { label: 'Ramadan', icon: 'moon-outline', route: '/ramadan' },
];

export default function HomeScreen() {
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const { snapshot, loading } = useAppState();
  const nextPrayer = mockPrayerSchedule.prayers.find((prayer) => prayer.isNext) ?? mockPrayerSchedule.prayers[0];
  const streak = snapshot?.learning.currentStreak ?? 0;
  const quranProgress = snapshot?.quran.readingPosition ? 78 : 0;

  const missions = [
    { id: 'quran', label: 'Read 10 Quran ayat', progress: snapshot?.quran.readingPosition ? 'In progress' : '0 / 10' },
    { id: 'tajwid', label: 'Complete 1 Tajwid lesson', progress: snapshot?.learning.completedLessons ? 'In progress' : '0 / 1' },
    { id: 'dhikr', label: 'Complete 100x Dhikr', progress: snapshot ? `${snapshot.dhikr.totalCompleted} / ${snapshot.dhikr.totalTargets}` : '0 / 100' },
  ];

  const toggleMission = (id: string) => {
    setCompletedMissions((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>NEXORA MUSLIM</Text>
          <Text style={styles.greeting}>Assalamu'alaikum 👋</Text>
          <Text style={styles.subtitle}>Build a consistent Muslim journey, one day at a time.</Text>
        </View>
        <Pressable accessibilityLabel="Open profile" accessibilityRole="button" onPress={() => router.push('/profile')} style={styles.profileButton}>
          <Ionicons name="person-outline" size={21} color={colors.primary} />
        </Pressable>
      </View>

      <Pressable accessibilityLabel={`Open ${nextPrayer.name} prayer`} accessibilityRole="button" onPress={() => router.push('/prayer')} style={({ pressed }) => [styles.prayerCard, pressed && styles.pressed]}>
        <View style={styles.prayerTopRow}>
          <View><Text style={styles.cardLabel}>NEXT PRAYER</Text><Text style={styles.prayer}>{nextPrayer.name}</Text></View>
          <View style={styles.prayerIcon}><Ionicons name="time-outline" size={24} color={colors.primary} /></View>
        </View>
        <Text style={styles.time}>{nextPrayer.time}</Text>
        <Text style={styles.light}>Prepare your heart and your prayer.</Text>
      </Pressable>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statIcon}><Ionicons name="flame-outline" size={20} color={colors.warning} /></View>
          <Text style={styles.number}>{loading ? '—' : streak}</Text><Text style={styles.statLabel}>day streak</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statIcon}><Ionicons name="book-outline" size={20} color={colors.primary} /></View>
          <Text style={styles.number}>{loading ? '—' : `${quranProgress}%`}</Text><Text style={styles.statLabel}>Quran progress</Text>
        </Card>
      </View>

      <SectionTitle title="Quick Access" />
      <View style={styles.quickGrid}>{quickActions.map((action) => (
        <Pressable key={action.label} accessibilityLabel={`Open ${action.label}`} accessibilityRole="button" onPress={() => router.push(action.route)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
          <View style={styles.quickIcon}><Ionicons name={action.icon} size={22} color={colors.primary} /></View><Text style={styles.quickLabel}>{action.label}</Text>
        </Pressable>
      ))}</View>

      <SectionTitle title="Continue Quran" action="Open" />
      <Pressable accessibilityLabel="Continue Quran reading" accessibilityRole="button" onPress={() => router.push('/quran')} style={({ pressed }) => [pressed && styles.pressed]}>
        <Card style={styles.continueCard}>
          <View style={styles.continueIcon}><Ionicons name="book" size={22} color={colors.primary} /></View>
          <View style={styles.continueCopy}>
            <Text style={styles.title}>{snapshot?.quran.readingPosition ? `Al-Baqarah · 2:${snapshot.quran.readingPosition.ayahNumber}` : 'Start Quran reading'}</Text>
            <Text style={styles.muted}>{snapshot?.quran.readingPosition ? 'Continue reading where you left off.' : 'Open the Quran reader to begin.'}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${quranProgress}%` }]} /></View>
            <Text style={styles.progressLabel}>{quranProgress}% completed</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>

      <SectionTitle title="Today's Mission" action={`${completedMissions.length}/${missions.length}`} />
      <Card style={styles.missionCard}>{missions.map((mission, index) => {
        const completed = completedMissions.includes(mission.id);
        return <Pressable key={mission.id} accessibilityLabel={`${completed ? 'Undo' : 'Complete'} ${mission.label}`} accessibilityRole="checkbox" accessibilityState={{ checked: completed }} onPress={() => toggleMission(mission.id)} style={[styles.mission, index < missions.length - 1 && styles.missionBorder]}>
          <View style={[styles.check, completed && styles.checkCompleted]}><Ionicons name="checkmark" size={14} color={completed ? colors.white : 'transparent'} /></View>
          <View style={styles.missionCopy}><Text style={[styles.missionText, completed && styles.missionCompleted]}>{mission.label}</Text><Text style={styles.missionProgress}>{completed ? 'Completed' : mission.progress}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>;
      })}</Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2, marginBottom: spacing.xs },
  greeting: { fontSize: typography.title, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  profileButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill },
  prayerCard: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.primary },
  prayerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: colors.primarySoft, fontSize: typography.small, fontWeight: '700' },
  prayer: { color: colors.white, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  prayerIcon: { width: 46, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  time: { color: colors.white, fontSize: 42, fontWeight: '300', marginTop: spacing.sm },
  light: { color: '#D8F1ED', marginTop: spacing.sm, fontSize: typography.caption },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statCard: { flex: 1, minWidth: 0 },
  statIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  number: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.textMuted, marginTop: spacing.xs, fontSize: typography.caption },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  quickAction: { width: '31.8%', minHeight: 92, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.text, fontSize: typography.caption, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  continueCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  continueIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  continueCopy: { flex: 1 },
  title: { fontWeight: '700', color: colors.text, fontSize: typography.body },
  muted: { color: colors.textMuted, marginTop: spacing.xs, fontSize: typography.caption },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  progressLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '700', marginTop: spacing.xs },
  missionCard: { paddingVertical: 0, marginBottom: spacing.xl },
  mission: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  missionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  check: { width: 28, height: 28, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  checkCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  missionCopy: { flex: 1 },
  missionText: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  missionCompleted: { textDecorationLine: 'line-through', color: colors.textMuted },
  missionProgress: { color: colors.textMuted, fontSize: typography.small, marginTop: 2 },
  pressed: { opacity: 0.72 },
});
