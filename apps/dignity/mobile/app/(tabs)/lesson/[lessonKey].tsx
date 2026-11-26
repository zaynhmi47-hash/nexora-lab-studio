import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Eyebrow, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import {
  completeLearningLesson,
  getLearningCourses,
  getLearningLessonContent,
  getLearningQuiz,
  getLearningProgress,
  submitLearningQuiz,
  type LearningContentBlock,
  type LearningLesson,
  type LearningProgress,
  type LearningQuizQuestion,
  type LearningQuizResult,
} from '@/lib/learning/api';

export default function LessonScreen() {
  const { lessonKey } = useLocalSearchParams<{ lessonKey: string }>();
  const api = useNexoraApi();
  const [lesson, setLesson] = useState<LearningLesson | null>(null);
  const [contentBlocks, setContentBlocks] = useState<LearningContentBlock[]>([]);
  const [questions, setQuestions] = useState<LearningQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<LearningQuizResult | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadLesson() {
      setLoading(true);
      setError(null);
      try {
        const courses = await getLearningCourses(api);
        const found = courses.flatMap((course) => course.lessons).find((item) => item.id === lessonKey) ?? null;
        if (!active) return;
        setLesson(found);
        if (!found) throw new Error('This lesson is not available in your learning catalog.');

        const [blocks, quiz] = await Promise.all([
          getLearningLessonContent(api, found.id),
          found.kind === 'quiz' ? getLearningQuiz(api, found.id) : Promise.resolve([]),
        ]);
        if (active) {
          setContentBlocks(blocks);
          setQuestions(quiz);
          setAnswers(quiz.map(() => -1));
        }
        if (active && found.status === 'completed') {
          setProgress(await getLearningProgress(api));
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load this lesson.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadLesson();
    return () => { active = false; };
  }, [api, lessonKey]);

  const finishLesson = useCallback(async () => {
    if (!lesson) return;
    setSubmitting(true);
    setError(null);
    try {
      const nextProgress = await completeLearningLesson(api, lesson.id);
      setProgress(nextProgress);
      setLesson((current) => current ? { ...current, status: 'completed' } : current);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save lesson completion.');
    } finally {
      setSubmitting(false);
    }
  }, [api, lesson]);

  const finishQuiz = useCallback(async () => {
    if (!lesson || answers.some((answer) => answer < 0)) {
      setError('Answer every question before submitting the quiz.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const quizResult = await submitLearningQuiz(api, lesson.id, answers);
      setResult(quizResult);
      if (quizResult.passed) {
        const nextProgress = await completeLearningLesson(api, lesson.id);
        setProgress(nextProgress);
        setLesson((current) => current ? { ...current, status: 'completed' } : current);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit this quiz.');
    } finally {
      setSubmitting(false);
    }
  }, [api, answers, lesson]);

  const openResource = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open file', 'This resource could not be opened on this device.');
    }
  }, []);

  const renderContentBlock = (block: LearningContentBlock, index: number) => {
    const resourceUrl = block.fileUrl || block.externalUrl;
    const icon = block.kind === 'video' ? 'videocam-outline' : block.kind === 'audio' ? 'headset-outline' : block.kind === 'document' ? 'document-text-outline' : block.kind === 'link' ? 'link-outline' : 'image-outline';
    return (
      <View key={block.id} style={styles.contentBlock}>
        <View style={styles.blockHeading}>
          <View style={styles.blockNumber}><Text style={styles.blockNumberText}>{index + 1}</Text></View>
          <Text style={styles.blockTitle}>{block.title || ({ text: 'Reading', image: 'Image', video: 'Video lesson', audio: 'Audio lesson', document: 'Study document', link: 'Further reading' } as const)[block.kind]}</Text>
        </View>
        {block.kind === 'text' && <Text style={styles.body}>{block.body}</Text>}
        {block.kind === 'image' && resourceUrl ? <Pressable onPress={() => void openResource(resourceUrl)}><Image source={{ uri: resourceUrl }} resizeMode="contain" style={styles.contentImage} /></Pressable> : null}
        {block.kind !== 'text' && block.kind !== 'image' && resourceUrl ? (
          <Pressable onPress={() => void openResource(resourceUrl)} style={styles.resourceCard}>
            <View style={styles.resourceIcon}><Ionicons name={icon} size={21} color={palette.primary} /></View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.resourceTitle}>{block.title || 'Open learning resource'}</Text>
              <Text style={styles.resourceSubtitle}>{block.kind === 'video' ? 'Watch video' : block.kind === 'audio' ? 'Listen to audio' : block.kind === 'link' ? 'Open external resource' : 'Open or download document'}</Text>
            </View>
            <Ionicons name="open-outline" size={17} color={palette.primary} />
          </Pressable>
        ) : null}
        {block.body && block.kind !== 'text' ? <Text style={styles.resourceCaption}>{block.body}</Text> : null}
      </View>
    );
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={palette.ink} /><Text style={styles.backText}>Back to learning</Text></Pressable>
      {loading ? (
        <Panel style={styles.state}><ActivityIndicator color={palette.primary} /><Text style={styles.stateText}>Loading lesson…</Text></Panel>
      ) : error && !lesson ? (
        <Panel style={styles.state}><Ionicons name="alert-circle-outline" size={26} color={palette.rose} /><Text style={styles.stateTitle}>Lesson unavailable</Text><Text style={styles.stateText}>{error}</Text></Panel>
      ) : lesson ? (
        <>
          <Eyebrow>{lesson.kind.toUpperCase()} · {lesson.xpReward} XP</Eyebrow>
          <Text style={styles.title}>{lesson.title}</Text>
          <View style={styles.meta}><Tag label={lesson.status === 'completed' ? 'COMPLETED' : lesson.status === 'locked' ? 'LOCKED' : 'READY TO LEARN'} tone={lesson.status === 'completed' ? 'green' : lesson.status === 'locked' ? 'neutral' : 'purple'} /></View>
          <Panel style={styles.cover}>
            <View style={styles.coverOrb}><Ionicons name={lesson.kind === 'quiz' ? 'help-circle-outline' : 'book-outline'} size={38} color="#FFFFFF" /></View>
            <Text style={styles.coverEyebrow}>DIGNITY LEARNING</Text>
            <Text style={styles.coverTitle}>{lesson.kind === 'quiz' ? 'Check your understanding.' : 'Learn with intention.'}</Text>
            <Text style={styles.coverText}>{lesson.description || 'A guided step in your learning journey.'}</Text>
          </Panel>

          {contentBlocks.length > 0 ? (
            <Panel style={{ gap: 13 }}>
              <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Learning materials</Text><Tag label={`${contentBlocks.length} BLOCKS`} tone="cyan" /></View>
              {contentBlocks.map(renderContentBlock)}
            </Panel>
          ) : lesson.kind !== 'quiz' ? (
            <Panel style={{ gap: 7 }}>
              <Text style={styles.sectionTitle}>No materials published yet</Text>
              <Text style={styles.body}>Your instructor has not added content to this lesson. Check back later.</Text>
            </Panel>
          ) : null}

          {lesson.kind === 'quiz' ? (
            <Panel>
              <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Knowledge check</Text><Tag label={`${questions.length} QUESTIONS`} tone="cyan" /></View>
              {questions.length === 0 ? <Text style={styles.body}>There are no published questions for this quiz yet.</Text> : questions.map((question, questionIndex) => (
                <View key={question.id} style={styles.question}>
                  <Text style={styles.questionPrompt}>{questionIndex + 1}. {question.prompt}</Text>
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[questionIndex] === optionIndex;
                    return (
                      <Pressable key={optionIndex} onPress={() => { setAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer)); setResult(null); }} style={[styles.option, selected && styles.optionSelected]}>
                        <View style={[styles.optionMarker, selected && styles.optionMarkerSelected]}>{selected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}</View>
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              {result && (
                <View style={styles.result}>
                  <Text style={styles.resultTitle}>{result.passed ? 'You passed!' : 'Keep practicing'}</Text>
                  <Text style={styles.resultText}>{result.correctAnswers} of {result.totalQuestions} correct · {result.scorePercent}% · {result.xpEarned} XP earned</Text>
                  <ProgressBar value={result.scorePercent} color={result.passed ? palette.green : palette.orange} />
                </View>
              )}
              <Pressable disabled={submitting || questions.length === 0 || lesson.status === 'locked'} onPress={() => void finishQuiz()} style={[styles.primaryButton, (submitting || questions.length === 0 || lesson.status === 'locked') && styles.disabled]}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Submit answers</Text>}
              </Pressable>
            </Panel>
          ) : (
            <Panel style={{ gap: 11 }}>
              <Text style={styles.sectionTitle}>Lesson overview</Text>
              <Text style={styles.body}>{lesson.description || 'Review the lesson material and complete the learning activity when you are ready.'}</Text>
              <View style={styles.learningTip}><Ionicons name="bulb-outline" size={18} color={palette.primary} /><Text style={styles.tipText}>Take a moment to connect this topic with something you already know. Reflection helps make learning meaningful.</Text></View>
              <Pressable disabled={submitting || lesson.status !== 'available'} onPress={() => void finishLesson()} style={[styles.primaryButton, (submitting || lesson.status !== 'available') && styles.disabled]}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{lesson.status === 'completed' ? 'Lesson completed' : lesson.status === 'locked' ? 'Complete the previous lesson first' : 'Mark lesson as complete'}</Text>}
                {!submitting && lesson.status === 'available' && <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />}
              </Pressable>
            </Panel>
          )}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {lesson.status === 'completed' && progress ? <Panel style={styles.progressCard}><Ionicons name="trophy-outline" size={20} color={palette.green} /><View style={{ flex: 1 }}><Text style={styles.progressTitle}>Progress saved</Text><Text style={styles.progressText}>{progress.xp} total XP · Level {progress.level} · {progress.currentStreak} day streak</Text></View></Panel> : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  backText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  title: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cover: { backgroundColor: '#6257E8', borderColor: '#6257E8', alignItems: 'flex-start', padding: 20, minHeight: 190, justifyContent: 'center' },
  coverOrb: { width: 62, height: 62, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  coverEyebrow: { color: '#DCD9FF', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  coverTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 6 },
  coverText: { color: '#E6E4FF', fontSize: 11, lineHeight: 17, marginTop: 5, maxWidth: 270 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  body: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  state: { alignItems: 'center', paddingVertical: 25 },
  stateTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  stateText: { color: palette.muted, fontSize: 11, textAlign: 'center', lineHeight: 17 },
  contentBlock: { gap: 9 },
  blockHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  blockNumber: { width: 25, height: 25, borderRadius: 9, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  blockNumberText: { color: palette.primary, fontSize: 10, fontWeight: '900' },
  blockTitle: { color: palette.ink, fontSize: 12, fontWeight: '800', flex: 1 },
  contentImage: { width: '100%', height: 220, borderRadius: 13, backgroundColor: palette.canvas },
  resourceCard: { borderWidth: 1, borderColor: palette.line, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resourceIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  resourceTitle: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  resourceSubtitle: { color: palette.muted, fontSize: 9 },
  resourceCaption: { color: palette.muted, fontSize: 10, lineHeight: 16 },
  question: { gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.line },
  questionPrompt: { color: palette.ink, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 12 },
  optionSelected: { borderColor: palette.primary, backgroundColor: palette.primarySoft },
  optionMarker: { width: 19, height: 19, borderRadius: 10, borderWidth: 1, borderColor: '#B9C0D0', alignItems: 'center', justifyContent: 'center' },
  optionMarkerSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  optionText: { flex: 1, color: palette.ink, fontSize: 10, lineHeight: 15 },
  optionTextSelected: { color: palette.primary, fontWeight: '800' },
  result: { gap: 7, backgroundColor: palette.greenSoft, borderRadius: 13, padding: 12 },
  resultTitle: { color: palette.green, fontSize: 13, fontWeight: '900' },
  resultText: { color: palette.ink, fontSize: 10 },
  primaryButton: { minHeight: 44, borderRadius: 13, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  learningTip: { flexDirection: 'row', gap: 9, backgroundColor: palette.primarySoft, borderRadius: 12, padding: 12, alignItems: 'flex-start' },
  tipText: { flex: 1, color: palette.ink, fontSize: 10, lineHeight: 16 },
  error: { color: '#C34F6B', fontSize: 10, lineHeight: 15 },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.greenSoft, borderColor: '#D5F0E5' },
  progressTitle: { color: palette.green, fontSize: 11, fontWeight: '800' },
  progressText: { color: '#397D69', fontSize: 9, marginTop: 3 },
});
