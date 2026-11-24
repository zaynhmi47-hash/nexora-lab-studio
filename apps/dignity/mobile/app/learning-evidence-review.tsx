import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

interface ReviewItem {
  evidenceId: string; learnerId: string; learnerDisplayName: string;
  outcomeKey: string; outcomeTitle: string; type: string; title: string;
  description: string; artifactUrl: string | null; submittedAt: string; sharedAt: string;
}
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) return (response as { data: T }).data;
  return response as T;
}

export default function LearningEvidenceReviewScreen() {
  const api = useNexoraApi();
  const { organization } = useOrganization();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organization) { setItems([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const response = await api.request<ReviewItem[]>('/api/v1/learning/organizations/' + organization.id + '/evidence/review/');
      const rows = payload<ReviewItem[]>(response);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load shared evidence.');
    } finally { setLoading(false); }
  }, [api, organization?.id]);

  useEffect(() => { void load(); }, [load]);

  const decide = useCallback(async (item: ReviewItem, decision: 'verified' | 'rejected') => {
    const reviewNote = (notes[item.evidenceId] ?? '').trim();
    if (decision === 'rejected' && !reviewNote) {
      setError('A reason is required when requesting revision or rejecting evidence.');
      return;
    }
    setBusyId(item.evidenceId); setError(null); setNotice(null);
    try {
      await api.request('/api/v1/learning/organizations/' + organization?.id + '/evidence/' + item.evidenceId + '/review/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewNote }),
      });
      setNotice(decision === 'verified'
        ? 'Evidence verified. This is not a competency mastery assessment.'
        : 'Evidence returned with reviewer feedback.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit the review decision.');
    } finally { setBusyId(null); }
  }, [api, load, notes, organization?.id]);

  return <Screen>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
        <Text style={styles.backText}>Skills & portfolio</Text>
      </Pressable>
      <Text style={styles.eyebrow}>DIGNITY · EVIDENCE REVIEW</Text>
      <Text style={styles.title}>Learning evidence workspace</Text>
      <Text style={styles.subtitle}>Review only evidence that learners have explicitly shared with this organization. Every decision is permission-checked by the server.</Text>
      <SurfaceCard style={styles.context}>
        <Ionicons name="business-outline" size={20} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{organization?.name ?? 'No active organization'}</Text>
          <Text style={styles.detail}>Requires learning.evidence.review permission. Organization membership alone does not grant reviewer access.</Text>
        </View>
      </SurfaceCard>
      {loading ? <SurfaceCard><Text style={styles.detail}>Loading review queue…</Text></SurfaceCard> : null}
      {!loading && !error && items.length === 0 ? (
        <SurfaceCard style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} />
          <Text style={styles.cardTitle}>No evidence awaiting review</Text>
          <Text style={styles.detail}>New submissions appear here only after their owners explicitly share them with this organization.</Text>
        </SurfaceCard>
      ) : null}
      {items.map((item) => (
        <SurfaceCard key={item.evidenceId} style={styles.item}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.learner}>{item.learnerDisplayName || 'Dignity learner'}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.detail}>{item.type} · {item.outcomeTitle}</Text>
            </View>
            <Text style={styles.pending}>Pending</Text>
          </View>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          {item.artifactUrl ? <Text selectable style={styles.url}>{item.artifactUrl}</Text> : null}
          <Text style={styles.meta}>Submitted {new Date(item.submittedAt).toLocaleString()}</Text>
          <Text style={styles.meta}>Shared {new Date(item.sharedAt).toLocaleString()}</Text>
          <Text style={styles.fieldLabel}>Reviewer note (required for rejection)</Text>
          <TextInput value={notes[item.evidenceId] ?? ''} onChangeText={(value) => setNotes((current) => ({ ...current, [item.evidenceId]: value }))}
            placeholder="Explain strengths, gaps or required changes…" placeholderTextColor={colors.muted}
            multiline textAlignVertical="top" style={styles.input} />
          <View style={styles.actions}>
            <Pressable disabled={busyId === item.evidenceId} onPress={() => void decide(item, 'rejected')} style={[styles.secondaryButton, busyId === item.evidenceId && styles.disabled]}>
              <Text style={styles.secondaryText}>Request revision</Text>
            </Pressable>
            <Pressable disabled={busyId === item.evidenceId} onPress={() => void decide(item, 'verified')} style={[styles.primaryButton, busyId === item.evidenceId && styles.disabled]}>
              <Text style={styles.primaryText}>{busyId === item.evidenceId ? 'Saving…' : 'Verify evidence'}</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>Evidence verification confirms this submission only. It does not automatically change the learner’s competency mastery level.</Text>
        </SurfaceCard>
      ))}
      {error ? <Pressable onPress={() => void load()} style={styles.error}><Text style={styles.errorText}>{error} · Tap to retry</Text></Pressable> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  context: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.primarySoft },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: spacing.xl },
  item: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  learner: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  pending: { color: colors.primaryDark, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, fontSize: 9, fontWeight: '900' },
  description: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  url: { color: colors.primaryDark, fontSize: 10 },
  meta: { color: colors.muted, fontSize: 9 },
  fieldLabel: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  input: { minHeight: 76, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md, color: colors.ink, fontSize: 12, backgroundColor: colors.background },
  actions: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.medium, backgroundColor: colors.primaryDark },
  primaryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  secondaryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted },
  secondaryText: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  disclaimer: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  error: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  notice: { color: colors.success, fontSize: 11 },
});
