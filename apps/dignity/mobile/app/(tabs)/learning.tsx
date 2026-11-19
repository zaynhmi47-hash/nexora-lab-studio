import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useAuth } from '@/lib/auth';

interface LearningLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  kind: 'lesson' | 'quiz' | 'practice';
  order: number;
  xpReward: number;
  status: 'completed' | 'available' | 'locked';
}
interface LearningCourse {
  id: string;
  title: string;
  description: string;
  level: number;
  lessons: LearningLesson[];
}
interface LearningProgress {
  xp: number;
  level: number;
  currentStreak: number;
  completedLessonIds: string[];
}
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}
const methods = [
  { icon: 'refresh-outline' as const, title: 'Active recall', detail: 'Retrieve ideas from memory.' },
  { icon: 'time-outline' as const, title: 'Spaced practice', detail: 'Return to knowledge over time.' },
  { icon: 'construct-outline' as const, title: 'Deliberate practice', detail: 'Improve with focused feedback.' },
  { icon: 'extension-puzzle-outline' as const, title: 'Real-world projects', detail: 'Apply knowledge in context.' },
];
export default function LearningScreen() {
  const api = useNexoraApi();
  const { status: authStatus } = useAuth();
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadLearning = useCallback(async () => {
    if (authStatus !== 'signed_in') return;
    setLoading(true);
    setError(null);
    try {
      const [coursesResponse, progressResponse] = await Promise.all([
        api.request<LearningCourse[]>('/api/v1/learning/courses/'),
        api.request<LearningProgress>('/api/v1/learning/progress/'),
      ]);
      const nextCourses = payload<LearningCourse[]>(coursesResponse);
      const nextProgress = payload<LearningProgress>(progressResponse);
      setCourses(Array.isArray(nextCourses) ? nextCourses : []);
      setProgress(nextProgress);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load learning content.');
    } finally {
      setLoading(false);
    }
  }, [api, authStatus]);

  useEffect(() => { void loadLearning(); }, [loadLearning]);

  const completeLesson = async (lesson: LearningLesson) => {
    setBusyLesson(lesson.id);
    setError(null);
    setNotice(null);
    try {
      const response = await api.request<LearningProgress>(`/api/v1/learning/lessons/${encodeURIComponent(lesson.id)}/complete/`, { method: 'POST' });
      const nextProgress = payload<LearningProgress>(response);
      setProgress(nextProgress);
      setCourses((current) => current.map((course) => ({
        ...course,
        lessons: course.lessons.map((item) => item.id === lesson.id ? { ...item, status: 'completed' } : item),
      })));
      setNotice(`“${lesson.title}” marked complete. +${lesson.xpReward} XP`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete this lesson.');
    } finally {
      setBusyLesson(null);
    }
  };

  const totalLessons = courses.reduce((total, course) => total + course.lessons.length, 0);
  const completedLessons = progress?.completedLessonIds.length ?? courses.reduce((total, course) => total + course.lessons.filter((lesson) => lesson.status === 'completed').length, 0);

  return <Screen>
    <Text style={styles.eyebrow}>DIGNITY LEARN</Text>
    <Text style={styles.title}>Learn what moves you forward.</Text>
    <Text style={styles.subtitle}>Structured learning and self-directed practice, connected to your goals.</Text>
    <SurfaceCard style={styles.progressCard}>
      <View style={styles.progressTop}><View><Text style={styles.progressLabel}>YOUR LEARNING JOURNEY</Text><Text style={styles.progressValue}>Level {progress?.level ?? 1}</Text></View><View style={styles.xpPill}><Ionicons name="flash" size={14} color={colors.accent} /><Text style={styles.xpText}>{progress?.xp ?? 0} XP</Text></View></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${totalLessons ? Math.min(100, (completedLessons / totalLessons) * 100) : 0}%` }]} /></View>
      <View style={styles.progressMeta}><Text style={styles.metaText}>{completedLessons} of {totalLessons} lessons completed</Text><Text style={styles.metaText}>{progress?.currentStreak ?? 0} day streak</Text></View>
    </SurfaceCard>

    <View style={styles.section}><SectionHeading title="Your learning catalog" subtitle="Continue at a pace that works for you." />
      {loading ? <SurfaceCard style={styles.empty}><Text style={styles.detail}>Loading your learning catalog…</Text></SurfaceCard> : null}
      {!loading && courses.length === 0 ? <SurfaceCard style={styles.empty}><Ionicons name="library-outline" size={23} color={colors.muted} /><Text style={styles.emptyTitle}>No published courses yet</Text><Text style={styles.detail}>New learning paths will appear here when they are published.</Text></SurfaceCard> : null}
      {courses.map((course) => {
        const completed = course.lessons.filter((lesson) => lesson.status === 'completed').length;
        const isExpanded = expandedCourse === course.id;
        return <SurfaceCard key={course.id} style={styles.courseCard}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpandedCourse(isExpanded ? null : course.id)} style={styles.courseHeader}>
            <View style={styles.courseIcon}><Ionicons name="book-outline" size={19} color={colors.primaryDark} /></View>
            <View style={styles.courseCopy}><Text style={styles.courseTitle}>{course.title}</Text><Text style={styles.detail}>Level {course.level} · {completed}/{course.lessons.length} lessons</Text></View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
          </Pressable>
          {isExpanded ? <View style={styles.lessonList}>{course.lessons.map((lesson) => <View key={lesson.id} style={styles.lessonRow}>
            <View style={styles.lessonState}><Ionicons name={lesson.status === 'completed' ? 'checkmark-circle' : lesson.status === 'locked' ? 'lock-closed' : lesson.kind === 'quiz' ? 'help-circle-outline' : 'play-circle-outline'} size={19} color={lesson.status === 'completed' ? colors.success : colors.muted} /></View>
            <View style={styles.lessonCopy}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.detail}>{lesson.kind.toUpperCase()} · {lesson.xpReward} XP</Text>{lesson.description ? <Text style={styles.lessonDescription}>{lesson.description}</Text> : null}</View>
            {lesson.status !== 'locked' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/lesson/[lessonKey]', params: { lessonKey: lesson.id } })} style={styles.completeButton}><Text style={styles.completeText}>Open</Text></Pressable> : null}
            {lesson.status === 'completed' ? <Text style={styles.doneLabel}>Done</Text> : null}
          </View>)}</View> : null}
        </SurfaceCard>;
      })}
      {error ? <Pressable onPress={() => void loadLearning()} style={styles.errorBox}><Text style={styles.errorText}>{error} · Retry</Text></Pressable> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    </View>

    <View style={styles.section}><SectionHeading title="Learn more effectively" subtitle="Evidence-informed ways to build durable skills." />
      <View style={styles.methodGrid}>{methods.map((item) => <SurfaceCard key={item.title} style={styles.method}>
        <View style={styles.methodIcon}><Ionicons name={item.icon} size={19} color={colors.primaryDark} /></View>
        <Text style={styles.methodTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text>
      </SurfaceCard>)}</View>
    </View>
    <View style={styles.section}><SectionHeading title="Explore Dignity domains" subtitle="Different learning and achievement contexts." />
      <Domain title="Academic" detail="Programs, courses, schedules, KRS and official records" icon="school-outline" onPress={() => router.push('/(tabs)/academic')} />
      <Domain title="Career" detail="Skills, professional pathways and portfolio evidence" icon="briefcase-outline" onPress={() => router.push('/(tabs)/career')} />
      <Domain title="Research" detail="Projects, proposals and research milestones" icon="flask-outline" onPress={() => router.push('/(tabs)/research')} />
    </View>
    <SurfaceCard style={styles.note}><Ionicons name="information-circle-outline" size={19} color={colors.primary} /><Text style={styles.noteText}>Learning activity, demonstrated mastery and official academic credit are different kinds of evidence. Dignity keeps them distinct.</Text></SurfaceCard>
  </Screen>;
}
function Domain({ title, detail, icon, onPress }: { title: string; detail: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.domain, pressed && styles.pressed]}>
    <View style={styles.domainIcon}><Ionicons name={icon} size={20} color={colors.primaryDark} /></View>
    <View style={styles.domainCopy}><Text style={styles.domainTitle}>{title}</Text><Text style={styles.detail}>{detail}</Text></View>
    <Ionicons name="chevron-forward" size={17} color={colors.muted} />
  </Pressable>;
}
const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  section: { marginBottom: spacing.section },
  progressCard: { marginBottom: spacing.xl },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  progressValue: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 5 },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  xpText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden', marginTop: 15 },
  progressFill: { height: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  courseCard: { marginBottom: spacing.sm, padding: spacing.md },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  courseIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  courseCopy: { flex: 1 },
  courseTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  lessonList: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  lessonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  lessonState: { paddingTop: 1 },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  lessonDescription: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  completeButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  completeText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  doneLabel: { color: colors.success, fontSize: 10, fontWeight: '900', padding: 6 },
  errorBox: { backgroundColor: colors.roseSoft, padding: 11, borderRadius: radius.medium, marginTop: 8 },
  errorText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  notice: { color: colors.success, fontSize: 11, fontWeight: '700', marginTop: 8 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  method: { width: '48%', flexGrow: 1, minHeight: 118, padding: spacing.md },
  methodIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  methodTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  domain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  domainIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  domainCopy: { flex: 1 },
  domainTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  note: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.blueSoft, borderColor: '#D9E4F0' },
  noteText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.75 },
});