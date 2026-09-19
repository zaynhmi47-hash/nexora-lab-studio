import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  mockGamification,
  nexoraCoreGamificationRepository,
  type GamificationActivity,
  type GamificationPort,
  type GamificationStatistics,
} from '@/lib/gamification';

const periods = [7, 30, 90] as const;

const sourceLabels = {
  learning: 'Quran',
  tajwid: 'Tajwid',
  arabic: 'Arabic',
  gamification: 'Milestone',
} as const;

const actionLabels: Record<string, string> = {
  lesson_completed: 'Lesson selesai',
  practice_completed: 'Latihan selesai',
  topic_completed: 'Topik selesai',
  assessment_completed: 'Assessment selesai',
  milestone_unlocked: 'Milestone tercapai',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function GamificationScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const repository = useMemo<GamificationPort>(
    () => (session?.user.provider === 'firebase' ? nexoraCoreGamificationRepository(session) : mockGamification),
    [session],
  );
  const [days, setDays] = useState<(typeof periods)[number]>(30);
  const [statistics, setStatistics] = useState<GamificationStatistics | null>(null);
  const [activities, setActivities] = useState<GamificationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([repository.getStatistics(days), repository.getActivities(50)])
      .then(([nextStatistics, nextActivities]) => {
        if (!active) return;
        setStatistics(nextStatistics);
        setActivities(nextActivities);
      })
      .catch(() => {
        if (active) setError('Riwayat XP belum dapat dimuat. Coba lagi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days, repository]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Kembali</Text>
        </Pressable>

        <Text style={styles.eyebrow}>GAMIFICATION</Text>
        <Text style={styles.heading}>XP & Activity</Text>
        <Text style={styles.muted}>
          Pantau perkembangan belajar berdasarkan aktivitas yang tercatat di Nexora Core.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.periods}>
          {periods.map((period) => (
            <Pressable
              key={period}
              onPress={() => setDays(period)}
              style={[styles.period, days === period && styles.periodActive]}
            >
              <Text style={[styles.periodText, days === period && styles.periodTextActive]}>
                {period} hari
              </Text>
            </Pressable>
          ))}
        </View>

        {loading && !statistics ? (
          <Card style={styles.loadingCard}>
            <Text style={styles.progressTitle}>Memuat statistik…</Text>
          </Card>
        ) : statistics ? (
          <>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.totalXp}</Text>
                <Text style={styles.statLabel}>XP</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.activityCount}</Text>
                <Text style={styles.statLabel}>Aktivitas</Text>
              </Card>
            </View>

            <Card style={styles.card}>
              <Text style={styles.progressTitle}>XP per domain</Text>
              {(Object.keys(sourceLabels) as Array<keyof typeof sourceLabels>).map((source) => {
                const xp = statistics.bySource[source];
                const max = Math.max(...Object.values(statistics.bySource), 1);
                return (
                  <View key={source} style={styles.sourceRow}>
                    <View style={styles.sourceHeader}>
                      <Text style={styles.title}>{sourceLabels[source]}</Text>
                      <Text style={styles.xp}>+{xp} XP</Text>
                    </View>
                    <View style={styles.bar}>
                      <View style={[styles.fill, { width: `${Math.round((xp / max) * 100)}%` }]} />
                    </View>
                  </View>
                );
              })}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.progressTitle}>XP harian</Text>
              {statistics.dailyXp.length === 0 ? (
                <Text style={[styles.muted, styles.emptySpacing]}>Belum ada aktivitas pada periode ini.</Text>
              ) : (
                <View style={styles.dailyList}>
                  {statistics.dailyXp.map((item) => {
                    const max = Math.max(...statistics.dailyXp.map((entry) => entry.xp), 1);
                    return (
                      <View key={item.date} style={styles.dailyRow}>
                        <Text style={styles.dailyDate}>{formatDate(item.date)}</Text>
                        <View style={styles.dailyBar}>
                          <View style={[styles.fill, { width: `${Math.round((item.xp / max) * 100)}%` }]} />
                        </View>
                        <Text style={styles.dailyXp}>+{item.xp}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </>
        ) : null}

        <View style={styles.historyHeader}>
          <View style={styles.historyCopy}>
            <Text style={styles.sectionTitle}>Riwayat aktivitas</Text>
            <Text style={styles.muted}>Aktivitas terbaru yang menghasilkan XP.</Text>
          </View>
        </View>

        {activities.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.progressTitle}>Belum ada aktivitas</Text>
            <Text style={[styles.muted, styles.emptySpacing]}>
              Selesaikan lesson atau latihan untuk mulai membangun riwayat XP.
            </Text>
          </Card>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityIconText}>+</Text>
              </View>
              <View style={styles.activityBody}>
                <View style={styles.activityHeader}>
                  <Text style={styles.title}>{sourceLabels[activity.source]}</Text>
                  <Text style={styles.xp}>+{activity.xpEarned} XP</Text>
                </View>
                <Text style={styles.activityAction}>
                  {actionLabels[activity.action] ?? activity.action}
                </Text>
                <Text style={styles.muted}>{activity.sourceKey} · {formatDateTime(activity.occurredAt)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  back: { alignSelf: 'flex-start', marginBottom: spacing.md },
  backText: { color: colors.primary, fontWeight: '800' },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 21 },
  error: { color: colors.danger, fontWeight: '700', marginTop: spacing.md },
  periods: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  period: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  periodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { color: colors.textMuted, fontWeight: '800' },
  periodTextActive: { color: colors.white },
  loadingCard: { marginTop: spacing.md },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: { flex: 1 },
  statValue: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontWeight: '700', marginTop: 2 },
  card: { marginTop: spacing.md },
  progressTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sourceRow: { marginTop: spacing.md },
  sourceHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontWeight: '800' },
  xp: { color: colors.primary, fontWeight: '900' },
  bar: { height: 8, borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden', marginTop: 7 },
  fill: { height: 8, borderRadius: 8, backgroundColor: colors.primary },
  emptySpacing: { marginTop: spacing.sm },
  dailyList: { marginTop: spacing.md, gap: spacing.sm },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dailyDate: { width: 82, color: colors.textMuted, fontSize: 12 },
  dailyBar: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  dailyXp: { width: 42, color: colors.text, fontWeight: '800', textAlign: 'right' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: spacing.xl },
  historyHeader: { marginTop: spacing.xl },
  historyCopy: { flex: 1 },
  activityCard: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'flex-start' },
  activityIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  activityIconText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  activityBody: { flex: 1, marginLeft: spacing.md },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  activityAction: { color: colors.text, marginTop: 3, marginBottom: 2, fontWeight: '700' },
});
