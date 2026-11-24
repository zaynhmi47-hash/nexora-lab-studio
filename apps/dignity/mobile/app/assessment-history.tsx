import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type AssessmentEvent = {
  id: string; outcomeKey: string; outcomeTitle: string; competencyTitle: string;
  level: number; status: string; assessmentMethod: string; rationale: string;
  assessedBy: string; assessedAt: string; rubricVersion: number | null;
  criterionScores: Record<string, number>;
};
function payload<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
}

export default function AssessmentHistoryScreen() {
  const api = useNexoraApi();
  const [items, setItems] = useState<AssessmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.request<AssessmentEvent[]>('/api/v1/learning/assessment-history/');
      const result = payload<AssessmentEvent[]>(response);
      setItems(Array.isArray(result) ? result : []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Tidak dapat memuat riwayat penilaian.'); }
    finally { setLoading(false); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  return <Screen>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={18} color={colors.primary} /><Text style={styles.backText}>Skills</Text></Pressable>
      <Text style={styles.eyebrow}>DIGNITY · COMPETENCY RECORD</Text>
      <Text style={styles.title}>Assessment history</Text>
      <Text style={styles.subtitle}>Riwayat keputusan penilaian yang eksplisit, termasuk assessor, metode, alasan, versi rubrik, dan skor setiap kriteria.</Text>
      {loading ? <SurfaceCard><Text style={styles.detail}>Memuat riwayat…</Text></SurfaceCard> : null}
      {error ? <Pressable onPress={() => void load()} style={styles.error}><Text style={styles.errorText}>{error} · Ketuk untuk mencoba lagi</Text></Pressable> : null}
      {!loading && !error && items.length === 0 ? <SurfaceCard style={styles.empty}><Ionicons name="document-text-outline" size={26} color={colors.primary} /><Text style={styles.cardTitle}>Belum ada penilaian</Text><Text style={styles.detail}>Level kompetensi hanya muncul setelah penilaian eksplisit dilakukan.</Text></SurfaceCard> : null}
      {items.map((item) => <SurfaceCard key={item.id} style={styles.card}>
        <Text style={styles.eyebrow}>{item.competencyTitle}</Text>
        <Text style={styles.cardTitle}>{item.outcomeTitle}</Text>
        <View style={styles.levelRow}><Text style={styles.level}>Level {item.level}/5</Text><Text style={styles.status}>{item.status}</Text></View>
        <Text style={styles.detail}>Assessor · {item.assessedBy}</Text>
        <Text style={styles.detail}>Method · {item.assessmentMethod}</Text>
        <Text style={styles.detail}>Date · {new Date(item.assessedAt).toLocaleString()}</Text>
        {item.rubricVersion ? <Text style={styles.detail}>Rubric version · {item.rubricVersion}</Text> : <Text style={styles.detail}>Legacy assessment · no rubric snapshot</Text>}
        <Text style={styles.rationale}>{item.rationale}</Text>
        {Object.keys(item.criterionScores ?? {}).length > 0 ? <View style={styles.scores}>
          <Text style={styles.scoreHeading}>Criterion scores</Text>
          {Object.entries(item.criterionScores).map(([key, score]) => <View key={key} style={styles.scoreRow}><Text style={styles.scoreKey}>{key.replaceAll('_', ' ')}</Text><Text style={styles.scoreValue}>{score}/5</Text></View>)}
        </View> : null}
      </SurfaceCard>)}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  backText: { color: colors.primary, fontWeight: '700' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  card: { gap: spacing.sm },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  level: { color: colors.primaryDark, fontSize: 16, fontWeight: '900' },
  status: { color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: '900' },
  rationale: { color: colors.ink, fontSize: 12, lineHeight: 19, marginTop: spacing.xs },
  scores: { backgroundColor: colors.surfaceMuted, padding: spacing.md, borderRadius: radius.medium, gap: spacing.xs },
  scoreHeading: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.xs },
  scoreKey: { color: colors.muted, fontSize: 11 },
  scoreValue: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  error: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 11 },
});
