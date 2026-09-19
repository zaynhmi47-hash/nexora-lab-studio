import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { nexoraCoreLearningRepository, mockLearning, type LearningCourse, type LearningLesson, type LearningPort, type LearningProgress } from '@/lib/learning';

export default function LearnScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? '00000000-0000-0000-0000-000000000001';
  const repository = useMemo<LearningPort>(() => (
    session?.user.provider === 'firebase' ? nexoraCoreLearningRepository(session) : mockLearning
  ), [session]);
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [hub, setHub] = useState<import('@/lib/learning').LearningHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<import('@/lib/learning').LearningAchievement[]>([]);

  useEffect(() => {
    let active = true;
    setError(null);
    Promise.all([repository.getCourses(), repository.getProgress(userId), repository.getAchievements(), repository.getHub()])
      .then(([nextCourses, nextProgress, nextAchievements, nextHub]) => {
        if (!active) return;
        setCourses(nextCourses);
        setProgress(nextProgress);
        setAchievements(nextAchievements);
        setHub(nextHub);
      })
      .catch(() => {
        if (active) setError('Unable to load learning progress. Please try again.');
      });
    return () => { active = false; };
  }, [repository, userId]);

  const currentLesson = useMemo(() => courses.flatMap((course) => course.lessons).find((lesson) => lesson.status === 'in_progress' || lesson.status === 'available'), [courses]);
  const xpIntoLevel = hub?.xpIntoLevel ?? (progress?.xp ?? 0) % 50;
  const xpPercent = `${hub?.progressPercent ?? Math.min((xpIntoLevel / 50) * 100, 100)}%` as `${number}%`;

  const openLesson = (lesson: LearningLesson) => {
    if (lesson.status !== 'locked') router.push(`/lesson/${lesson.id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>LEARNING</Text>
        <Text style={styles.heading}>Quran Mastery</Text>
        <Text style={styles.muted}>Learn step by step. XP and streaks track learning progress, not religious merit.</Text>
        {error && <Text style={styles.error}>{error}</Text>}

        <Card style={styles.progressCard}>
          <View style={styles.row}>
            <View>
              <Text style={styles.progressTitle}>Level {hub?.level ?? progress?.level ?? 1}</Text>
              <Text style={styles.muted}>{hub?.totalXp ?? progress?.xp ?? 0} XP · {hub?.currentStreak ?? progress?.currentStreak ?? 0} day streak</Text>
            </View>
            <Text style={styles.xp}>{xpIntoLevel}/{hub?.xpPerLevel ?? 50} XP</Text>
          </View>
          <View style={styles.bar}><View style={[styles.fill, { width: xpPercent }]} /></View>
        </Card>

        {hub && (
          <Card style={styles.hubCard}>
            <View style={styles.row}>
              <View>
                <Text style={styles.progressTitle}>Learning Hub</Text>
                <Text style={styles.muted}>Semua jalur pembelajaran</Text>
              </View>
              <Text style={styles.hubXp}>{hub.totalXp} XP</Text>
            </View>
            <View style={styles.domainGrid}>
              {([
                ['learning', 'Quran'],
                ['tajwid', 'Tajwid'],
                ['arabic', 'Arabic'],
              ] as const).map(([key, label]) => {
                const domain = hub.domains[key];
                return (
                  <View key={key} style={styles.domainCard}>
                    <Text style={styles.domainLabel}>{label}</Text>
                    <Text style={styles.domainXp}>{domain.xp} XP</Text>
                    <Text style={styles.muted}>{domain.completedCount} selesai</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {hub && (
          <Pressable onPress={() => router.push('/gamification')} accessibilityRole="button">
            <Card style={styles.activityCard}>
              <View style={styles.activityCopy}>
                <Text style={styles.progressTitle}>XP & Activity</Text>
                <Text style={styles.muted}>Lihat statistik XP dan riwayat aktivitas belajar.</Text>
              </View>
              <Text style={styles.activityArrow}>→</Text>
            </Card>
          </Pressable>
        )}

        {hub && (
          <Card style={styles.rewardCard}>
            <Text style={styles.progressTitle}>Unified Rewards</Text>
            {hub.rewards.map((reward) => (
              <View key={reward.key} style={styles.rewardRow}>
                <Text style={[styles.rewardIcon, !reward.earned && styles.rewardLocked]}>{reward.earned ? '✓' : '○'}</Text>
                <View style={styles.lessonInfo}>
                  <Text style={styles.title}>{reward.title}</Text>
                  <Text style={styles.muted}>{reward.description}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card style={styles.achievementCard}>
          <View style={styles.row}><View><Text style={styles.progressTitle}>Achievements</Text><Text style={styles.muted}>{achievements.length} earned</Text></View><Text style={styles.xp}>🏆</Text></View>
          {achievements.length === 0 ? <Text style={[styles.muted, { marginTop: spacing.sm }]}>Complete lessons to unlock your first badge.</Text> : achievements.slice(0, 3).map((item) => <View key={item.id} style={styles.achievement}><Text style={styles.badge}>✓</Text><View style={styles.lessonInfo}><Text style={styles.title}>{item.title}</Text><Text style={styles.muted}>{item.description}</Text></View></View>)}
        </Card>

        {currentLesson && (
          <>
            <Text style={styles.sectionTitle}>Continue learning</Text>
            <Pressable onPress={() => openLesson(currentLesson)}>
              <Card style={styles.continueCard}>
                <Text style={styles.kicker}>NEXT LESSON</Text>
                <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
                <Text style={styles.muted}>{currentLesson.description}</Text>
                <View style={styles.ctaRow}><Text style={styles.cta}>Start lesson →</Text><Text style={styles.reward}>+{currentLesson.xpReward} XP</Text></View>
              </Card>
            </Pressable>
          </>
        )}

        <View style={styles.knowledgeHeader}>
          <View style={styles.knowledgeCopy}>
            <Text style={styles.sectionTitle}>Knowledge</Text>
            <Text style={styles.muted}>Hadith, sirah, fiqh, and Islamic learning with source metadata.</Text>
          </View>
          <Pressable style={styles.knowledgeButton} onPress={() => router.push('/knowledge')}>
            <Text style={styles.knowledgeButtonText}>Explore</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Learning paths</Text>
        {courses.map((course) => {
          const completedCount = course.lessons.filter((lesson) => progress?.completedLessonIds.includes(lesson.id)).length;
          return (
            <Card key={course.id} style={styles.courseCard}>
              <Pressable onPress={() => router.push(`/course/${course.id}`)} accessibilityRole="button">
                <View style={styles.row}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.muted}>{course.description}</Text>
                  </View>
                  <Text style={styles.level}>L{course.level}</Text>
                </View>
                <Text style={styles.courseProgress}>{completedCount}/{course.lessons.length} completed · View path →</Text>
              </Pressable>
              {course.lessons.map((lesson) => {
                const done = progress?.completedLessonIds.includes(lesson.id) || lesson.status === 'completed';
                const locked = lesson.status === 'locked';
                return (
                  <Pressable key={lesson.id} onPress={() => openLesson(lesson)} disabled={locked}>
                    <View style={styles.lesson}>
                      <View style={[styles.circle, done && styles.circleDone]}><Text style={styles.circleText}>{done ? '✓' : lesson.order}</Text></View>
                      <View style={styles.lessonInfo}>
                        <Text style={styles.title}>{lesson.title}</Text>
                        <Text style={styles.muted}>{done ? 'Completed' : locked ? 'Locked' : 'Available'} · +{lesson.xpReward} XP</Text>
                      </View>
                      <Text style={styles.status}>{locked ? '🔒' : done ? '✓' : '›'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 21 },
  error: { color: colors.danger, fontWeight: '700', marginTop: spacing.md },
  progressCard: { marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  xp: { fontWeight: '800', color: colors.primary },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: 8, marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.primary, borderRadius: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  hubCard: { marginTop: spacing.md, borderColor: colors.primary },
  hubXp: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  domainGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  domainCard: { backgroundColor: colors.surfaceMuted, borderRadius: 12, flex: 1, padding: spacing.sm },
  domainLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  domainXp: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 4 },
  activityCard: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' },
  activityCopy: { flex: 1 },
  activityArrow: { color: colors.primary, fontSize: 22, fontWeight: '900', marginLeft: spacing.md },
  rewardCard: { marginTop: spacing.md },
  rewardRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  rewardIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, color: colors.primary, fontSize: 18, fontWeight: '900', height: 32, paddingTop: 5, textAlign: 'center', width: 32 },
  rewardLocked: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  achievementCard: { marginTop: spacing.md },
  achievement: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  badge: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, color: colors.primary, textAlign: 'center', textAlignVertical: 'center', fontWeight: '800', paddingTop: 7 },
  continueCard: { borderColor: colors.primary },
  kicker: { fontSize: 10, fontWeight: '800', color: colors.primary },
  lessonTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 5 },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  cta: { fontWeight: '800', color: colors.primary },
  reward: { fontWeight: '800', color: colors.success },
  knowledgeHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  knowledgeCopy: { flex: 1 },
  knowledgeButton: { marginBottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: colors.primary },
  knowledgeButtonText: { color: colors.white, fontWeight: '800' },
  courseCard: { marginBottom: spacing.md },
  courseInfo: { flex: 1, paddingRight: spacing.md },
  courseTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  courseProgress: { color: colors.primary, fontWeight: '800', marginTop: spacing.md },
  level: { fontWeight: '800', color: colors.primary },
  lesson: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  circleDone: { backgroundColor: colors.primarySoft },
  circleText: { fontWeight: '800', color: colors.primary },
  lessonInfo: { flex: 1, marginLeft: spacing.md },
  title: { fontWeight: '700', color: colors.text, marginBottom: 2 },
  status: { marginLeft: spacing.sm, color: colors.textMuted },
});
