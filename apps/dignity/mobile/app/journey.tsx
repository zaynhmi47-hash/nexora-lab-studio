import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type JourneyItem = {
  id: string;
  occurredAt: string;
  domain: string;
  kind: string;
  title: string;
  description: string | null;
  source: { type: string; reference?: string; verificationStatus?: string; organizationId?: string; reviewerAttributed?: boolean; evidenceType?: string; assessmentMethod?: string; contributionType?: string; verifierAttributed?: boolean; employmentType?: string; startDate?: string; endDate?: string | null; isCurrent?: boolean; role?: string; skills?: string[]; artifactUrl?: string | null; visibility?: string; projectStatus?: string; fieldOfStudy?: string; methodology?: string; outputType?: string; publicationStatus?: string; provenanceStatus?: string; verificationStatus?: string; organizationId?: string; reviewerAttributed?: boolean; hasDoi?: boolean; hasResourceUrl?: boolean };
  competency: { key: string; title: string; outcomeKey: string; outcomeTitle: string } | null;
  status: string | null;
  mastery: { level: number; status: string } | null;
  relatedMilestones: { id: string; title: string; pillar: string; status: string }[];
};
type JourneyResponse = {
  windowDays: number;
  generatedAt: string;
  items: JourneyItem[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
  privacy: {
    ownerScoped: boolean;
    journalContentIncluded: boolean;
    habitNotesIncluded: boolean;
    privateReflectionsIncluded: boolean;
    organizationAccessGranted: boolean;
    careerRecordsIncluded?: boolean;
    careerRecordsShared?: boolean;
    researchRecordsIncluded?: boolean;
    researchRecordsShared?: boolean;
  };
  limitations: string[];
};
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}
function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function domainLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DevelopmentJourneyScreen() {
  const api = useNexoraApi();
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (days = windowDays) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<JourneyResponse>(`/api/v1/learning/journey/?window=${days}&limit=100`);
      setJourney(payload<JourneyResponse>(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load your development journey.');
    } finally {
      setLoading(false);
    }
  }, [api, windowDays]);

  const loadMore = useCallback(async () => {
    if (!journey?.hasMore || journey.nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const response = await api.request<JourneyResponse>(
        `/api/v1/learning/journey/?window=${windowDays}&limit=100&offset=${journey.nextOffset}`,
      );
      const next = payload<JourneyResponse>(response);
      setJourney((current) => current ? {
        ...next,
        items: [...current.items, ...next.items],
      } : next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load more activity.');
    } finally {
      setLoadingMore(false);
    }
  }, [api, journey, loadingMore, windowDays]);

  useEffect(() => { void load(); }, [load]);

  const chooseWindow = (days: 7 | 30 | 90) => {
    setWindowDays(days);
    void load(days);
  };

  return <Screen>
    <Pressable onPress={() => router.back()} style={styles.back}>
      <Ionicons name="chevron-back" size={18} color={colors.primary} />
      <Text style={styles.backText}>Skill profile</Text>
    </Pressable>
    <Text style={styles.eyebrow}>DIGNITY · DEVELOPMENT JOURNEY</Text>
    <Text style={styles.title}>Your progress, with its context.</Text>
    <Text style={styles.subtitle}>A chronological view of learning evidence, verified formal course completions, self-reported career and research records, personal growth activity and explicit competency assessments.</Text>

    <SurfaceCard style={styles.privacyCard}>
      <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>Private by default</Text>
        <Text style={styles.detail}>This journey is visible to your account only. It does not grant an organization access to your records.</Text>
      </View>
    </SurfaceCard>

    <View style={styles.filters}>
      {([7, 30, 90] as const).map((days) => (
        <Pressable key={days} onPress={() => chooseWindow(days)} style={[styles.filter, windowDays === days && styles.filterActive]}>
          <Text style={[styles.filterText, windowDays === days && styles.filterTextActive]}>{days} days</Text>
        </Pressable>
      ))}
    </View>

    <View style={styles.section}>
      <SectionHeading title="Development activity" subtitle={journey ? `${journey.total} recorded items · newest first` : 'Your activity will appear here.'} />
      {loading ? <SurfaceCard><Text style={styles.detail}>Loading development journey…</Text></SurfaceCard> : null}
      {!loading && journey?.items.length === 0 ? (
        <SurfaceCard style={styles.empty}>
          <Ionicons name="trail-sign-outline" size={26} color={colors.muted} />
          <Text style={styles.cardTitle}>Your journey starts here</Text>
          <Text style={styles.detail}>Complete a lesson, record a growth activity or submit evidence to begin building your timeline.</Text>
        </SurfaceCard>
      ) : null}
      {!loading ? journey?.items.map((item) => (
        <View key={item.id} style={styles.timelineRow}>
          <View style={styles.timelineRail}><View style={styles.dot} /><View style={styles.line} /></View>
          <SurfaceCard style={styles.eventCard}>
            <View style={styles.eventTop}>
              <Text style={styles.domain}>{domainLabel(item.domain)}</Text>
              <Text style={styles.date}>{dateLabel(item.occurredAt)}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.detail}>{item.description}</Text> : null}
            {item.competency ? <View style={styles.competency}>
              <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
              <View style={styles.flex}>
                <Text style={styles.competencyTitle}>{item.competency.title}</Text>
                <Text style={styles.detail}>{item.competency.outcomeTitle}</Text>
              </View>
            </View> : null}
            {item.status ? <Text style={styles.status}>Status · {domainLabel(item.status)}</Text> : null}
            {item.mastery ? <Text style={styles.status}>Assessed level · {item.mastery.level}/5 · {domainLabel(item.mastery.status)}</Text> : null}
            {item.source.evidenceType ? <Text style={styles.source}>Evidence type · {domainLabel(item.source.evidenceType)}</Text> : null}
            {item.domain === 'academic' ? <Text style={styles.source}>Formal record · Verified completion{item.source.contributionType ? ` · ${domainLabel(item.source.contributionType)}` : ''}</Text> : null}
            {item.domain === 'academic' && item.source.verifierAttributed ? <Text style={styles.source}>Verification · Attributed to an institutional verifier</Text> : null}
            {item.domain === 'academic' && !item.competency ? <Text style={styles.source}>Competency mapping has not yet been configured for this course.</Text> : null}
            {item.domain === 'career' && item.kind === 'professional_experience' ? <Text style={styles.source}>Self-reported experience · {item.source.employmentType?.replaceAll('_', ' ')} · {item.source.startDate}{item.source.isCurrent ? ' — Present' : item.source.endDate ? ` — ${item.source.endDate}` : ''}</Text> : null}
            {item.domain === 'career' && item.kind === 'portfolio_project' ? <Text style={styles.source}>Self-reported portfolio · {item.source.visibility ?? 'private'}{item.source.skills?.length ? ` · ${item.source.skills.join(', ')}` : ''}</Text> : null}
            {item.domain === 'research' && item.kind === 'research_project' ? <Text style={styles.source}>Self-reported research · {item.source.fieldOfStudy || 'Field not specified'} · {item.source.methodology || 'Method not specified'}</Text> : null}
            {item.domain === 'research' && item.kind === 'research_output' ? <Text style={styles.source}>Self-reported output · {item.source.outputType} · {item.source.publicationStatus} · provenance {item.source.provenanceStatus}</Text> : null}
            {item.domain === 'research' && item.kind === 'verified_research_competency_evidence' ? (
              <View style={styles.verifiedResearch}>
                <Ionicons name="shield-checkmark" size={14} color={colors.primaryDark} />
                <View style={styles.flex}>
                  <Text style={styles.verifiedResearchTitle}>Organization-verified research evidence</Text>
                  <Text style={styles.detail}>Verified source linked to this outcome. This is evidence provenance, not an automatic mastery decision.</Text>
                  {item.source.reviewerAttributed ? <Text style={styles.source}>Reviewer attribution recorded</Text> : null}
                </View>
              </View>
            ) : null}
            {item.relatedMilestones.map((milestone) => (
              <View key={milestone.id} style={styles.milestone}>
                <Ionicons name="flag-outline" size={13} color={colors.primaryDark} />
                <Text style={styles.milestoneText}>Linked milestone · {milestone.title}</Text>
              </View>
            ))}
          </SurfaceCard>
        </View>
      )) : null}
      {!loading && journey?.hasMore ? (
        <Pressable onPress={() => void loadMore()} disabled={loadingMore} style={[styles.loadMore, loadingMore && styles.disabled]}>
          <Text style={styles.loadMoreText}>{loadingMore ? 'Loading more…' : 'Load more activity'}</Text>
        </Pressable>
      ) : null}
    </View>

    {journey ? <SurfaceCard style={styles.limitations}>
      <Text style={styles.cardTitle}>How to read this journey</Text>
      {journey.limitations.map((item, index) => <Text key={index} style={styles.detail}>• {item}</Text>)}
      <Text style={styles.detail}>Private journal content and habit notes are intentionally excluded.</Text>
    </SurfaceCard> : null}
    {error ? <Pressable onPress={() => void load()} style={styles.errorBox}><Text style={styles.errorText}>{error} · Retry</Text></Pressable> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  backText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  privacyCard: { flexDirection: 'row', gap: 11, backgroundColor: colors.primarySoft, borderColor: '#D5E5D9' },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  filters: { flexDirection: 'row', gap: 8, marginTop: spacing.lg },
  filter: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  filterTextActive: { color: colors.primaryDark },
  section: { marginTop: spacing.section },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 5 },
  timelineRow: { flexDirection: 'row', gap: 9 },
  timelineRail: { width: 13, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 17 },
  line: { width: 1, flex: 1, backgroundColor: colors.line, marginTop: 4 },
  eventCard: { flex: 1, marginBottom: spacing.sm, padding: spacing.md },
  eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  domain: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  date: { color: colors.muted, fontSize: 9 },
  competency: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.small, padding: 9, marginTop: 10 },
  competencyTitle: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  status: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', marginTop: 8 },
  verifiedResearch: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.small, padding: 9, marginTop: 9 },
  verifiedResearchTitle: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  source: { color: colors.muted, fontSize: 9, marginTop: 6 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  milestoneText: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', flex: 1 },
  limitations: { marginTop: spacing.lg, gap: 5 },
  loadMore: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, marginTop: spacing.sm },
  loadMoreText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  errorBox: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 10 },
  errorText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
});
