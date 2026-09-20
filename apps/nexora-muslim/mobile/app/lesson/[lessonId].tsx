import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockLearning, type QuizQuestion } from '@/lib/learning';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? '00000000-0000-0000-0000-000000000001';
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    if (!lessonId) return;
    mockLearning.getQuiz(lessonId).then(setQuestions);
  }, [lessonId]);

  const question = questions[index];
  const isCorrect = selected === question?.correctOptionIndex;

  const submit = () => {
    if (selected === null || submitted || !question) return;
    setSubmitted(true);
    if (isCorrect) setCorrect((value) => value + 1);
  };

  const next = async () => {
    if (!question) return;
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      setSubmitted(false);
      return;
    }
    const finalCorrect = correct + (isCorrect ? 1 : 0);
    const reward = finalCorrect === questions.length ? 40 : finalCorrect > 0 ? 20 : 10;
    await mockLearning.completeLesson(userId, question.lessonId);
    setXpEarned(reward);
    setFinished(true);
  };

  if (finished) {
    return (
      <Screen>
        <View style={styles.result}>
          <Text style={styles.eyebrow}>LESSON COMPLETE</Text>
          <Text style={styles.heading}>MashaAllah! 🎉</Text>
          <Text style={styles.muted}>You finished this learning exercise.</Text>
          <Card style={styles.resultCard}>
            <Text style={styles.score}>{correct}/{questions.length}</Text>
            <Text style={styles.muted}>Correct answers</Text>
            <Text style={styles.reward}>+{xpEarned} XP</Text>
          </Card>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}><Text style={styles.primaryText}>Back to Learning</Text></Pressable>
        </View>
      </Screen>
    );
  }

  if (!question) {
    return <Screen><View style={styles.result}><Text style={styles.heading}>Lesson unavailable</Text><Text style={styles.muted}>This demo lesson does not have quiz content yet.</Text></View></Screen>;
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
        <View style={styles.progressRow}>
          <Text style={styles.eyebrow}>QUESTION {index + 1} OF {questions.length}</Text>
          <Text style={styles.xp}>Learning</Text>
        </View>
        <Text style={styles.heading}>{question.prompt}</Text>

        <View style={styles.options}>
          {question.options.map((option, optionIndex) => {
            const active = selected === optionIndex;
            const answerState = submitted && optionIndex === question.correctOptionIndex;
            return (
              <Pressable key={option} onPress={() => !submitted && setSelected(optionIndex)}>
                <Card style={[styles.option, active && styles.optionActive, answerState && styles.optionCorrect]}>
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</Text>
                  <Text style={styles.optionText}>{option}</Text>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {submitted && <Card style={styles.feedback}><Text style={styles.feedbackTitle}>{isCorrect ? 'Correct ✓' : 'Not quite'}</Text><Text style={styles.muted}>{question.explanation ?? 'Review the lesson and try again.'}</Text></Card>}

        <Pressable style={[styles.primaryButton, selected === null && !submitted && styles.disabled]} onPress={submitted ? next : submit} disabled={selected === null && !submitted}>
          <Text style={styles.primaryText}>{submitted ? index === questions.length - 1 ? 'Finish Lesson' : 'Next Question' : 'Check Answer'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: spacing.xl },
  back: { color: colors.primary, fontWeight: '800', fontSize: 16, marginBottom: spacing.xl },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', color: colors.primary },
  xp: { fontSize: 12, color: colors.textMuted },
  heading: { fontSize: 26, lineHeight: 34, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  options: { gap: spacing.md, marginTop: spacing.xl },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  optionCorrect: { borderColor: colors.success, backgroundColor: '#F0FDF4' },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, textAlign: 'center', textAlignVertical: 'center', fontWeight: '800', color: colors.primary },
  optionText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  feedback: { marginTop: spacing.lg },
  feedbackTitle: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  primaryButton: { marginTop: 'auto', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  result: { flex: 1, justifyContent: 'center' },
  resultCard: { marginTop: spacing.xl, alignItems: 'center' },
  score: { fontSize: 44, fontWeight: '900', color: colors.text },
  reward: { marginTop: spacing.md, fontSize: 20, fontWeight: '900', color: colors.success },
  muted: { color: colors.textMuted, lineHeight: 21 },
});
