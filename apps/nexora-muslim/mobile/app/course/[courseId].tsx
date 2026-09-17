import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockLearning, type LearningCourse, type LearningProgress } from '@/lib/learning';

export default function CourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id ?? '00000000-0000-0000-0000-000000000001';
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!courseId) return;
      const [courses, nextProgress] = await Promise.all([
        mockLearning.getCourses(),
        mockLearning.getProgress(userId),
      ]);
      if (!active) return;
      setCourse(courses.find((item) => item.id === courseId) ?? null);
      setProgress(nextProgress);
    };
    void load();
    return () => { active = false; };
  }, [courseId, userId]);

  if (!course) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Course not found</Text>
          <Text style={styles.muted}>This learning path is not available in the current dataset.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const completedCount = course.lessons.filter((lesson) => progress?.completedLessonIds.includes(lesson.id)).length;
  const completion = course.lessons.length ? Math.round((completedCount / course.lessons.length) * 100) : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>‹ Back to learning</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>LEARNING PATH · LEVEL {course.level}</Text>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.muted}>{course.description}</Text>
        </View>

        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressTitle}>Your progress</Text>
              <Text style={styles.muted}>{completedCount} of {course.lessons.length} activities completed</Text>
            </View>
            <Text style={styles.percent}>{completion}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${completion}%` }]} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Course activities</Text>
        {course.lessons.map((lesson) => {
          const done = progress?.completedLessonIds.includes(lesson.id) || lesson.status === 'completed';
          const locked = lesson.status === 'locked';
          return (
            <Pressable
              key={lesson.id}
              disabled={locked}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked }}
            >
              <Card style={styles.lessonCard}>
                <View style={[styles.number, done && styles.numberDone]}>
                  <Text style={styles.numberText}>{done ? '✓' : lesson.order}</Text>
                </View>
                <View style={styles.lessonCopy}>
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.reward}>+{lesson.xpReward} XP</Text>
                  </View>
                  <Text style={styles.muted}>{lesson.description}</Text>
                  <Text style={styles.status}>{done ? 'Completed' : locked ? 'Locked' : lesson.status === 'in_progress' ? 'In progress' : 'Available'}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  back: { color: colors.primary, fontWeight: '800', marginBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '900', marginTop: spacing.md },
  muted: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.xs },
  progressCard: { marginBottom: spacing.lg },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  percent: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: 8, marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.primary, borderRadius: 8 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginBottom: spacing.md },
  lessonCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  number: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  numberDone: { backgroundColor: colors.primarySoft },
  numberText: { color: colors.primary, fontWeight: '900' },
  lessonCopy: { flex: 1, marginLeft: spacing.md },
  lessonHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  lessonTitle: { flex: 1, color: colors.text, fontWeight: '900', fontSize: 16 },
  reward: { color: colors.success, fontWeight: '800' },
  status: { color: colors.primary, fontWeight: '800', marginTop: spacing.sm },
  primaryButton: { minHeight: 46, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontWeight: '900' },
});
