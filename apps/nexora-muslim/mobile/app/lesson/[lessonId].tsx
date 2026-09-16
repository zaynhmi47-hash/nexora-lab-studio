import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockLearning, type LearningLesson, type QuizQuestion } from '@/lib/learning';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LearningLesson | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLesson = async () => {
      if (!lessonId) {
        setLesson(null);
        setQuiz(null);
        return;
      }

      const courses = await mockLearning.getCourses();
      const foundLesson = courses
        .flatMap((course) => course.lessons)
        .find((item) => item.id === lessonId) ?? null;
      const questions = await mockLearning.getQuiz(lessonId);

      if (!cancelled) {
        setLesson(foundLesson);
        setQuiz(questions[0] ?? null);
      }
    };

    void loadLesson();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const answerOptions = useMemo(() => quiz?.options ?? [], [quiz]);
  const hasQuiz = answerOptions.length > 0;
  const correct = quiz?.correctOptionIndex === selected;

  if (!lesson) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Lesson not found</Text>
          <Text style={styles.muted}>This learning activity is not available in the current dataset.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const submitAnswer = () => {
    if (selected === null || !quiz) return;
    setSubmitted(true);
  };

  const finishLesson = () => {
    setCompleted(true);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>‹ Back to learning</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.badge}><Text style={styles.badgeText}>LESSON {lesson.order}</Text></View>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.muted}>{lesson.description}</Text>
        </View>

        <Card style={styles.contentCard}>
          <Text style={styles.sectionLabel}>Today's lesson</Text>
          <Text style={styles.body}>{lesson.description}</Text>
        </Card>

        {hasQuiz && quiz && (
          <Card style={styles.quizCard}>
            <Text style={styles.sectionLabel}>Quick check</Text>
            <Text style={styles.question}>{quiz.prompt}</Text>

            <View style={styles.options}>
              {answerOptions.map((option, index) => {
                const isSelected = selected === index;
                const isCorrect = submitted && quiz.correctOptionIndex === index;
                const isWrong = submitted && isSelected && !correct;
                return (
                  <Pressable
                    key={`${quiz.id}-${option}`}
                    onPress={() => !submitted && setSelected(index)}
                    disabled={submitted}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, disabled: submitted }}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong,
                    ]}
                  >
                    <Text style={styles.optionIndex}>{String.fromCharCode(65 + index)}</Text>
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!submitted ? (
              <Pressable
                style={[styles.primaryButton, selected === null && styles.buttonDisabled]}
                onPress={submitAnswer}
                disabled={selected === null}
              >
                <Text style={styles.primaryButtonText}>Check answer</Text>
              </Pressable>
            ) : (
              <View style={[styles.feedback, correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackTitle}>{correct ? 'Correct!' : 'Not quite yet'}</Text>
                <Text style={styles.feedbackText}>
                  {correct
                    ? quiz.explanation ?? 'Great work. You can continue this lesson.'
                    : 'Review the lesson content and try the next activity.'}
                </Text>
              </View>
            )}
          </Card>
        )}

        <View style={styles.footerCard}>
          <View>
            <Text style={styles.reward}>+{lesson.xpReward} XP</Text>
            <Text style={styles.muted}>Learning progress only</Text>
          </View>
          <Pressable
            style={[styles.primaryButton, hasQuiz && !submitted && styles.buttonDisabled]}
            disabled={hasQuiz && !submitted}
            onPress={finishLesson}
          >
            <Text style={styles.primaryButtonText}>{completed ? 'Completed ✓' : 'Complete lesson'}</Text>
          </Pressable>
        </View>

        {completed && (
          <Card style={styles.completeCard}>
            <Text style={styles.completeTitle}>Lesson complete</Text>
            <Text style={styles.muted}>Your prototype progress is ready for persistence through the learning provider in a later integration step.</Text>
            <Pressable style={styles.secondaryButton} onPress={() => router.replace('/learn')}>
              <Text style={styles.secondaryButtonText}>Back to learning</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  back: { color: colors.primary, fontWeight: '800', marginBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  badgeText: { color: colors.primaryDark, fontSize: typography.small, fontWeight: '900' },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '900', marginTop: spacing.md },
  muted: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.xs },
  contentCard: { marginBottom: spacing.lg },
  sectionLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '900', letterSpacing: 0.7 },
  body: { color: colors.text, fontSize: typography.body, lineHeight: 25, marginTop: spacing.md },
  quizCard: { marginBottom: spacing.lg },
  question: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '800', marginTop: spacing.md },
  options: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionCorrect: { borderColor: colors.success, backgroundColor: '#DCFCE7' },
  optionWrong: { borderColor: colors.danger, backgroundColor: '#FEE2E2' },
  optionIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMuted, textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', color: colors.primary },
  optionText: { flex: 1, color: colors.text, fontWeight: '700' },
  primaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.white, fontWeight: '900' },
  buttonDisabled: { opacity: 0.45 },
  feedback: { borderRadius: radius.md, padding: spacing.md },
  feedbackCorrect: { backgroundColor: '#DCFCE7' },
  feedbackWrong: { backgroundColor: '#FEE2E2' },
  feedbackTitle: { color: colors.text, fontWeight: '900' },
  feedbackText: { color: colors.text, marginTop: 4, lineHeight: 20 },
  footerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  reward: { color: colors.success, fontWeight: '900', fontSize: 17 },
  completeCard: { marginTop: spacing.lg },
  completeTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  secondaryButton: { marginTop: spacing.lg, minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.primary, fontWeight: '900' },
});
