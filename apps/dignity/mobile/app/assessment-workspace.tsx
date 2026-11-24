import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Criterion = { key: string; title: string; description: string; weight?: number; levels: Record<string, string> };
type Rubric = { outcomeKey: string; outcomeTitle: string; competencyTitle: string; version: number; criteria: Criterion[]; levelScale: { level: number; label: string }[] };
function payload<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
}

export default function AssessmentWorkspaceScreen() {
  const api = useNexoraApi();
  const { organization } = useOrganization();
  const [learnerId, setLearnerId] = useState('');
  const [outcomeKey, setOutcomeKey] = useState('');
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [level, setLevel] = useState(3);
  const [assessmentStatus, setAssessmentStatus] = useState<'provisional' | 'verified'>('provisional');
  const [method, setMethod] = useState('portfolio_review');
  const [rationale, setRationale] = useState('');
  const [loadingRubric, setLoadingRubric] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadRubric = useCallback(async () => {
    if (!outcomeKey.trim()) { setError('Masukkan outcome key terlebih dahulu.'); return; }
    setLoadingRubric(true); setError(null); setNotice(null); setRubric(null); setScores({});
    try {
      const response = await api.request<Rubric>('/api/v1/learning/rubrics/?outcomeKey=' + encodeURIComponent(outcomeKey.trim()));
      const next = payload<Rubric>(response);
      if (!Array.isArray(next.criteria) || next.criteria.length === 0) throw new Error('Rubrik belum memiliki kriteria yang dapat dinilai.');
      setRubric(next);
      setScores(Object.fromEntries(next.criteria.map((item) => [item.key, 3])));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Tidak dapat memuat rubrik.'); }
    finally { setLoadingRubric(false); }
  }, [api, outcomeKey]);

  useEffect(() => { setRubric(null); setScores({}); }, [organization?.id]);

  const submit = useCallback(async () => {
    if (!organization) { setError('Pilih organisasi terlebih dahulu.'); return; }
    if (!rubric) { setError('Muat rubrik outcome terlebih dahulu.'); return; }
    if (!learnerId.trim() || !rationale.trim()) { setError('Learner ID dan alasan penilaian wajib diisi.'); return; }
    if (rubric.criteria.some((item) => !Number.isInteger(scores[item.key]) || scores[item.key] < 1 || scores[item.key] > 5)) {
      setError('Berikan skor 1–5 untuk setiap kriteria.'); return;
    }
    setSaving(true); setError(null); setNotice(null);
    try {
      await api.request('/api/v1/learning/organizations/' + organization.id + '/mastery/assess/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: learnerId.trim(), outcomeKey: rubric.outcomeKey, level, status: assessmentStatus,
          assessmentMethod: method.trim(), rationale: rationale.trim(), criterionScores: scores,
        }),
      });
      setNotice('Penilaian tersimpan. Level merupakan keputusan assessor, bukan hasil rata-rata otomatis dari skor kriteria.');
      setRationale('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Penilaian gagal disimpan.'); }
    finally { setSaving(false); }
  }, [api, assessmentStatus, learnerId, level, method, organization, rationale, rubric, scores]);

  return <Screen>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={18} color={colors.primary} /><Text style={styles.backText}>Kembali</Text></Pressable>
      <Text style={styles.eyebrow}>DIGNITY · ASSESSOR WORKSPACE</Text>
      <Text style={styles.title}>Competency assessment</Text>
      <Text style={styles.subtitle}>Gunakan rubrik terstruktur untuk mendukung keputusan profesional. Izin assessor, bukti terverifikasi, dan batas akses organisasi tetap diperiksa server.</Text>
      <SurfaceCard style={styles.context}>
        <Ionicons name="business-outline" size={18} color={colors.primary} />
        <View style={styles.flex}><Text style={styles.cardTitle}>{organization?.name ?? 'Organisasi belum dipilih'}</Text><Text style={styles.detail}>Organisasi aktif yang sedang dipilih. Keanggotaan saja tidak otomatis memberi izin penilaian.</Text></View>
      </SurfaceCard>
      <Text style={styles.sectionTitle}>Subjek dan outcome</Text>
      <SurfaceCard style={styles.form}>
        <Text style={styles.label}>Learner ID</Text>
        <TextInput value={learnerId} onChangeText={setLearnerId} autoCapitalize="none" placeholder="UUID peserta" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>Outcome key</Text>
        <TextInput value={outcomeKey} onChangeText={setOutcomeKey} autoCapitalize="none" placeholder="mis. critical-thinking-evaluate-claim" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable disabled={loadingRubric} onPress={() => void loadRubric()} style={styles.secondaryButton}><Text style={styles.secondaryText}>{loadingRubric ? 'Memuat rubrik…' : 'Muat rubrik aktif'}</Text></Pressable>
      </SurfaceCard>
      {rubric ? <>
        <Text style={styles.sectionTitle}>{rubric.outcomeTitle}</Text>
        <Text style={styles.detail}>{rubric.competencyTitle} · Rubric v{rubric.version}</Text>
        {rubric.criteria.map((criterion) => <SurfaceCard key={criterion.key} style={styles.criterion}>
          <Text style={styles.cardTitle}>{criterion.title}</Text>
          <Text style={styles.detail}>{criterion.description}</Text>
          {[1, 2, 3, 4, 5].map((score) => <Pressable key={score} onPress={() => setScores((current) => ({ ...current, [criterion.key]: score }))} style={[styles.scoreRow, scores[criterion.key] === score && styles.scoreSelected]}>
            <View style={[styles.radio, scores[criterion.key] === score && styles.radioSelected]} />
            <View style={styles.flex}><Text style={styles.scoreTitle}>{score} · {rubric.levelScale.find((item) => item.level === score)?.label ?? 'Level ' + score}</Text><Text style={styles.detail}>{criterion.levels?.[String(score)] ?? 'Descriptor belum tersedia.'}</Text></View>
          </Pressable>)}
        </SurfaceCard>)}
        <Text style={styles.sectionTitle}>Keputusan assessor</Text>
        <SurfaceCard style={styles.form}>
          <Text style={styles.label}>Overall assessed level (keputusan manusia)</Text>
          <View style={styles.levelRow}>{[1, 2, 3, 4, 5].map((item) => <Pressable key={item} onPress={() => setLevel(item)} style={[styles.levelChip, level === item && styles.levelSelected]}><Text style={[styles.levelText, level === item && styles.levelTextSelected]}>{item}</Text></Pressable>)}</View>
          <Text style={styles.detail}>Skor kriteria adalah bukti pendukung. Sistem tidak menghitung rata-rata menjadi mastery secara otomatis.</Text>
          <Text style={styles.label}>Status</Text>
          <View style={styles.levelRow}>{(['provisional', 'verified'] as const).map((item) => <Pressable key={item} onPress={() => setAssessmentStatus(item)} style={[styles.statusChip, assessmentStatus === item && styles.levelSelected]}><Text style={[styles.levelText, assessmentStatus === item && styles.levelTextSelected]}>{item === 'provisional' ? 'Provisional' : 'Verified'}</Text></Pressable>)}</View>
          <Text style={styles.label}>Assessment method</Text>
          <TextInput value={method} onChangeText={setMethod} placeholder="portfolio_review" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.label}>Rationale and evidence interpretation</Text>
          <TextInput value={rationale} onChangeText={setRationale} multiline textAlignVertical="top" placeholder="Jelaskan alasan keputusan, konteks, kekuatan, dan area yang perlu dikembangkan." placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} />
          <Pressable disabled={saving} onPress={() => void submit()} style={[styles.submit, saving && styles.disabled]}><Text style={styles.submitText}>{saving ? 'Menyimpan…' : 'Simpan assessment'}</Text></Pressable>
        </SurfaceCard>
      </> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.privacy}>Penilaian hanya dapat dilakukan terhadap peserta dengan bukti terverifikasi yang dibagikan secara aktif kepada organisasi ini. Penilai tidak dapat menilai dirinya sendiri.</Text>
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  backText: { color: colors.primary, fontWeight: '700' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  context: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primarySoft },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: spacing.md },
  form: { gap: spacing.sm },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, color: colors.ink, padding: spacing.md, fontSize: 13 },
  multiline: { minHeight: 110 },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, padding: spacing.md, borderRadius: radius.medium },
  secondaryText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
  criterion: { gap: spacing.sm },
  scoreRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.sm, borderRadius: radius.small, borderWidth: 1, borderColor: colors.line },
  scoreSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  radio: { width: 15, height: 15, borderRadius: 8, borderWidth: 1, borderColor: colors.muted, marginTop: 2 },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
  scoreTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  levelRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  levelChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md, minWidth: 42, alignItems: 'center' },
  statusChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md },
  levelSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelText: { color: colors.ink, fontWeight: '800' },
  levelTextSelected: { color: '#FFFFFF' },
  submit: { alignItems: 'center', backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.medium, marginTop: spacing.md },
  submitText: { color: '#FFFFFF', fontWeight: '900' },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, fontSize: 12 },
  notice: { color: colors.success, fontSize: 12 },
  privacy: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: spacing.md },
});
