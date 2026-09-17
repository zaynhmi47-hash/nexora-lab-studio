import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAppState } from '@/lib/app-state';
import { mockLearning, nexoraCoreLearningRepository, type LearningLesson, type LearningPort, type QuizQuestion } from '@/lib/learning';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { session } = useAuth();
  const { refresh: refreshAppState } = useAppState();
  const userId = session?.user.id ?? '00000000-0000-0000-0000-000000000001';
  const repository = useMemo<LearningPort>(() => session?.user.provider === 'firebase' ? nexoraCoreLearningRepository(session) : mockLearning, [session]);
  const [lesson, setLesson] = useState<LearningLesson | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!lessonId) return;
        setError(null);
        const [courses, questions, progress] = await Promise.all([
          repository.getCourses(),
          repository.getQuiz(lessonId),
          repository.getProgress(userId),
        ]);
        const found = courses.flatMap((course) => course.lessons).find((item) => item.id === lessonId) ?? null;
        if (active) {
          setLesson(found);
          setQuiz(questions);
          setCompleted(progress.completedLessonIds.includes(lessonId));
          setQuestionIndex(0);
          setSelected(null);
          setSubmitted(false);
          setCorrectAnswers(0);
        }
      } catch {
        if (active) setError('Unable to load this learning activity. Please try again.');
      }
    };
    void load();
    return () => { active = false; };
  }, [lessonId, repository, userId]);

  const currentQuestion = quiz[questionIndex] ?? null;
  const hasQuiz = quiz.length > 0;
  const isLastQuestion = questionIndex === quiz.length - 1;
  const answerIsCorrect = currentQuestion?.correctOptionIndex === selected;

  if (!lesson) return <Screen><View style={styles.center}><Text style={styles.title}>Lesson not found</Text><Pressable style={styles.primaryButton} onPress={() => router.back()}><Text style={styles.primaryText}>Go back</Text></Pressable></View></Screen>;

  const submitAnswer = () => {
    if (selected === null || !currentQuestion || submitted) return;
    setSubmitted(true);
    if (answerIsCorrect) setCorrectAnswers((value) => value + 1);
  };

  const nextQuestion = () => {
    if (!submitted || isLastQuestion) return;
    setQuestionIndex((value) => value + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const finishLesson = async () => {
    if (completed || saving || (hasQuiz && (!submitted || !isLastQuestion))) return;
    setSaving(true);
    try {
      const progress = await repository.completeLesson(userId, lesson.id);
      setCompleted(progress.completedLessonIds.includes(lesson.id));
      await refreshAppState();
    } catch {
      setError('Unable to save your progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to learning</Text></Pressable>
        <View style={styles.header}>
          <View style={styles.badge}><Text style={styles.badgeText}>LESSON {lesson.order}</Text></View>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.muted}>{lesson.description}</Text>
        </View>
        {error && <Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Card>}
        <Card style={styles.contentCard}><Text style={styles.sectionLabel}>Today's lesson</Text><Text style={styles.body}>{lesson.description}</Text></Card>

        {hasQuiz && currentQuestion && <Card style={styles.quizCard}>
          <View style={styles.quizHeader}><Text style={styles.sectionLabel}>Quick check</Text><Text style={styles.muted}>Question {questionIndex + 1} of {quiz.length}</Text></View>
          <Text style={styles.question}>{currentQuestion.prompt}</Text>
          <View style={styles.options}>{currentQuestion.options.map((option, index) => {
            const selectedOption = selected === index;
            const correct = submitted && currentQuestion.correctOptionIndex === index;
            const wrong = submitted && selectedOption && !answerIsCorrect;
            return <Pressable key={`${currentQuestion.id}-${option}`} disabled={submitted} onPress={() => setSelected(index)} style={[styles.option, selectedOption && styles.optionSelected, correct && styles.optionCorrect, wrong && styles.optionWrong]}><Text style={styles.optionIndex}>{String.fromCharCode(65 + index)}</Text><Text style={styles.optionText}>{option}</Text></Pressable>;
          })}</View>
          {!submitted ? <Pressable style={[styles.primaryButton, selected === null && styles.disabled]} disabled={selected === null} onPress={submitAnswer}><Text style={styles.primaryText}>Check answer</Text></Pressable> : <View>
            <View style={[styles.feedback, answerIsCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}><Text style={styles.feedbackTitle}>{answerIsCorrect ? 'Correct!' : 'Not quite yet'}</Text><Text style={styles.feedbackText}>{currentQuestion.explanation ?? 'Review the lesson content and continue learning.'}</Text></View>
            {!isLastQuestion && <Pressable style={styles.primaryButton} onPress={nextQuestion}><Text style={styles.primaryText}>Next question</Text></Pressable>}
          </View>}
        </Card>}

        <View style={styles.footer}><View style={styles.rewardCopy}><Text style={styles.reward}>+{lesson.xpReward} XP</Text><Text style={styles.muted}>{completed ? 'Completed' : hasQuiz && submitted && isLastQuestion ? `${correctAnswers}/${quiz.length} correct` : 'Learning progress only'}</Text></View><Pressable style={[styles.primaryButton, hasQuiz && (!submitted || !isLastQuestion) && !completed && styles.disabled]} disabled={saving || completed || (hasQuiz && (!submitted || !isLastQuestion))} onPress={() => void finishLesson()}><Text style={styles.primaryText}>{saving ? 'Saving…' : completed ? 'Completed ✓' : 'Complete lesson'}</Text></Pressable></View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  back: { color: colors.primary, fontWeight: '800', marginBottom: spacing.xl }, header: { marginBottom: spacing.lg }, badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primarySoft }, badgeText: { color: colors.primaryDark, fontSize: typography.small, fontWeight: '900' },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '900', marginTop: spacing.md }, muted: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.xs }, errorCard: { marginBottom: spacing.lg, borderColor: colors.danger }, errorText: { color: colors.danger, fontWeight: '700' }, contentCard: { marginBottom: spacing.lg }, sectionLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '900' }, body: { color: colors.text, fontSize: typography.body, lineHeight: 25, marginTop: spacing.md }, quizCard: { marginBottom: spacing.lg }, quizHeader: { flexDirection: 'row', justifyContent: 'space-between' }, question: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '800', marginTop: spacing.lg }, options: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.lg }, option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface }, optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, optionCorrect: { borderColor: colors.success, backgroundColor: '#DCFCE7' }, optionWrong: { borderColor: colors.danger, backgroundColor: '#FEE2E2' }, optionIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMuted, textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', color: colors.primary }, optionText: { flex: 1, color: colors.text, fontWeight: '700' }, primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary }, primaryText: { color: colors.white, fontWeight: '900' }, disabled: { opacity: 0.45 }, feedback: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }, feedbackCorrect: { backgroundColor: '#DCFCE7' }, feedbackWrong: { backgroundColor: '#FEE2E2' }, feedbackTitle: { color: colors.text, fontWeight: '900' }, feedbackText: { color: colors.text, marginTop: 4, lineHeight: 20 }, footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted }, rewardCopy: { flex: 1 }, reward: { color: colors.success, fontWeight: '900', fontSize: 17 },
});
