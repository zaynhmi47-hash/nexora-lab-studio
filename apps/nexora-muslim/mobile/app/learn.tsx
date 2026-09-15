import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockLearning, type LearningCourse, type LearningLesson, type LearningProgress } from '@/lib/learning';

export default function LearnScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? '00000000-0000-0000-0000-000000000001';
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([mockLearning.getCourses(), mockLearning.getProgress(userId)]).then(([nextCourses, nextProgress]) => {
      if (!active) return;
      setCourses(nextCourses);
      setProgress(nextProgress);
    });
    return () => { active = false; };
  }, [userId]);

  const currentLesson = useMemo(() => courses.flatMap((course) => course.lessons).find((lesson) => lesson.status === 'in_progress'), [courses]);
  const xpIntoLevel = (progress?.xp ?? 0) % 100;
  const xpPercent = `${Math.min(xpIntoLevel, 100)}%` as `${number}%`;

  const openLesson = (lesson: LearningLesson) => {
    if (lesson.status !== 'locked') router.push(`/lesson/${lesson.id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>LEARNING</Text>
        <Text style={styles.heading}>Quran Mastery</Text>
        <Text style={styles.muted}>Learn step by step. XP and streaks track learning progress, not religious merit.</Text>

        <Card style={styles.progressCard}>
          <View style={styles.row}>
            <View>
              <Text style={styles.progressTitle}>Level {progress?.level ?? 1}</Text>
              <Text style={styles.muted}>{progress?.xp ?? 0} XP · {progress?.currentStreak ?? 0} day streak</Text>
            </View>
            <Text style={styles.xp}>{xpIntoLevel}/100</Text>
          </View>
          <View style={styles.bar}><View style={[styles.fill, { width: xpPercent }]} /></View>
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
        {courses.map((course) => (
          <Card key={course.id} style={styles.courseCard}>
            <View style={styles.row}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.muted}>{course.description}</Text>
              </View>
              <Text style={styles.level}>L{course.level}</Text>
            </View>
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
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 21 },
  progressCard: { marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  xp: { fontWeight: '800', color: colors.primary },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: 8, marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.primary, borderRadius: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
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
  level: { fontWeight: '800', color: colors.primary },
  lesson: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  circleDone: { backgroundColor: colors.primarySoft },
  circleText: { fontWeight: '800', color: colors.primary },
  lessonInfo: { flex: 1, marginLeft: spacing.md },
  title: { fontWeight: '700', color: colors.text, marginBottom: 2 },
  status: { marginLeft: spacing.sm, color: colors.textMuted },
});
