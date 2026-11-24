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
interface Recommendation { lessonKey: string; title: string; description: string; courseTitle: string; kind: string; contributionType: string; estimatedMinutes: number; completed: boolean; route: string; }
interface RecommendationResponse { outcomeKey: string; outcomeTitle: string; resources: Recommendation[]; }
interface GapItem {
  outcomeKey: string; outcomeTitle: string; competencyTitle: string;
  currentAssessedLevel: number | null; assessmentStatus: string; targetLevel: number | null;
  gap: number | null; gapStatus: 'needs_assessment' | 'plan_needed' | 'development_needed' | 'target_reached';
  planId: string | null; planStatus: string | null;
}
interface GapResponse { count: number; results: GapItem[]; }
interface Plan {
  id: string; outcomeKey: string; outcomeTitle: string; competencyTitle: string;
  targetLevel: number; currentAssessedLevel: number | null; gap: number; gapStatus?: "needs_assessment" | "development_needed" | "target_reached"; assessmentStatus?: string; lastAssessedAt?: string | null;
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
  const [gapRows, setGapRows] = useState<GapItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [outcomeKey, setOutcomeKey] = useState('');
  const [targetLevel, setTargetLevel] = useState(3);
  const [actions, setActions] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, string>>({});
  const outcomes = catalog.flatMap((item) => item.outcomes.map((outcome) => ({ ...outcome, competencyTitle: item.title })));

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [catalogResponse, planResponse, gapResponse] = await Promise.all([
        api.request<Competency[]>('/api/v1/learning/competencies/'),
        api.request<Plan[]>('/api/v1/learning/development-plans/'),
        api.request<GapResponse>('/api/v1/learning/development-gap-analysis/'),
      ]);
      const nextCatalog = payload<Competency[]>(catalogResponse);
      const nextPlans = payload<Plan[]>(planResponse);
      const nextGaps = payload<GapResponse>(gapResponse);
      setCatalog(Array.isArray(nextCatalog) ? nextCatalog : []);
      setPlans(Array.isArray(nextPlans) ? nextPlans : []);
      setGapRows(Array.isArray(nextGaps?.results) ? nextGaps.results : []);
      setOutcomeKey((current) => current || nextCatalog?.flatMap((item) => item.outcomes)[0]?.key || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load development plans.');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const loadRecommendations = useCallback(async () => {
    if (!outcomeKey) { setRecommendations([]); return; }
    setLoadingRecommendations(true);
    try {
      const response = await api.request<RecommendationResponse>(
        '/api/v1/learning/development-recommendations/?outcomeKey=' + encodeURIComponent(outcomeKey),
      );
      const result = payload<RecommendationResponse>(response);
      setRecommendations(Array.isArray(result.resources) ? result.resources : []);
    } catch {
      setRecommendations([]);
    } finally { setLoadingRecommendations(false); }
  }, [api, outcomeKey]);

  useEffect(() => { void loadRecommendations(); }, [loadRecommendations]);

  const addRecommendation = useCallback((resource: Recommendation) => {
    const action = 'Selesaikan ' + resource.title + ' (' + resource.courseTitle + ')';
    setActions((current) => current.split('\n').map((item) => item.trim()).includes(action)
      ? current : [current.trim(), action].filter(Boolean).join('\n'));
    setNotice('Rekomendasi ditambahkan ke langkah rencana. Buka materi untuk mulai belajar.');
  }, []);

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

  const saveReflection = useCallback(async (plan: Plan) => {
    setError(null);
    try {
      await api.request('/api/v1/learning/development-plans/', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, reflection: reflectionDrafts[plan.id] ?? plan.reflection ?? '' }),
      });
      setNotice('Reflection saved to your private development plan.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save reflection.'); }
  }, [api, load, reflectionDrafts]);

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
        <Text style={styles.label}>Curated learning resources</Text>
        {loadingRecommendations ? <Text style={styles.detail}>Loading mapped resources…</Text> : recommendations.length === 0 ? <Text style={styles.detail}>No published learning resources are mapped to this outcome yet. You can still define your own practice steps.</Text> : recommendations.map((resource) => <View key={resource.lessonKey} style={styles.recommendation}>
          <View style={styles.recommendationHeader}>
            <View style={styles.flex}>
              <Text style={styles.recommendationTitle}>{resource.title}</Text>
              <Text style={styles.detail}>{resource.courseTitle} · {resource.estimatedMinutes} min · {resource.contributionType}</Text>
            </View>
            <Text style={styles.completion}>{resource.completed ? 'Completed' : 'Not started'}</Text>
          </View>
          {resource.description ? <Text style={styles.detail}>{resource.description}</Text> : null}
          <View style={styles.resourceActions}>
            <Pressable onPress={() => router.push(resource.route as never)} style={styles.resourceButton}><Text style={styles.resourceButtonText}>{resource.kind === 'quiz' ? 'Open quiz' : 'Open lesson'}</Text></Pressable>
            <Pressable onPress={() => addRecommendation(resource)} style={styles.addButton}><Text style={styles.addButtonText}>Add to plan</Text></Pressable>
          </View>
        </View>)}
        <Text style={styles.label}>Target proficiency level</Text>
        <View style={styles.levelRow}>{[1, 2, 3, 4, 5].map((level) => <Pressable key={level} onPress={() => setTargetLevel(level)} style={[styles.levelChip, targetLevel === level && styles.levelSelected]}><Text style={[styles.levelText, targetLevel === level && styles.levelTextSelected]}>{level}</Text></Pressable>)}</View>
        <Text style={styles.label}>Action steps (one per line)</Text>
        <TextInput value={actions} onChangeText={setActions} multiline textAlignVertical="top" placeholder={'Study a focused lesson\nPractice with a small project\nAsk for feedback from a mentor'} placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} />
        <Text style={styles.label}>Target date (optional · YYYY-MM-DD)</Text>
        <TextInput value={targetDate} onChangeText={setTargetDate} placeholder="2027-01-31" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable disabled={!outcomeKey || !actions.trim() || saving} onPress={() => void createPlan()} style={[styles.submit, (!outcomeKey || !actions.trim() || saving) && styles.disabled]}><Text style={styles.submitText}>{saving ? 'Saving…' : 'Save development plan'}</Text></Pressable>
      </SurfaceCard>
      <Text style={styles.sectionTitle}>Competency gap analysis</Text>
      <Text style={styles.detail}>Status ini hanya menggunakan hasil assessment eksplisit. Aktivitas belajar tidak otomatis mengubah level kompetensi.</Text>
      {loading ? <Text style={styles.detail}>Analyzing published outcomes…</Text> : gapRows.length === 0 ? <SurfaceCard><Text style={styles.detail}>No published competency outcomes are available yet.</Text></SurfaceCard> : gapRows.map((item) => <Pressable key={item.outcomeKey} onPress={() => setOutcomeKey(item.outcomeKey)} style={styles.gapCard}>
        <Text style={styles.eyebrow}>{item.competencyTitle}</Text>
        <Text style={styles.cardTitle}>{item.outcomeTitle}</Text>
        <Text style={styles.detail}>Assessed level: {item.currentAssessedLevel ?? 'Not assessed'} · Target: {item.targetLevel ?? 'Not set'}{item.targetLevel ? '/5' : ''}</Text>
        <Text style={styles.gapState}>{item.gapStatus === 'needs_assessment' ? 'Needs an authorized assessment' : item.gapStatus === 'plan_needed' ? 'Assessed · development plan needed' : item.gapStatus === 'target_reached' ? 'Target reached' : 'Development needed · gap ' + item.gap}</Text>
        {item.planStatus ? <Text style={styles.detail}>Plan status: {item.planStatus}</Text> : null}
        <Text style={styles.actionLink}>Select outcome for a plan</Text>
      </Pressable>)}
      <Text style={styles.sectionTitle}>Your active plans</Text>
      {loading ? <Text style={styles.detail}>Loading plans…</Text> : plans.length === 0 ? <SurfaceCard><Text style={styles.detail}>No plans yet. Create one after reviewing your competency profile.</Text></SurfaceCard> : plans.map((plan) => <SurfaceCard key={plan.id} style={styles.planCard}>
        <Text style={styles.eyebrow}>{plan.competencyTitle}</Text>
        <Text style={styles.cardTitle}>{plan.outcomeTitle}</Text>
        <Text style={styles.detail}>Assessed level: {plan.currentAssessedLevel ?? 'Not assessed'} · Target: {plan.targetLevel}/5 · Gap: {plan.gap}</Text>
        <Text style={styles.gapState}>{plan.gapStatus === 'target_reached' ? 'Target reached · consider a new stretch goal' : plan.gapStatus === 'development_needed' ? 'Development needed · keep practicing and gather evidence' : 'Assessment needed · request an authorized assessor review'}</Text>
        <Text style={styles.detail}>Assessment status: {plan.assessmentStatus ?? 'unassessed'}{plan.lastAssessedAt ? ' · ' + new Date(plan.lastAssessedAt).toLocaleDateString() : ''}</Text>
        {plan.targetDate ? <Text style={styles.detail}>Target date: {plan.targetDate}</Text> : null}
        {plan.actions.map((action, index) => <View key={index} style={styles.action}><Ionicons name="arrow-forward-circle-outline" size={16} color={colors.primary} /><Text style={styles.detail}>{action}</Text></View>)}
        <Text style={styles.label}>Private reflection</Text>
        <TextInput value={reflectionDrafts[plan.id] ?? plan.reflection ?? ''} onChangeText={(value) => setReflectionDrafts((current) => ({ ...current, [plan.id]: value }))} multiline textAlignVertical="top" placeholder="What worked, what was difficult, and what will you change next?" placeholderTextColor={colors.muted} style={styles.reflectionInput} />
        <Pressable onPress={() => void saveReflection(plan)} style={styles.reflectionButton}><Text style={styles.reflectionButtonText}>Save reflection</Text></Pressable>
        <View style={styles.statusRow}><Text style={styles.status}>{plan.status.replaceAll('_', ' ')}</Text>
          {plan.status === 'active' ? <View style={styles.statusActions}><Pressable onPress={() => void updateStatus(plan, 'paused')}><Text style={styles.actionLink}>Pause</Text></Pressable><Pressable onPress={() => void updateStatus(plan, 'completed')}><Text style={styles.actionLink}>Mark completed</Text></Pressable></View> : <Pressable onPress={() => void updateStatus(plan, 'active')}><Text style={styles.actionLink}>{plan.status === 'completed' ? 'Reopen plan' : 'Resume plan'}</Text></Pressable>}
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
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { color: colors.ink, fontSize: 13, flex: 1 },
  levelRow: { flexDirection: 'row', gap: spacing.sm },
  levelChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md, minWidth: 40, alignItems: 'center' },
  levelSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelText: { color: colors.ink, fontWeight: '700' },
  levelTextSelected: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, color: colors.ink, padding: spacing.md, fontSize: 14 },
  multiline: { minHeight: 104 },
  submit: { backgroundColor: colors.primary, borderRadius: radius.medium, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  disabled: { opacity: 0.45 },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
  planCard: { gap: spacing.sm },
  gapCard: { gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, backgroundColor: colors.surface },
  recommendation: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.sm, gap: spacing.xs },
  recommendationHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  recommendationTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  completion: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  resourceActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  resourceButton: { backgroundColor: colors.primarySoft, borderRadius: radius.small, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  resourceButtonText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  addButton: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.small, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addButtonText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  action: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  status: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  gapState: { color: colors.primaryDark, fontSize: 11, fontWeight: '700' },
  reflectionInput: { minHeight: 70, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, color: colors.ink, padding: spacing.sm, fontSize: 12 },
  reflectionButton: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.small, backgroundColor: colors.primarySoft },
  reflectionButtonText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  statusActions: { flexDirection: 'row', gap: spacing.md },
  actionLink: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  error: { color: colors.danger, fontSize: 13 },
  notice: { color: colors.success, fontSize: 13 },
});
