import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { DevelopmentCycle } from '@/components/dignity/DevelopmentCycle';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

interface GrowthSnapshot {
  window: { days: number; startDate: string; endDate: string };
  dataCoverage: 'recorded_activity_available' | 'insufficient_information';
  goals: { total: number; active: number; paused: number; completed: number; createdInWindow: number; completedInWindow: number };
  habits: { active: number; completedCheckIns: number; skippedCheckIns: number; recordedCheckIns: number; adherencePercentOfRecordedCheckIns: number | null };
  journal: { entriesInWindow: number; contentIncluded: false; moodAnalysisIncluded: false };
  recommendations: { code: string; message: string; evidence: string }[];
}
interface GrowthTimelineItem { id: string; date: string; type: string; title: string; description: string | null; evidence: { kind: string; id: string }; relatedGoalId: string | null; }
interface GrowthTimeline { window: { days: number; startDate: string; endDate: string }; items: GrowthTimelineItem[]; total: number; hasMore: boolean; privacy: { journalContentIncluded: false; habitNotesIncluded: false; moodIncluded: false }; }
interface GrowthGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  success_criteria: string[];
  start_date: string;
  target_date: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  completed_at: string | null;
}
interface JournalEntry {
  id: string;
  entry_date: string;
  title: string;
  prompt: string;
  body: string;
  mood: string;
  gratitude: string[];
}
interface GrowthHabit {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly';
  weekly_target: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'paused' | 'archived';
  summary: {
    completedThisWeek: number;
    skippedThisWeek: number;
    weeklyTarget: number;
    dailyStreak: number | null;
  };
}

type GrowthPillar =
  | 'self_awareness' | 'intellectual' | 'skills' | 'habits' | 'social_emotional'
  | 'wellness' | 'creativity' | 'career_finance' | 'leadership' | 'values_purpose';
interface GrowthMilestone {
  id: string;
  title: string;
  description: string;
  pillar: GrowthPillar;
  status: 'planned' | 'in_progress' | 'achieved' | 'paused' | 'cancelled';
  target_date: string | null;
  achieved_at: string | null;
  evidenceCount?: number;
}
interface GrowthDevelopmentReview {
  id: string;
  period: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  evidenceCount: number;
  achievedMilestoneCount: number;
  activeMilestoneCount: number;
  pillarActivity: Record<string, number>;
  reflection: string;
  nextSteps: string[];
  generatedAt: string;
}
const GROWTH_PILLARS: { key: GrowthPillar; label: string }[] = [
  { key: 'self_awareness', label: 'Self-awareness' },
  { key: 'intellectual', label: 'Intellectual' },
  { key: 'skills', label: 'Skills' },
  { key: 'habits', label: 'Habits' },
  { key: 'social_emotional', label: 'Social & emotional' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'career_finance', label: 'Career & finance' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'values_purpose', label: 'Values & purpose' },
];

