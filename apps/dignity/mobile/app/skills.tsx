import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

interface SkillOutcome {
  outcomeKey: string;
  outcomeTitle: string;
  competencyKey: string;
  competencyTitle: string;
  domain: string;
  targetProficiencyLevel: number;
  masteryLevel: number | null;
  masteryStatus: 'unassessed' | 'provisional' | 'verified';
  assessmentMethod: string | null;
  evidenceCounts: { pending: number; verified: number; rejected: number };
}
interface CompetencyCatalog {
  key: string;
  title: string;
  domain: string;
  outcomes: { key: string; title: string; description: string; proficiencyLevel: number }[];
}
interface JourneyItem {
  id: string;
  occurredAt: string;
  domain: string;
  kind: string;
  title: string;
  description: string | null;
  status: string | null;
  competency: { title: string; outcomeTitle: string } | null;
  mastery: { level: number; status: string } | null;
}
interface JourneyResponse { items: JourneyItem[]; total: number; windowDays: number; }
interface PortfolioEvidence {
  id: string;
  occurredAt: string;
  domain: string;
  kind: string;
  title: string;
  description: string | null;
  status: string | null;
}
interface PortfolioCompetency {
  key: string;
  title: string;
  domain: string;
  evidenceCount: number;
  evidence: PortfolioEvidence[];
}
interface CrossDomainPortfolio {
  competencies: PortfolioCompetency[];
  hasMoreActivity: boolean;
  activityTotal: number;
}
interface EvidenceItem {
  id: string;
  outcomeKey: string;
  outcomeTitle: string;
  type: string;
  title: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  sharedOrganizations?: { id: string; name: string; sharedAt: string }[];
}
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export default function SkillsScreen() {
  const api = useNexoraApi();
  const { organization } = useOrganization();
  const [skills, setSkills] = useState<SkillOutcome[]>([]);
  const [catalog, setCatalog] = useState<CompetencyCatalog[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [journeyItems, setJourneyItems] = useState<JourneyItem[]>([]);
  const [journeyTotal, setJourneyTotal] = useState(0);\n  const [portfolioGroups, setPortfolioGroups] = useState<PortfolioCompetency[]>([]);\n  const [portfolioHasMore, setPortfolioHasMore] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [evidenceType, setEvidenceType] = useState('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artifactUrl, setArtifactUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharingEvidenceId, setSharingEvidenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const outcomes = useMemo(
    () => catalog.flatMap((competency) => competency.outcomes.map((outcome) => ({
      ...outcome,
      competencyTitle: competency.title,
    }))),
    [catalog],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [skillResponse, catalogResponse, evidenceResponse, journeyResponse, portfolioResponse] = await Promise.all([
        api.request<SkillOutcome[]>('/api/v1/learning/skills/'),
        api.request<CompetencyCatalog[]>('/api/v1/learning/competencies/'),
        api.request<EvidenceItem[]>('/api/v1/learning/evidence/'),
        api.request<JourneyResponse>('/api/v1/learning/journey/?window=90&limit=100'),\n        api.request<CrossDomainPortfolio>('/api/v1/learning/portfolio/cross-domain/?window=90'),
      ]);
      const nextSkills = payload<SkillOutcome[]>(skillResponse);
      const nextCatalog = payload<CompetencyCatalog[]>(catalogResponse);
      const nextEvidence = payload<EvidenceItem[]>(evidenceResponse);
      const nextJourney = payload<JourneyResponse>(journeyResponse);\n      const nextPortfolio = payload<CrossDomainPortfolio>(portfolioResponse);
      setSkills(Array.isArray(nextSkills) ? nextSkills : []);
      setCatalog(Array.isArray(nextCatalog) ? nextCatalog : []);
      setEvidence(Array.isArray(nextEvidence) ? nextEvidence : []);
      setJourneyItems(Array.isArray(nextJourney?.items) ? nextJourney.items : []);
      setJourneyTotal(typeof nextJourney?.total === 'number' ? nextJourney.total : 0);\n      setPortfolioGroups(Array.isArray(nextPortfolio?.competencies) ? nextPortfolio.competencies : []);\n      setPortfolioHasMore(nextPortfolio?.hasMoreActivity === true);
      setSelectedOutcome((current) => current || nextCatalog?.flatMap((item) => item.outcomes)[0]?.key || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load your skill profile.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const domainSummary = useMemo(() => {
    const counts = new Map<string, number>();
    journeyItems.forEach((item) => counts.set(item.domain, (counts.get(item.domain) ?? 0) + 1));
    return ['learning', 'academic', 'research', 'career', 'growth', 'assessment']
      .map((domain) => ({ domain, count: counts.get(domain) ?? 0 }))
      .filter((item) => item.count > 0);
  }, [journeyItems]);

  const toggleEvidenceShare = useCallback(async (item: EvidenceItem) => {
    if (!organization) return;
    const alreadyShared = item.sharedOrganizations?.some((shared) => shared.id === organization.id) ?? false;
    setSharingEvidenceId(item.id);
    setError(null);
    setNotice(null);
    try {
      await api.request('/api/v1/learning/evidence/shares/', {
        method: alreadyShared ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceId: item.id, organizationId: organization.id }),
      });
      setNotice(alreadyShared
        ? `Access revoked for ${organization.name}.`
        : `Evidence shared with ${organization.name}. You can revoke access at any time.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update evidence sharing.');
    } finally {
      setSharingEvidenceId(null);
    }
  }, [api, load, organization]);

  const submitEvidence = useCallback(async () => {
    if (!selectedOutcome || !title.trim()) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.request('/api/v1/learning/evidence/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcomeKey: selectedOutcome,
          type: evidenceType,
          title: title.trim(),
          description: description.trim(),
          artifactUrl: artifactUrl.trim(),
        }),
      });
      setTitle('');
      setDescription('');
      setArtifactUrl('');
      setNotice('Evidence submitted. It remains pending until an authorized reviewer checks it.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit evidence.');
    } finally {
      setSaving(false);
    }
  }, [api, artifactUrl, description, evidenceType, load, selectedOutcome, title]);

  return <Screen>
    <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={18} color={colors.primary} /><Text style={styles.backText}>Profile</Text></Pressable>
    <Text style={styles.eyebrow}>DIGNITY SKILL PROFILE</Text>
    <Text style={styles.title}>Show what you can do.</Text>
    <Text style={styles.subtitle}>Track measurable learning outcomes, collect evidence and distinguish submitted work from assessed mastery.</Text>

    <SurfaceCard style={styles.principle}>
      <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
      <View style={styles.flex}><Text style={styles.principleTitle}>Evidence is not an automatic mastery score</Text><Text style={styles.detail}>Course completion, self-reported work and independently reviewed competence remain separate.</Text></View>
    </SurfaceCard>

    <Pressable onPress={() => router.push('/journey')} style={styles.journeyLink}>
      <Ionicons name="trail-sign-outline" size={18} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>View development journey</Text>
        <Text style={styles.detail}>Learning, growth and assessed evidence in one timeline</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>

    <View style={styles.section}>
      <SectionHeading title="Cross-domain portfolio" subtitle="Your recorded development evidence across the last 90 days. Sources keep their own verification status." />
      <SurfaceCard style={styles.crossDomainCard}>
        <View style={styles.portfolioSummaryRow}>
          <View><Text style={styles.portfolioTotal}>{journeyTotal}</Text><Text style={styles.detail}>Total recorded activities · 90 days</Text></View>
          <View><Text style={styles.portfolioTotal}>{domainSummary.length}</Text><Text style={styles.detail}>Active domains</Text></View>
        </View>
        {domainSummary.length === 0 ? <Text style={styles.detail}>No cross-domain activity has been recorded in this period yet.</Text> : <View style={styles.domainChips}>
          {domainSummary.map((item) => <View key={item.domain} style={styles.domainChip}><Text style={styles.domainChipTitle}>{item.domain}</Text><Text style={styles.domainChipCount}>{item.count}</Text></View>)}
        </View>}
        {portfolioGroups.length > 0 ? <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={styles.fieldLabel}>Evidence grouped by competency</Text>
          {portfolioGroups.filter((group) => group.evidenceCount > 0).slice(0, 6).map((group) => <View key={group.key} style={styles.portfolioEvent}>
            <View style={styles.eventMarker} />
            <View style={styles.flex}>
              <Text style={styles.eventTitle}>{group.title}</Text>
              <Text style={styles.detail}>{group.domain} · {group.evidenceCount} linked evidence record(s)</Text>
              {group.evidence.slice(0, 2).map((item) => <Text key={item.id} style={styles.eventCompetency}>{item.title} · {item.domain} · {item.status ?? 'recorded'}</Text>)}
            </View>
          </View>)}
        </View> : null}
        {portfolioHasMore ? <Text style={styles.detail}>More than 100 activity records exist in this window; the grouped preview shows the first page only.</Text> : null}
        {journeyItems.slice(0, 5).map((item) => <View key={item.id} style={styles.portfolioEvent}>
          <View style={styles.eventMarker} />
          <View style={styles.flex}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.detail}>{item.description ?? item.competency?.outcomeTitle ?? 'Development record'} · {item.domain}</Text>
            {item.competency ? <Text style={styles.eventCompetency}>{item.competency.title} · {item.competency.outcomeTitle}</Text> : null}
          </View>
          {item.status ? <Text style={styles.eventStatus}>{item.status.replaceAll('_', ' ')}</Text> : null}
        </View>)}
        <Text style={styles.privacy}>This is an activity portfolio, not a mastery score. Private journals and habit notes are excluded; career and research records remain self-reported unless explicitly verified.</Text>
      </SurfaceCard>
    </View>

    <View style={styles.section}>
      <SectionHeading title="Competency outcomes" subtitle="Mastery appears only when an explicit assessment record exists." />
      {loading ? <SurfaceCard><Text style={styles.detail}>Loading skill profile…</Text></SurfaceCard> : null}
      {!loading && skills.length === 0 ? <SurfaceCard style={styles.empty}><Ionicons name="layers-outline" size={24} color={colors.muted} /><Text style={styles.cardTitle}>Competency framework is not published yet</Text><Text style={styles.detail}>Published outcomes will appear here when the framework is configured.</Text></SurfaceCard> : null}
      {skills.map((skill) => <SurfaceCard key={skill.outcomeKey} style={styles.skillCard}>
        <Text style={styles.domain}>{skill.domain.toUpperCase()} · {skill.competencyTitle}</Text>
        <Text style={styles.cardTitle}>{skill.outcomeTitle}</Text>
        <View style={styles.skillMeta}>
          <Text style={styles.level}>Target level {skill.targetProficiencyLevel}/5</Text>
          <Text style={styles.status}>{skill.masteryStatus === 'unassessed' ? 'Not assessed' : skill.masteryStatus === 'provisional' ? 'Provisional' : 'Verified mastery'}</Text>
        </View>
        <View style={styles.counts}>
          <Count label="Pending" value={skill.evidenceCounts.pending} />
          <Count label="Verified" value={skill.evidenceCounts.verified} />
          <Count label="Needs revision" value={skill.evidenceCounts.rejected} />
        </View>
      </SurfaceCard>)}
    </View>

    <View style={styles.section}>
      <SectionHeading title="Add learning evidence" subtitle="Submit a project, assignment, certificate or practical demonstration." />
      <SurfaceCard style={styles.form}>
        <Text style={styles.fieldLabel}>Learning outcome</Text>
        {outcomes.length === 0 ? <Text style={styles.detail}>No published outcomes are available for evidence submission yet.</Text> : <View style={styles.optionList}>
          {outcomes.map((outcome) => <Pressable key={outcome.key} onPress={() => setSelectedOutcome(outcome.key)} style={[styles.outcomeOption, selectedOutcome === outcome.key && styles.selectedOption]}>
            <Ionicons name={selectedOutcome === outcome.key ? 'radio-button-on' : 'radio-button-off'} size={17} color={selectedOutcome === outcome.key ? colors.primary : colors.muted} />
            <View style={styles.flex}><Text style={styles.optionTitle}>{outcome.title}</Text><Text style={styles.detail}>{outcome.competencyTitle}</Text></View>
          </Pressable>)}
        </View>}
        <Text style={styles.fieldLabel}>Evidence type</Text>
        <View style={styles.typeRow}>
          {['project', 'assignment', 'certificate', 'practice', 'reflection', 'other'].map((type) => <Pressable key={type} onPress={() => setEvidenceType(type)} style={[styles.typeChip, evidenceType === type && styles.typeChipActive]}><Text style={[styles.typeText, evidenceType === type && styles.typeTextActive]}>{type}</Text></Pressable>)}
        </View>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="What did you create or demonstrate?" placeholderTextColor={colors.muted} style={styles.input} maxLength={255} />
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe your role, process and result…" placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" />
        <Text style={styles.fieldLabel}>Artifact link (optional, HTTPS only)</Text>
        <TextInput value={artifactUrl} onChangeText={setArtifactUrl} placeholder="https://…" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" keyboardType="url" />
        <Pressable disabled={!selectedOutcome || !title.trim() || saving} onPress={() => void submitEvidence()} style={[styles.submit, (!selectedOutcome || !title.trim() || saving) && styles.disabled]}>
          <Text style={styles.submitText}>{saving ? 'Submitting…' : 'Submit evidence'}</Text>
        </Pressable>
        <Text style={styles.privacy}>Your portfolio is private to your account by default. Submission does not grant an institution or employer access.</Text>
      </SurfaceCard>
    </View>

    <View style={styles.section}>
      <SectionHeading title="Your evidence portfolio" subtitle="Only your own submissions are shown here." />
      {evidence.length === 0 ? <SurfaceCard><Text style={styles.detail}>No evidence submitted yet.</Text></SurfaceCard> : evidence.map((item) => {
        const isShared = item.sharedOrganizations?.some((shared) => shared.id === organization?.id) ?? false;
        return <SurfaceCard key={item.id} style={styles.evidenceCard}>
          <View style={styles.evidenceTop}><Text style={styles.cardTitle}>{item.title}</Text><Text style={[styles.evidenceStatus, item.status === 'verified' ? styles.verified : item.status === 'rejected' ? styles.rejected : styles.pending]}>{item.status}</Text></View>
          <Text style={styles.detail}>{item.outcomeTitle} · {item.type}</Text>
          {item.sharedOrganizations?.length ? <Text style={styles.sharedLabel}>Shared with: {item.sharedOrganizations.map((shared) => shared.name).join(', ')}</Text> : <Text style={styles.detail}>Private to your account</Text>}
          <Pressable
            accessibilityRole="button"
            disabled={!organization || sharingEvidenceId === item.id}
            onPress={() => void toggleEvidenceShare(item)}
            style={[styles.shareButton, (!organization || sharingEvidenceId === item.id) && styles.disabled]}
          >
            <Ionicons name={isShared ? 'lock-closed-outline' : 'share-social-outline'} size={14} color={colors.primaryDark} />
            <Text style={styles.shareButtonText}>{sharingEvidenceId === item.id ? 'Updating…' : !organization ? 'No organization selected' : isShared ? `Revoke access · ${organization.name}` : `Share with ${organization.name}`}</Text>
          </Pressable>
        </SurfaceCard>;
      })}
    </View>
    {error ? <Pressable onPress={() => void load()} style={styles.errorBox}><Text style={styles.errorText}>{error} · Retry</Text></Pressable> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
  </Screen>;
}

function Count({ label, value }: { label: string; value: number }) {
  return <View style={styles.count}><Text style={styles.countValue}>{value}</Text><Text style={styles.countLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  backText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  principle: { flexDirection: 'row', gap: 12, backgroundColor: colors.primarySoft, borderColor: '#D5E5D9' },
  crossDomainCard: { gap: 12 },
  portfolioSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  portfolioTotal: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  domainChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  domainChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 7 },
  domainChipTitle: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },
  domainChipCount: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  portfolioEvent: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  eventMarker: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 },
  eventTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  eventCompetency: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', marginTop: 4 },
  eventStatus: { color: colors.muted, fontSize: 8, fontWeight: '800', textTransform: 'capitalize', maxWidth: 75, textAlign: 'right' },
  principleTitle: { color: colors.ink, fontSize: 12, fontWeight: '900', marginBottom: 4 },
  flex: { flex: 1 },
  section: { marginTop: spacing.section },
  journeyLink: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginTop: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  skillCard: { marginBottom: spacing.sm, padding: spacing.md },
  domain: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  cardTitle: { color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: '900', marginTop: 5 },
  skillMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  level: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  status: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  counts: { flexDirection: 'row', gap: 8, marginTop: 12 },
  count: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.small, padding: 8 },
  countValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  countLabel: { color: colors.muted, fontSize: 9, marginTop: 3 },
  form: { gap: 9 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: '900', marginTop: 8 },
  optionList: { gap: 7 },
  outcomeOption: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: 10 },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  typeChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  typeText: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },
  typeTextActive: { color: colors.primaryDark },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, paddingHorizontal: 11, paddingVertical: 9, color: colors.ink, fontSize: 12, backgroundColor: colors.background },
  multiline: { minHeight: 84 },
  submit: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingVertical: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  privacy: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  evidenceCard: { padding: spacing.md, marginBottom: spacing.sm },
  sharedLabel: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', marginTop: 7 },
  shareButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.primarySoft, marginTop: 10 },
  shareButtonText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' },
  evidenceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  evidenceStatus: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  verified: { color: colors.success },
  rejected: { color: colors.danger },
  pending: { color: colors.muted },
  errorBox: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 10 },
  errorText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  notice: { color: colors.success, fontSize: 11, lineHeight: 16, marginTop: 10 },
});
