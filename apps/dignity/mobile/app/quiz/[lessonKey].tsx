import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useAuth } from '@/lib/auth';

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};
type QuizPayload = {
  lessonId: string;
  title: string;
  passingScorePercent: number;
  questions: QuizQuestion[];
};
type QuestionResult = {
  questionId: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
};
type QuizResult = {
  attemptId: string;
  lessonId: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  xpEarned: number;
  completedAt: string;
  questionResults: QuestionResult[];
};
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export default function QuizExperienceScreen() {
  const { lessonKey } = useLocalSearchParams<{ lessonKey: string }>();
  const api = useNexoraApi();
  const { status: authStatus } = useAuth();
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    if (authStatus !== 'signed_in' || !lessonKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<QuizPayload>(
        `/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/quiz/`,
      );
      const nextQuiz = payload<QuizPayload>(response);
      if (!nextQuiz || !Array.isArray(nextQuiz.questions) || nextQuiz.questions.length === 0) {
        throw new Error('This assessment has no available questions.');
      }
      setQuiz(nextQuiz);
      setAnswers({});
      setResult(null);
      setCompletionNotice(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load this assessment.');
    } finally {
      setLoading(false);
    }
  }, [api, authStatus, lessonKey]);

  useEffect(() => { void loadQuiz(); }, [loadQuiz]);

  const answeredCount = useMemo(
    () => quiz?.questions.filter((question) => Number.isInteger(answers[question.id])).length ?? 0,
    [answers, quiz],
  );

  const submitQuiz = async () => {
    if (!quiz || !lessonKey || answeredCount !== quiz.questions.length || submitting) return;
    setSubmitting(true);
    setError(null);
    setCompletionNotice(null);
    try {
      const orderedAnswers = quiz.questions.map((question) => answers[question.id]);
      const response = await api.request<QuizResult>(
        `/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/quiz/complete/`,
        { method: 'POST', body: JSON.stringify({ answers: orderedAnswers }) },
      );
      const nextResult = payload<QuizResult>(response);
      setResult(nextResult);
      if (nextResult.passed) {
        setCompleting(true);
        try {
          await api.request(
            `/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/complete/`,
            { method: 'POST' },
          );
          setCompletionNotice('Assessment passed. This lesson is now marked complete.');
        } catch (cause) {
          setCompletionNotice(
            cause instanceof Error
              ? `Assessment passed, but lesson completion needs a retry: ${cause.message}`
              : 'Assessment passed. Please refresh your learning progress.',
          );
        } finally {
          setCompleting(false);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    setCompletionNotice(null);
  };

  return <>
    <Stack.Screen options={{ title: quiz?.title ?? 'Knowledge check' }} />
    <Screen>
      <Text style={styles.eyebrow}>DIGNITY LEARN · ASSESSMENT</Text>
      {loading ? <SurfaceCard><Text style={styles.muted}>Loading assessment…</Text></SurfaceCard> : null}
      {error && !quiz ? <SurfaceCard style={styles.stateCard}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void loadQuiz()}><Text style={styles.action}>Try again</Text></Pressable></SurfaceCard> : null}
      {quiz ? <>
        <Text style={styles.title}>{quiz.title}</Text>
        <Text style={styles.subtitle}>Choose the best answer for every question. Your score and explanations appear after submission.</Text>
        <SurfaceCard style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>ASSESSMENT PROGRESS</Text>
            <Text style={styles.progressCount}>{answeredCount}/{quiz.questions.length}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(answeredCount / quiz.questions.length) * 100}%` }]} />
          </View>
          <Text style={styles.muted}>Passing score: {quiz.passingScorePercent}%</Text>
        </SurfaceCard>

        {quiz.questions.map((question, questionIndex) => {
          const selected = answers[question.id];
          const review = result?.questionResults.find((item) => item.questionId === question.id);
          return <SurfaceCard key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>QUESTION {questionIndex + 1} OF {quiz.questions.length}</Text>
            <Text style={styles.question}>{question.prompt}</Text>
            <View style={styles.options}>
              {question.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                const isCorrect = review?.correctOptionIndex === optionIndex;
                const isWrongSelection = Boolean(review && isSelected && !review.isCorrect);
                return <Pressable
                  key={`${question.id}-${optionIndex}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled: Boolean(result) }}
                  disabled={Boolean(result)}
                  onPress={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                  style={[
                    styles.option,
                    isSelected && !result && styles.optionSelected,
                    isCorrect && styles.optionCorrect,
                    isWrongSelection && styles.optionWrong,
                  ]}
                >
                  <View style={[styles.optionMarker, isSelected && !result && styles.optionMarkerSelected, isCorrect && styles.optionMarkerCorrect]}>
                    {isCorrect ? <Text style={styles.markerText}>✓</Text> : <Text style={[styles.markerText, isSelected && !result && styles.markerSelectedText]}>{String.fromCharCode(65 + optionIndex)}</Text>}
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                  {isWrongSelection ? <Text style={styles.wrongLabel}>Your answer</Text> : null}
                  {isCorrect && !isSelected ? <Text style={styles.correctLabel}>Correct</Text> : null}
                </Pressable>;
              })}
            </View>
            {review ? <View style={[styles.feedback, review.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackTitle}>{review.isCorrect ? 'Correct answer' : 'Review this answer'}</Text>
              {review.explanation ? <Text style={styles.feedbackText}>{review.explanation}</Text> : null}
            </View> : null}
          </SurfaceCard>;
        })}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {result ? <SurfaceCard style={styles.resultCard}>
          <Text style={styles.resultEyebrow}>YOUR RESULT</Text>
          <Text style={styles.score}>{result.scorePercent}%</Text>
          <Text style={styles.resultTitle}>{result.passed ? 'Assessment passed' : 'Keep practicing'}</Text>
          <Text style={styles.muted}>{result.correctAnswers} of {result.totalQuestions} answers correct · {result.xpEarned} XP earned</Text>
          <Text style={result.passed ? styles.passed : styles.notPassed}>
            {result.passed ? 'You met the passing score.' : `You need ${quiz.passingScorePercent}% to pass. Review the explanations and try again.`}
          </Text>
          {completionNotice ? <Text style={styles.completionNotice}>{completionNotice}</Text> : null}
          {completing ? <Text style={styles.muted}>Updating your learning progress…</Text> : null}
          {!result.passed ? <Pressable onPress={retry} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Try again</Text></Pressable> : null}
        </SurfaceCard> : <Pressable
          accessibilityRole="button"
          disabled={answeredCount !== quiz.questions.length || submitting}
          onPress={() => void submitQuiz()}
          style={[styles.submitButton, (answeredCount !== quiz.questions.length || submitting) && styles.disabled]}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting…' : `Submit answers · ${answeredCount}/${quiz.questions.length}`}</Text>
        </Pressable>}
      </> : null}
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.action}>Back to lesson</Text></Pressable>
    </Screen>
  </>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 9 },
  title: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 8, marginBottom: spacing.lg },
  progressCard: { marginBottom: spacing.lg },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  progressCount: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden', marginVertical: 11 },
  fill: { height: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
  questionCard: { marginBottom: spacing.md, padding: spacing.md },
  questionNumber: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 9 },
  question: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '800' },
  options: { gap: 8, marginTop: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: 11, minHeight: 48 },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.primarySoft },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.roseSoft },
  optionMarker: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  optionMarkerSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionMarkerCorrect: { borderColor: colors.success, backgroundColor: colors.success },
  markerText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  markerSelectedText: { color: '#FFFFFF' },
  optionText: { color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: '600', flex: 1 },
  wrongLabel: { color: colors.danger, fontSize: 9, fontWeight: '900' },
  correctLabel: { color: colors.success, fontSize: 9, fontWeight: '900' },
  feedback: { borderRadius: radius.medium, padding: 11, marginTop: spacing.md },
  feedbackCorrect: { backgroundColor: colors.successSoft },
  feedbackWrong: { backgroundColor: colors.roseSoft },
  feedbackTitle: { color: colors.ink, fontSize: 11, fontWeight: '900', marginBottom: 4 },
  feedbackText: { color: colors.ink, fontSize: 11, lineHeight: 17 },
  resultCard: { marginTop: spacing.md, alignItems: 'center', padding: spacing.lg },
  resultEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  score: { color: colors.ink, fontSize: 42, lineHeight: 50, fontWeight: '900', marginTop: 8 },
  resultTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 4 },
  passed: { color: colors.success, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  notPassed: { color: colors.danger, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  completionNotice: { color: colors.success, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 9 },
  muted: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  submitButton: { backgroundColor: colors.primary, borderRadius: radius.pill, padding: 15, alignItems: 'center', marginTop: spacing.md },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  secondaryButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 11, marginTop: spacing.md },
  secondaryButtonText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  error: { color: colors.danger, fontSize: 11, fontWeight: '700', marginVertical: 8 },
  stateCard: { gap: 8 },
  action: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  back: { paddingVertical: spacing.xl, alignItems: 'center' },
});