function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}
function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function GrowScreen() {
  const api = useNexoraApi();
  const [goals, setGoals] = useState<GrowthGoal[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [habits, setHabits] = useState<GrowthHabit[]>([]);
  const [snapshot, setSnapshot] = useState<GrowthSnapshot | null>(null);
  const [timeline, setTimeline] = useState<GrowthTimeline | null>(null);
  const [milestones, setMilestones] = useState<GrowthMilestone[]>([]);
  const [reviews, setReviews] = useState<GrowthDevelopmentReview[]>([]);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestonePillar, setMilestonePillar] = useState<GrowthPillar>('skills');
  const [reviewReflection, setReviewReflection] = useState('');
  const [reviewNextSteps, setReviewNextSteps] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [busyMilestoneId, setBusyMilestoneId] = useState<string | null>(null);
  const [busyEvidenceKey, setBusyEvidenceKey] = useState<string | null>(null);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [reflection, setReflection] = useState('');
  const [reflectionTitle, setReflectionTitle] = useState('');
  const [mood, setMood] = useState('neutral');
  const [gratitude, setGratitude] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingJournal, setSavingJournal] = useState(false);
  const [savingHabit, setSavingHabit] = useState(false);
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);
  const [busyGoalId, setBusyGoalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalResponse, journalResponse, habitResponse, snapshotResponse, timelineResponse, milestoneResponse, reviewResponse] = await Promise.all([
        api.request<GrowthGoal[]>('/api/v1/growth/goals/'),
        api.request<JournalEntry[]>('/api/v1/growth/journal/'),
        api.request<GrowthHabit[]>('/api/v1/growth/habits/'),
        api.request<GrowthSnapshot>('/api/v1/growth/insights/?window=30'),
        api.request<GrowthTimeline>('/api/v1/growth/timeline/?window=30&limit=50'),
        api.request<GrowthMilestone[]>('/api/v1/growth/milestones/'),
        api.request<GrowthDevelopmentReview[]>('/api/v1/growth/reviews/'),
      ]);
      const nextGoals = payload<GrowthGoal[]>(goalResponse);
      const nextEntries = payload<JournalEntry[]>(journalResponse);
      const nextHabits = payload<GrowthHabit[]>(habitResponse);
      const nextSnapshot = payload<GrowthSnapshot>(snapshotResponse);
      const nextTimeline = payload<GrowthTimeline>(timelineResponse);
      const nextMilestones = payload<GrowthMilestone[]>(milestoneResponse);
      const nextReviews = payload<GrowthDevelopmentReview[]>(reviewResponse);
      setSnapshot(nextSnapshot);
      setTimeline(nextTimeline);
      setMilestones(Array.isArray(nextMilestones) ? nextMilestones : []);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
      setGoals(Array.isArray(nextGoals) ? nextGoals : []);
      setEntries(Array.isArray(nextEntries) ? nextEntries : []);
      setHabits(Array.isArray(nextHabits) ? nextHabits : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load your private growth space.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const createGoal = useCallback(async () => {
    if (!goalTitle.trim()) return;
    setSavingGoal(true);
    setError(null);
    setNotice(null);
    try {
      await api.request('/api/v1/growth/goals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalTitle.trim(),
          description: goalDescription.trim(),
          category: 'personal',
          success_criteria: [],
          start_date: localDate(),
          target_date: goalTargetDate.trim() || null,
        }),
      });
      setGoalTitle('');
      setGoalDescription('');
      setGoalTargetDate('');
      setNotice('Goal saved to your private growth space.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this goal.');
    } finally {
      setSavingGoal(false);
    }
  }, [api, goalDescription, goalTargetDate, goalTitle, load]);

  const createHabit = useCallback(async () => {
    if (!habitTitle.trim()) return;
    setSavingHabit(true);
    setError(null);
    setNotice(null);
    try {
      await api.request('/api/v1/growth/habits/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: habitTitle.trim(),
          frequency: habitFrequency,
          weekly_target: habitFrequency === 'daily' ? 7 : weeklyTarget,
          start_date: localDate(),
        }),
      });
      setHabitTitle('');
      setNotice('Habit added to your private routine tracker.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this habit.');
    } finally {
      setSavingHabit(false);
    }
  }, [api, habitFrequency, habitTitle, load, weeklyTarget]);

  const checkInHabit = useCallback(async (habit: GrowthHabit, status: 'completed' | 'skipped') => {
    setBusyHabitId(habit.id);
    setError(null);
    setNotice(null);
    try {
      await api.request(`/api/v1/growth/habits/${habit.id}/check-ins/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_date: localDate(), status }),
      });
      setNotice(status === 'completed' ? 'Habit check-in saved.' : 'Today marked as skipped.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this check-in.');
    } finally {
      setBusyHabitId(null);
    }
  }, [api, load]);

  const createJournalEntry = useCallback(async () => {
    if (!reflection.trim()) return;
    setSavingJournal(true);
    setError(null);
    setNotice(null);
    try {
      await api.request('/api/v1/growth/journal/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: localDate(),
          title: reflectionTitle.trim(),
          prompt: 'What did you learn about yourself today?',
          body: reflection.trim(),
          mood,
          gratitude: gratitude.trim() ? [gratitude.trim()] : [],
        }),
      });
      setReflection('');
      setReflectionTitle('');
      setGratitude('');
      setMood('neutral');
      setNotice('Reflection saved privately to your journal.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your reflection.');
    } finally {
      setSavingJournal(false);
    }
  }, [api, gratitude, load, mood, reflection, reflectionTitle]);

  const completeGoal = useCallback(async (goal: GrowthGoal) => {
    setBusyGoalId(goal.id);
    setError(null);
    setNotice(null);
    try {
      await api.request(`/api/v1/growth/goals/${goal.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: goal.status === 'completed' ? 'active' : 'completed' }),
      });
      setNotice(goal.status === 'completed' ? 'Goal reactivated.' : 'Goal marked as completed.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this goal.');
    } finally {
      setBusyGoalId(null);
    }
  }, [api, load]);

  return <Screen>
    <Text style={styles.eyebrow}>DIGNITY GROW</Text>
    <Text style={styles.title}>Develop with intention.</Text>
    <Text style={styles.subtitle}>A private space for goals, habits, reflection, self-management and meaningful growth.</Text>

    <View style={styles.section}>
      <SectionHeading title="Development engine" subtitle="Return to any stage whenever you need." />
      <SurfaceCard><DevelopmentCycle active="Design" /></SurfaceCard>
    </View>

    <View style={styles.section}>
      <SectionHeading title="Your progress snapshot" subtitle="A factual summary of activity you chose to record over the last 30 days." />
      {snapshot ? <SurfaceCard style={styles.snapshotCard}>
        <View style={styles.snapshotHeader}>
          <Text style={styles.snapshotLabel}>PERSONAL PROGRESS · 30 DAYS</Text>
          <Ionicons name="analytics-outline" size={18} color={colors.primary} />
        </View>
        {snapshot.dataCoverage === 'insufficient_information' ? <Text style={styles.helper}>There is not enough recorded activity to summarize yet. This does not mean you have not grown.</Text> : <>
          <View style={styles.snapshotMetrics}>
            <View style={styles.snapshotMetric}><Text style={styles.snapshotValue}>{snapshot.goals.active}</Text><Text style={styles.snapshotCaption}>Active goals</Text></View>
            <View style={styles.snapshotMetric}><Text style={styles.snapshotValue}>{snapshot.goals.completedInWindow}</Text><Text style={styles.snapshotCaption}>Goals completed</Text></View>
            <View style={styles.snapshotMetric}><Text style={styles.snapshotValue}>{snapshot.habits.recordedCheckIns}</Text><Text style={styles.snapshotCaption}>Habit records</Text></View>
            <View style={styles.snapshotMetric}><Text style={styles.snapshotValue}>{snapshot.journal.entriesInWindow}</Text><Text style={styles.snapshotCaption}>Reflections</Text></View>
          </View>
          <Text style={styles.snapshotFootnote}>{snapshot.habits.adherencePercentOfRecordedCheckIns === null ? 'Habit consistency is not available until a check-in is recorded.' : String(snapshot.habits.adherencePercentOfRecordedCheckIns) + '% completed among recorded habit check-ins only.'}</Text>
        </>}
        {snapshot.recommendations.map((item) => <View key={item.code} style={styles.recommendation}>
          <Text style={styles.recommendationText}>{item.message}</Text>
          <Text style={styles.recommendationEvidence}>Based on: {item.evidence}</Text>
        </View>)}
        <Text style={styles.snapshotPrivacy}>Private to your account. Journal content and mood are not analyzed or included.</Text>
      </SurfaceCard> : <SurfaceCard><Text style={styles.helper}>Loading your progress snapshot…</Text></SurfaceCard>}
    </View>

    <View style={styles.section}>
      <SectionHeading title="Personal goals" subtitle="Define a direction and mark progress when you are ready." />
      <SurfaceCard style={styles.form}>
        <Text style={styles.fieldLabel}>What would you like to work toward?</Text>
        <TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="e.g. Build a consistent learning routine" placeholderTextColor={colors.muted} style={styles.input} maxLength={180} />
        <Text style={styles.fieldLabel}>Why does this matter? (optional)</Text>
        <TextInput value={goalDescription} onChangeText={setGoalDescription} placeholder="Add context or a reason that matters to you…" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.fieldLabel}>Target date (YYYY-MM-DD, optional)</Text>
        <TextInput value={goalTargetDate} onChangeText={setGoalTargetDate} placeholder="2026-12-31" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable disabled={!goalTitle.trim() || savingGoal} onPress={() => void createGoal()} style={[styles.primaryButton, (!goalTitle.trim() || savingGoal) && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{savingGoal ? 'Saving…' : 'Save personal goal'}</Text>
        </Pressable>
        <Text style={styles.privacy}>Goals are private to your account. They are not visible to an institution or employer.</Text>
      </SurfaceCard>
      {loading ? <SurfaceCard><Text style={styles.helper}>Loading goals…</Text></SurfaceCard> : null}
      {!loading && goals.length === 0 ? <SurfaceCard><Text style={styles.helper}>No goals yet. Start with one small, meaningful direction.</Text></SurfaceCard> : null}
      {goals.map((goal) => <SurfaceCard key={goal.id} style={styles.goalCard}>
        <View style={styles.goalTop}>
          <Text style={styles.goalStatus}>{goal.status.toUpperCase()}</Text>
          {goal.target_date ? <Text style={styles.dateText}>Target {goal.target_date}</Text> : null}
        </View>
        <Text style={styles.cardTitle}>{goal.title}</Text>
        {goal.description ? <Text style={styles.helper}>{goal.description}</Text> : null}
        <Pressable disabled={busyGoalId === goal.id || goal.status === 'archived'} onPress={() => void completeGoal(goal)} style={styles.goalAction}>
          <Ionicons name={goal.status === 'completed' ? 'refresh-outline' : 'checkmark-circle-outline'} size={16} color={colors.primaryDark} />
          <Text style={styles.goalActionText}>{busyGoalId === goal.id ? 'Updating…' : goal.status === 'completed' ? 'Reopen goal' : 'Mark complete'}</Text>
        </Pressable>
      </SurfaceCard>)}
    </View>

    <View style={styles.section}>
      <SectionHeading title="Habit practice" subtitle="Build repeatable actions, then record what actually happened." />
      <SurfaceCard style={styles.form}>
        <Text style={styles.fieldLabel}>A small action you want to repeat</Text>
        <TextInput value={habitTitle} onChangeText={setHabitTitle} placeholder="e.g. Walk for fifteen minutes" placeholderTextColor={colors.muted} style={styles.input} maxLength={180} />
        <Text style={styles.fieldLabel}>Routine</Text>
        <View style={styles.moodRow}>
          {(['daily', 'weekly'] as const).map((value) => <Pressable key={value} onPress={() => setHabitFrequency(value)} style={[styles.moodChip, habitFrequency === value && styles.moodActive]}><Text style={[styles.moodText, habitFrequency === value && styles.moodTextActive]}>{value === 'daily' ? 'Every day' : 'Weekly target'}</Text></Pressable>)}
        </View>
        {habitFrequency === 'weekly' ? <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((value) => <Pressable key={value} onPress={() => setWeeklyTarget(value)} style={[styles.targetChip, weeklyTarget === value && styles.moodActive]}><Text style={[styles.moodText, weeklyTarget === value && styles.moodTextActive]}>{value}×</Text></Pressable>)}
        </View> : <Text style={styles.helper}>A daily habit has a seven-day target. You can still record skipped days honestly.</Text>}
        <Pressable disabled={!habitTitle.trim() || savingHabit} onPress={() => void createHabit()} style={[styles.primaryButton, (!habitTitle.trim() || savingHabit) && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{savingHabit ? 'Saving…' : 'Add habit'}</Text>
        </Pressable>
        <Text style={styles.privacy}>Check-ins belong to your account and are not automatically shared with organizations.</Text>
      </SurfaceCard>
      {habits.length === 0 ? <SurfaceCard><Text style={styles.helper}>No routines yet. Start with an action small enough to repeat.</Text></SurfaceCard> : habits.map((habit) => <SurfaceCard key={habit.id} style={styles.goalCard}>
        <View style={styles.goalTop}>
          <Text style={styles.goalStatus}>{habit.status.toUpperCase()} · {habit.frequency.toUpperCase()}</Text>
          <Text style={styles.dateText}>{habit.summary.completedThisWeek}/{habit.summary.weeklyTarget} this week</Text>
        </View>
        <Text style={styles.cardTitle}>{habit.title}</Text>
        {habit.summary.dailyStreak !== null ? <Text style={styles.helper}>{habit.summary.dailyStreak} day current streak</Text> : <Text style={styles.helper}>Weekly target: {habit.summary.weeklyTarget} check-ins</Text>}
        <View style={styles.habitActions}>
          <Pressable disabled={busyHabitId === habit.id || habit.status !== 'active'} onPress={() => void checkInHabit(habit, 'completed')} style={[styles.habitButton, styles.habitDone, (busyHabitId === habit.id || habit.status !== 'active') && styles.disabled]}>
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.primaryDark} />
            <Text style={styles.goalActionText}>Done today</Text>
          </Pressable>
          <Pressable disabled={busyHabitId === habit.id || habit.status !== 'active'} onPress={() => void checkInHabit(habit, 'skipped')} style={[styles.habitButton, (busyHabitId === habit.id || habit.status !== 'active') && styles.disabled]}>
            <Text style={styles.moodText}>Skip today</Text>
          </Pressable>
        </View>
      </SurfaceCard>)}
    </View>

    <View style={styles.section}>
      <SectionHeading title="Private reflection journal" subtitle="Write honestly. Your reflections are not shared with an institution." />
      <SurfaceCard style={styles.form}>
        <Text style={styles.fieldLabel}>Entry title (optional)</Text>
        <TextInput value={reflectionTitle} onChangeText={setReflectionTitle} placeholder="A moment worth remembering" placeholderTextColor={colors.muted} style={styles.input} maxLength={180} />
        <Text style={styles.question}>What did you learn about yourself today?</Text>
        <TextInput accessibilityLabel="Personal reflection" multiline value={reflection} onChangeText={setReflection} placeholder="Write a few thoughts…" placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} textAlignVertical="top" />
        <Text style={styles.fieldLabel}>How are you feeling? (optional)</Text>
        <View style={styles.moodRow}>
          {['very_low', 'low', 'neutral', 'good', 'very_good'].map((value) => <Pressable key={value} onPress={() => setMood(value)} style={[styles.moodChip, mood === value && styles.moodActive]}><Text style={[styles.moodText, mood === value && styles.moodTextActive]}>{value.replace('_', ' ')}</Text></Pressable>)}
        </View>
        <Text style={styles.fieldLabel}>One thing you are grateful for (optional)</Text>
        <TextInput value={gratitude} onChangeText={setGratitude} placeholder="A person, moment or small thing…" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable onPress={() => void createJournalEntry()} disabled={!reflection.trim() || savingJournal} style={[styles.primaryButton, (!reflection.trim() || savingJournal) && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{savingJournal ? 'Saving…' : 'Save private reflection'}</Text>
        </Pressable>
      </SurfaceCard>
      {entries.length === 0 ? <SurfaceCard><Text style={styles.helper}>Your saved reflections will appear here.</Text></SurfaceCard> : entries.slice(0, 5).map((entry) => <SurfaceCard key={entry.id} style={styles.entryCard}>
        <Text style={styles.dateText}>{entry.entry_date}{entry.mood ? ` · ${entry.mood.replace('_', ' ')}` : ''}</Text>
        <Text style={styles.cardTitle}>{entry.title || 'Reflection'}</Text>
        <Text style={styles.entryBody} numberOfLines={4}>{entry.body}</Text>
      </SurfaceCard>)}
    </View>
    {error ? <Pressable onPress={() => void load()} style={styles.errorBox}><Text style={styles.errorText}>{error} · Retry</Text></Pressable> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  section: { marginBottom: spacing.section },
  form: { gap: 9 },
  snapshotCard: { gap: 12 },
  timelineCard: { gap: 12 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineCount: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  timelineItem: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line },
  timelineMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  timelineContent: { flex: 1, gap: 3 },
  timelineTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  timelineDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  timelineDate: { color: colors.muted, fontSize: 9 },
  snapshotHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  snapshotLabel: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  snapshotMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  snapshotMetric: { width: '47%', backgroundColor: colors.surfaceMuted, borderRadius: radius.medium, padding: 11 },
  snapshotValue: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  snapshotCaption: { color: colors.muted, fontSize: 9, marginTop: 3 },
  snapshotFootnote: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  recommendation: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9, gap: 4 },
  recommendationText: { color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  recommendationEvidence: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  snapshotPrivacy: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: '900', marginTop: 6 },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, paddingHorizontal: 11, paddingVertical: 9, color: colors.ink, fontSize: 12, backgroundColor: colors.background },
  multiline: { minHeight: 108 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingVertical: 12, marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  privacy: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  goalCard: { marginTop: spacing.sm },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  goalStatus: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  dateText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: 5 },
  helper: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 7 },
  goalAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingVertical: 8, marginTop: 7 },
  goalActionText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  habitButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 8 },
  habitDone: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  targetChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 8 },
  question: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 8 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  moodChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 7 },
  moodActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  moodText: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },
  moodTextActive: { color: colors.primaryDark },
  entryCard: { marginTop: spacing.sm },
  entryBody: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 8 },
  errorBox: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 10 },
  errorText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  notice: { color: colors.success, fontSize: 11, lineHeight: 16, marginTop: 10 },
});
