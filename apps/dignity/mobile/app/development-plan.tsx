import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

interface Outcome { key: string; title: string; proficiencyLevel: number; }
interface Competency { key: string; title: string; outcomes: Outcome[]; }
interface Plan {
  id: string; outcomeKey: string; outcomeTitle: string; competencyTitle: string;
  targetLevel: number; currentAssessedLevel: number | null; gap: number;
  actions: string[]; reflection: string; status: string; targetDate: string | null;
}
function payload<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
}

export default function DevelopmentPlanScreen() {
  const api = useNexoraApi();
  const [catalog, setCatalog] = useState<Competency[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [outcomeKey, setOutcomeKey] = useState('');
  const [targetLevel, setTargetLevel] = useState(3);
  const [actions, setActions] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const outcomes = catalog.flatMap((item) => item.outcomes.map((outcome) => ({ ...outcome, competencyTitle: item.title })));

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [catalogResponse, planResponse] = await Promise.all([
        api.request<Competency[]>('/api/v1/learning/competencies/'),
        api.request<Plan[]>('/api/v1/learning/development-plans/'),
      ]);
      const nextCatalog = payload<Competency[]>(catalogResponse);
      const nextPlans = payload<Plan[]>(planResponse);
      setCatalog(Array.isArray(nextCatalog) ? nextCatalog : []);
      setPlans(Array.isArray(nextPlans) ? nextPlans : []);
      setOutcomeKey((current) => current || nextCatalog?.flatMap((item) => item.outcomes)[0]?.key || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load development plans.');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const createPlan = useCallback(async () => {
    const steps = actions.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!outcomeKey || steps.length === 0) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      await api.request('/api/v1/learning/development-plans/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeKey, targetLevel, actions: steps, targetDate: targetDate.trim() || null }),
      });
      setActions(''); setTargetDate('');
      setNotice('Development plan saved. Progress will not change mastery until a new assessment is recorded.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save development plan.');
    } finally { setSaving(false); }
  }, [actions, api, load, outcomeKey, targetDate, targetLevel]);

  const updateStatus = useCallback(async (plan: Plan, status: string) => {
    setError(null);
    try {
      await api.request('/api/v1/learning/development-plans/', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, status }),
      });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update plan.'); }
  }, [api, load]);

  return <Screen>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={18} color={colors.primary} /><Text style={styles.backText}>Skills</Text></Pressable>
      <Text style={styles.eyebrow}>DIGNITY · GROWTH DESIGN</Text>
      <Text style={styles.title}>Development plans</Text>
      <Text style={styles.subtitle}>Turn an assessed competency gap into deliberate learning, practice and real-world application.</Text>
      <SurfaceCard style={styles.noticeCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <View style={styles.flex}><Text style={styles.cardTitle}>Assessment-led, not activity-led</Text><Text style={styles.detail}>Your target is a personal development goal. Completing these actions does not automatically change your assessed level.</Text></View>
      </SurfaceCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.sectionTitle}>Create a development plan</Text>
      <SurfaceCard style={styles.form}>
        <Text style={styles.label}>Competency outcome</Text>
        {outcomes.map((item) => <Pressable key={item.key} onPress={() => setOutcomeKey(item.key)} style={[styles.option, outcomeKey === item.key && styles.selected]}>
          <Ionicons name={outcomeKey === item.key ? 'radio-button-on' : 'radio-button-off'} size={17} color={colors.primary} />
          <Text style={styles.optionText}>{item.title}</Text>
        </Pressable>)}
        {outcomes.length === 0 ? <Text style={styles.detail}>No published outcomes are available yet.</Text> : null}
        <Text style={styles.label}>Target proficiency level</Text>
        <View style={styles.levelRow}>{[1, 2, 3, 4, 5].map((level) => <Pressable key={level} onPress={() => setTargetLevel(level)} style={[styles.levelChip, targetLevel === level && styles.levelSelected]}><Text style={[styles.levelText, targetLevel === level && styles.levelTextSelected]}>{level}</Text></Pressable>)}</View>
        <Text style={styles.label}>Action steps (one per line)</Text>
        <TextInput value={actions} onChangeText={setActions} multiline textAlignVertical="top" placeholder={'Study a focused lesson\nPractice with a small project\nAsk for feedback from a mentor'} placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} />
        <Text style={styles.label}>Target date (optional · YYYY-MM-DD)</Text>
        <TextInput value={targetDate} onChangeText={setTargetDate} placeholder="2027-01-31" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable disabled={!outcomeKey || !actions.trim() || saving} onPress={() => void createPlan()} style={[styles.submit, (!outcomeKey || !actions.trim() || saving) && styles.disabled]}><Text style={styles.submitText}>{saving ? 'Saving…' : 'Save development plan'}</Text></Pressable>
      </SurfaceCard>
      <Text style={styles.sectionTitle}>Your active plans</Text>
      {loading ? <Text style={styles.detail}>Loading plans…</Text> : plans.length === 0 ? <SurfaceCard><Text style={styles.detail}>No plans yet. Create one after reviewing your competency profile.</Text></SurfaceCard> : plans.map((plan) => <SurfaceCard key={plan.id} style={styles.planCard}>
        <Text style={styles.eyebrow}>{plan.competencyTitle}</Text>
        <Text style={styles.cardTitle}>{plan.outcomeTitle}</Text>
        <Text style={styles.detail}>Assessed level: {plan.currentAssessedLevel ?? 'Not assessed'} · Target: {plan.targetLevel}/5 · Gap: {plan.gap}</Text>
        {plan.targetDate ? <Text style={styles.detail}>Target date: {plan.targetDate}</Text> : null}
        {plan.actions.map((action, index) => <View key={index} style={styles.action}><Ionicons name="arrow-forward-circle-outline" size={16} color={colors.primary} /><Text style={styles.detail}>{action}</Text></View>)}
        <View style={styles.statusRow}><Text style={styles.status}>{plan.status.replaceAll('_', ' ')}</Text>
          {plan.status === 'active' ? <Pressable onPress={() => void updateStatus(plan, 'completed')}><Text style={styles.actionLink}>Mark completed</Text></Pressable> : plan.status === 'completed' ? <Pressable onPress={() => void updateStatus(plan, 'active')}><Text style={styles.actionLink}>Reopen plan</Text></Pressable> : null}
        </View>
      </SurfaceCard>)}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  backText: { color: colors.primary, fontWeight: '600' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.surface },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: spacing.md },
  form: { gap: spacing.sm },
  label: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { color: colors.ink, fontSize: 13, flex: 1 },
  levelRow: { flexDirection: 'row', gap: spacing.sm },
  levelChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, padding: spacing.md, minWidth: 40, alignItems: 'center' },
  levelSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelText: { color: colors.ink, fontWeight: '700' },
  levelTextSelected: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.medium, color: colors.ink, padding: spacing.md, fontSize: 14 },
  multiline: { minHeight: 104 },
  submit: { backgroundColor: colors.primary, borderRadius: radius.medium, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  disabled: { opacity: 0.45 },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
  planCard: { gap: spacing.sm },
  action: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  status: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  actionLink: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  error: { color: colors.danger, fontSize: 13 },
  notice: { color: colors.success, fontSize: 13 },
});
