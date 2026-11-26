import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Eyebrow, Heading, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { getLearningCourses, getLearningProgress, type LearningCourse, type LearningProgress } from '@/lib/learning/api';

export default function LearningScreen() {
  const api = useNexoraApi();
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLearning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextCourses, nextProgress] = await Promise.all([
        getLearningCourses(api),
        getLearningProgress(api),
      ]);
      setCourses(nextCourses);
      setProgress(nextProgress);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load learning data.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => {
    void loadLearning();
  }, [loadLearning]));

  const completedCount = progress?.completedLessonIds.length ?? 0;
  const totalLessons = courses.reduce((total, course) => total + course.lessons.length, 0);
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <Screen>
      <View style={styles.top}>
        <Eyebrow>GROW AT YOUR OWN PACE</Eyebrow>
        <Heading title="Your learning" subtitle="Explore ideas, practice new skills and make progress that lasts." />
      </View>

      <Panel style={styles.summary}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}><Ionicons name="school-outline" size={23} color={palette.primary} /></View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.summaryTitle}>Your learning progress</Text>
            <Text style={styles.summaryText}>{progress?.currentStreak ?? 0} day streak · Level {progress?.level ?? 1}</Text>
          </View>
          <Tag label={`${progress?.xp ?? 0} XP`} tone="purple" />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>{completedCount} of {totalLessons} lessons completed</Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <ProgressBar value={progressPercent} color={palette.primary} />
      </Panel>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Your courses</Text>
        <Tag label={`${courses.length} COURSES`} tone="purple" />
      </View>

      {loading ? (
        <Panel style={styles.statePanel}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.stateText}>Loading your learning workspace…</Text>
        </Panel>
      ) : error ? (
        <Panel style={styles.statePanel}>
          <Ionicons name="cloud-offline-outline" size={27} color={palette.rose} />
          <Text style={styles.stateTitle}>Learning data is unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={() => void loadLearning()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
        </Panel>
      ) : courses.length === 0 ? (
        <Panel style={styles.statePanel}>
          <Ionicons name="library-outline" size={27} color={palette.muted} />
          <Text style={styles.stateTitle}>No published courses yet</Text>
          <Text style={styles.stateText}>Courses will appear here when they are published in your Dignity learning workspace.</Text>
        </Panel>
      ) : courses.map((course) => {
        const completed = course.lessons.filter((lesson) => lesson.status === 'completed').length;
        const percent = course.lessons.length ? Math.round((completed / course.lessons.length) * 100) : 0;
        const nextLesson = course.lessons.find((lesson) => lesson.status !== 'completed');
        return (
          <Panel key={course.id} style={styles.course}>
            <View style={styles.courseTop}>
              <View style={styles.courseIcon}><Ionicons name="book-outline" size={22} color={palette.primary} /></View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription}>{course.description || 'A guided learning course.'}</Text>
              </View>
              <Tag label={`LEVEL ${course.level}`} tone="cyan" />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>{completed} of {course.lessons.length} lessons</Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
            <ProgressBar value={percent} color={palette.primary} />
            {course.lessons.length > 0 && (
              <View style={styles.lessonList}>
                {course.lessons.map((lesson) => (
                  <Pressable
                    key={lesson.id}
                    disabled={lesson.status === 'locked'}
                    onPress={() => router.push({ pathname: '/(tabs)/lesson/[lessonKey]', params: { lessonKey: lesson.id } })}
                    style={({ pressed }) => [styles.lessonRow, pressed && styles.pressed, lesson.status === 'locked' && styles.locked]}
                  >
                    <View style={[styles.lessonState, lesson.status === 'completed' && styles.lessonDone, lesson.status === 'locked' && styles.lessonLocked]}>
                      <Ionicons name={lesson.status === 'completed' ? 'checkmark' : lesson.status === 'locked' ? 'lock-closed' : lesson.kind === 'quiz' ? 'help' : 'play'} size={13} color={lesson.status === 'completed' ? '#fff' : lesson.status === 'locked' ? palette.muted : palette.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonMeta}>{lesson.kind.toUpperCase()} · {lesson.xpReward} XP</Text>
                    </View>
                    <Tag label={lesson.status === 'completed' ? 'DONE' : lesson.status === 'locked' ? 'LOCKED' : 'OPEN'} tone={lesson.status === 'completed' ? 'green' : lesson.status === 'locked' ? 'neutral' : 'purple'} />
                    {lesson.status !== 'locked' && <Ionicons name="chevron-forward" size={15} color={palette.muted} />}
                  </Pressable>
                ))}
              </View>
            )}
            {nextLesson && (
              <Pressable onPress={() => router.push({ pathname: '/(tabs)/lesson/[lessonKey]', params: { lessonKey: nextLesson.id } })} style={styles.continueButton}>
                <Text style={styles.continueText}>{completed === 0 ? 'Start course' : 'Continue course'}</Text>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </Pressable>
            )}
          </Panel>
        );
      })}

      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Explore your growth</Text></View>
      <Panel style={{ gap: 4 }}>
        <Pressable style={styles.exploreRow} onPress={() => router.push('/(tabs)/journey')}>
          <View style={[styles.exploreIcon, { backgroundColor: palette.greenSoft }]}><Ionicons name="trending-up-outline" size={20} color={palette.green} /></View>
          <View style={{ flex: 1 }}><Text style={styles.exploreTitle}>My learning journey</Text><Text style={styles.exploreText}>See your progress, milestones and evidence.</Text></View>
          <Ionicons name="arrow-forward" size={16} color={palette.muted} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.exploreRow} onPress={() => router.push('/(tabs)/skills')}>
          <View style={[styles.exploreIcon, { backgroundColor: palette.primarySoft }]}><Ionicons name="ribbon-outline" size={20} color={palette.primary} /></View>
          <View style={{ flex: 1 }}><Text style={styles.exploreTitle}>Skills & competencies</Text><Text style={styles.exploreText}>Understand what you can do and what to practice.</Text></View>
          <Ionicons name="arrow-forward" size={16} color={palette.muted} />
        </Pressable>
      </Panel>
      <Text style={styles.note}>Course catalog and completion status are loaded from the authenticated Dignity learning API.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: 9 },
  summary: { gap: 11 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  summaryIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  summaryText: { color: palette.muted, fontSize: 10 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  progressLabel: { color: palette.muted, fontSize: 9, fontWeight: '600' },
  progressPercent: { color: palette.primary, fontSize: 9, fontWeight: '900' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10 },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  statePanel: { alignItems: 'center', paddingVertical: 24 },
  stateTitle: { color: palette.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  stateText: { color: palette.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  retryButton: { backgroundColor: palette.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  course: { gap: 12 },
  courseTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  courseIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  courseTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  courseDescription: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  lessonList: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 5, gap: 2 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  lessonState: { width: 26, height: 26, borderRadius: 9, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  lessonDone: { backgroundColor: palette.green },
  lessonLocked: { backgroundColor: '#F0F2F7' },
  lessonTitle: { color: palette.ink, fontSize: 10, fontWeight: '700' },
  lessonMeta: { color: palette.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
  locked: { opacity: 0.65 },
  continueButton: { minHeight: 41, borderRadius: 12, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  continueText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  exploreRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  exploreIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  exploreTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  exploreText: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  divider: { height: 1, backgroundColor: palette.line, marginLeft: 50 },
  note: { color: '#9AA3B6', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10 },
  pressed: { opacity: 0.75 },
});
