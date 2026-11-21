import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { DevelopmentCycle } from '@/components/dignity/DevelopmentCycle';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

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
  const [busyGoalId, setBusyGoalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalResponse, journalResponse] = await Promise.all([
        api.request<GrowthGoal[]>('/api/v1/growth/goals/'),
        api.request<JournalEntry[]>('/api/v1/growth/journal/'),
      ]);
      const nextGoals = payload<GrowthGoal[]>(goalResponse);
      const nextEntries = payload<JournalEntry[]>(journalResponse);
      setGoals(Array.isArray(nextGoals) ? nextGoals : []);
      setEntries(Array.isArray(nextEntries) ? nextEntries : []);
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
