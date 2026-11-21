import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

interface ReviewItem {
  evidenceId: string;
  learnerId: string;
  learnerDisplayName: string;
  outcomeKey: string;
  outcomeTitle: string;
  type: string;
  title: string;
  description: string;
  artifactUrl: string | null;
  submittedAt: string;
  sharedAt: string;
}
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export default function EvidenceReviewScreen() {
  const api = useNexoraApi();
  const { organization } = useOrganization();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [assessmentItem, setAssessmentItem] = useState<ReviewItem | null>(null);
  const [level, setLevel] = useState('3');
  const [method, setMethod] = useState('reviewed_portfolio');
  const [rationale, setRationale] = useState('');

  const load = useCallback(async () => {
    if (!organization) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<ReviewItem[]>(
        `/api/v1/learning/organizations/${organization.id}/evidence/review/`,
      );
      const result = payload<ReviewItem[]>(response);
      setItems(Array.isArray(result) ? result : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the review queue.');
    } finally {
      setLoading(false);
    }
  }, [api, organization]);

  useEffect(() => { void load(); }, [load]);

  const review = useCallback(async (item: ReviewItem, decision: 'verified' | 'rejected') => {
    if (!organization) return;
    setBusyId(item.evidenceId);
    setError(null);
    setNotice(null);
    try {
      await api.request(
        `/api/v1/learning/organizations/${organization.id}/evidence/${item.evidenceId}/review/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            reviewNote: decision === 'verified'
              ? 'Evidence reviewed by an authorized organization reviewer.'
              : 'Please revise the evidence and provide clearer supporting details.',
          }),
        },
      );
      setNotice(decision === 'verified'
        ? 'Evidence verified. You may now record an explicit mastery assessment.'
        : 'Evidence marked for revision.');
      setItems((current) => current.filter((entry) => entry.evidenceId !== item.evidenceId));
      if (decision === 'verified') {
        setAssessmentItem(item);
        setRationale('');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to review this evidence.');
    } finally {
      setBusyId(null);
    }
  }, [api, organization]);

  const assess = useCallback(async () => {
    if (!organization || !assessmentItem || !rationale.trim() || !method.trim()) return;
    const parsedLevel = Number(level);
    if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 5) {
      setError('Mastery level must be between 1 and 5.');
      return;
    }
    setBusyId(assessmentItem.evidenceId);
    setError(null);
    try {
      await api.request(
        `/api/v1/learning/organizations/${organization.id}/mastery/assess/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learnerId: assessmentItem.learnerId,
            outcomeKey: assessmentItem.outcomeKey,
            level: parsedLevel,
            status: 'provisional',
            assessmentMethod: method.trim(),
            rationale: rationale.trim(),
          }),
        },
      );
      setNotice('Provisional mastery assessment saved with reviewer provenance.');
      setAssessmentItem(null);
      setRationale('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the mastery assessment.');
    } finally {
      setBusyId(null);
    }
  }, [api, assessmentItem, level, method, organization, rationale]);

  return <Screen>
    <Pressable onPress={() => router.back()} style={styles.back}>
      <Ionicons name="chevron-back" size={18} color={colors.primary} />
      <Text style={styles.backText}>Profile</Text>
    </Pressable>
    <Text style={styles.eyebrow}>ORGANIZATION REVIEW</Text>
    <Text style={styles.title}>Evidence review queue</Text>
    <Text style={styles.subtitle}>
      Review only the evidence learners have explicitly shared with this organization. Your role and permissions are checked by the server.
    </Text>
    <SurfaceCard style={styles.context}>
      <Ionicons name="business-outline" size={18} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.contextTitle}>{organization?.name ?? 'No organization selected'}</Text>
        <Text style={styles.detail}>Review access is restricted to authorized organization members.</Text>
      </View>
    </SurfaceCard>

    {loading ? <SurfaceCard><Text style={styles.detail}>Loading review queue…</Text></SurfaceCard> : null}
    {!loading && !error && items.length === 0 ? (
      <SurfaceCard style={styles.empty}>
        <Ionicons name="checkmark-done-circle-outline" size={28} color={colors.primary} />
        <Text style={styles.cardTitle}>No evidence awaiting review</Text>
        <Text style={styles.detail}>New submissions will appear after learners share them with this organization.</Text>
      </SurfaceCard>
    ) : null}
    {items.map((item) => (
      <SurfaceCard key={item.evidenceId} style={styles.item}>
        <Text style={styles.learner}>{item.learnerDisplayName || 'Dignity learner'}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.detail}>{item.outcomeTitle} · {item.type}</Text>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
        {item.artifactUrl ? (
          <Text style={styles.link} selectable>{item.artifactUrl}</Text>
        ) : <Text style={styles.detail}>No artifact link supplied.</Text>}
        <Text style={styles.detail}>Shared {new Date(item.sharedAt).toLocaleDateString()}</Text>
        <View style={styles.actions}>
          <Pressable
            disabled={busyId === item.evidenceId}
            onPress={() => void review(item, 'rejected')}
            style={[styles.reject, busyId === item.evidenceId && styles.disabled]}
          >
            <Text style={styles.rejectText}>Request revision</Text>
          </Pressable>
          <Pressable
            disabled={busyId === item.evidenceId}
            onPress={() => void review(item, 'verified')}
            style={[styles.verify, busyId === item.evidenceId && styles.disabled]}
          >
            <Text style={styles.verifyText}>{busyId === item.evidenceId ? 'Saving…' : 'Verify evidence'}</Text>
          </Pressable>
        </View>
      </SurfaceCard>
    ))}

    {assessmentItem ? (
      <SurfaceCard style={styles.assessment}>
        <Text style={styles.assessmentEyebrow}>OPTIONAL NEXT STEP</Text>
        <Text style={styles.cardTitle}>Record a mastery assessment</Text>
        <Text style={styles.detail}>{assessmentItem.learnerDisplayName} · {assessmentItem.outcomeTitle}</Text>
        <Text style={styles.fieldLabel}>Assessed proficiency level (1–5)</Text>
        <View style={styles.levels}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} onPress={() => setLevel(String(value))} style={[styles.levelButton, level === String(value) && styles.levelSelected]}>
              <Text style={[styles.levelText, level === String(value) && styles.levelTextSelected]}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Assessment method</Text>
        <TextInput value={method} onChangeText={setMethod} style={styles.input} placeholder="e.g. reviewed_portfolio" placeholderTextColor={colors.muted} />
        <Text style={styles.fieldLabel}>Rationale (required)</Text>
        <TextInput value={rationale} onChangeText={setRationale} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" placeholder="Explain which criteria were demonstrated and why this level is appropriate…" placeholderTextColor={colors.muted} />
        <Text style={styles.detail}>This records a provisional assessment. It does not automatically certify the learner or change academic grades.</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => setAssessmentItem(null)} style={styles.reject}><Text style={styles.rejectText}>Skip</Text></Pressable>
          <Pressable disabled={!rationale.trim() || !method.trim() || busyId !== null} onPress={() => void assess()} style={[styles.verify, (!rationale.trim() || !method.trim() || busyId !== null) && styles.disabled]}>
            <Text style={styles.verifyText}>{busyId === assessmentItem.evidenceId ? 'Saving…' : 'Save assessment'}</Text>
          </Pressable>
        </View>
      </SurfaceCard>
    ) : null}

    {error ? <Pressable onPress={() => void load()} style={styles.errorBox}><Text style={styles.errorText}>{error} · Retry</Text></Pressable> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  backText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 8, marginBottom: spacing.xl },
  context: { flexDirection: 'row', gap: 10, backgroundColor: colors.primarySoft },
  flex: { flex: 1 },
  contextTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 25, marginTop: spacing.lg },
  item: { marginTop: spacing.md, padding: spacing.md },
  learner: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: 5 },
  description: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 10 },
  link: { color: colors.primaryDark, fontSize: 10, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  reject: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  rejectText: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  verify: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.primaryDark },
  verifyText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  assessment: { marginTop: spacing.lg, padding: spacing.md, borderColor: colors.primary },
  assessmentEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  fieldLabel: { color: colors.ink, fontSize: 10, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  levels: { flexDirection: 'row', gap: 8 },
  levelButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.small },
  levelSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  levelText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  levelTextSelected: { color: colors.primaryDark },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, paddingHorizontal: 11, paddingVertical: 9, color: colors.ink, fontSize: 12, backgroundColor: colors.background },
  multiline: { minHeight: 90 },
  errorBox: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 12 },
  errorText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  notice: { color: colors.success, fontSize: 11, lineHeight: 16, marginTop: 12 },
});
