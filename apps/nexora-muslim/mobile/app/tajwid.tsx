import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockTajwid, nexoraCoreTajwidRepository, type TajwidProgress, type TajwidTopic } from '@/lib/tajwid';
import { useAuth } from '@/lib/auth/AuthProvider';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function TajwidScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [topics, setTopics] = useState<TajwidTopic[]>([]);
  const [progress, setProgress] = useState<TajwidProgress | null>(null);

  useEffect(() => {
    const repository = session?.user.provider === 'firebase' ? nexoraCoreTajwidRepository(session) : mockTajwid;
    const userId = session?.user.id ?? DEMO_USER_ID;
    void Promise.all([repository.getTopics(), repository.getProgress(userId)]).then(
      ([loadedTopics, loadedProgress]) => {
        setTopics(loadedTopics);
        setProgress(loadedProgress);
      },
    );
  }, [session]);

  const completedCount = progress?.completedTopicIds.length ?? 0;
  const completion = useMemo(
    () => (topics.length ? Math.round((completedCount / topics.length) * 100) : 0),
    [completedCount, topics.length],
  );

  return (
    <Screen>
      <Text style={styles.eyebrow}>TAJWID & TAHSIN</Text>
      <Text style={styles.title}>Perbaiki bacaan, satu tahap demi satu tahap.</Text>
      <Text style={styles.subtitle}>
        Pelajari makhraj, sifat huruf, hukum bacaan, lalu uji kemampuan melalui latihan dan assessment.
      </Text>

      <Card>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.cardLabel}>Kemajuan Tajwid</Text>
            <Text style={styles.progressValue}>{completion}% selesai</Text>
          </View>
          <Text style={styles.xp}>{progress?.xpEarned ?? 0} XP</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>
        <Text style={styles.helper}>{completedCount} dari {topics.length} topik selesai</Text>
      </Card>

      <SectionTitle title="Jalur Tajwid" />
      <View style={styles.list}>
        {topics.map((topic) => {
          const locked = topic.status === 'locked';
          const completed = topic.status === 'completed';
          return (
            <Pressable
              key={topic.id}
              disabled={locked}
              onPress={() => router.push(`/tajwid/${topic.id}`)}
              style={({ pressed }) => [styles.topicRow, pressed && !locked && styles.pressed, locked && styles.locked]}
            >
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{topic.order}</Text>
              </View>
              <View style={styles.topicBody}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.shortDescription}</Text>
                <Text style={styles.topicMeta}>{topic.xpReward} XP</Text>
              </View>
              <Text style={[styles.status, completed && styles.completedStatus]}>
                {completed ? '✓' : locked ? '🔒' : '›'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Tahap Akhir" />
      <Card>
        <Text style={styles.cardLabel}>Assessment Tajwid</Text>
        <Text style={styles.assessmentText}>
          Uji pemahaman seluruh materi. Lulus jika minimal 70% jawaban benar.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.assessmentButton, pressed && styles.pressed]}
          onPress={() => router.push('/tajwid/assessment')}
        >
          <Text style={styles.assessmentButtonText}>Mulai Assessment</Text>
        </Pressable>
      </Card>

      <Text style={styles.note}>
        Latihan ini adalah sarana belajar. XP dan streak tidak dimaksudkan sebagai ukuran pahala atau nilai ibadah.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', lineHeight: 34, marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700' },
  progressValue: { color: colors.text, fontSize: typography.heading, fontWeight: '800', marginTop: 2 },
  xp: { color: colors.primaryDark, fontSize: typography.body, fontWeight: '800' },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 10, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.primary, borderRadius: radius.pill, height: '100%' },
  helper: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.sm },
  list: { gap: spacing.sm },
  topicRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', padding: spacing.md },
  pressed: { opacity: 0.72 },
  locked: { opacity: 0.5 },
  orderBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 },
  orderText: { color: colors.primaryDark, fontSize: typography.body, fontWeight: '800' },
  topicBody: { flex: 1, marginHorizontal: spacing.md },
  topicTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  topicDescription: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 18, marginTop: 2 },
  topicMeta: { color: colors.primary, fontSize: typography.small, fontWeight: '800', marginTop: 4 },
  status: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  completedStatus: { color: colors.success },
  assessmentText: { color: colors.textMuted, fontSize: typography.body, lineHeight: 21, marginTop: spacing.sm },
  assessmentButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.md, paddingVertical: 13 },
  assessmentButtonText: { color: colors.white, fontSize: typography.body, fontWeight: '800' },
  note: { color: colors.textMuted, fontSize: typography.small, lineHeight: 17, marginTop: spacing.md },
});
