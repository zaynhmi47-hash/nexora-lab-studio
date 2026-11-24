import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type VerificationEvent = {
  id: string;
  from_status: string;
  to_status: string;
  reason: string;
  created_at: string;
};
type QueueItem = {
  id: string;
  project_id: string;
  output_id: string;
  organization_id: string;
  status: 'submitted' | 'under_review' | 'verified' | 'rejected' | 'revoked';
  output_title: string;
  output_type: string;
  output_abstract: string;
  doi: string;
  resource_url: string;
  submitter_name: string;
  submitted_by_id: string;
  reviewer_id: string | null;
  consented_at: string;
  events: VerificationEvent[];
};
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export default function ResearchReviewScreen() {
  const api = useNexoraApi();
  const { organization } = useOrganization();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organization) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<QueueItem[]>(
        '/api/v1/research/organizations/' + organization.id + '/verifications/',
      );
      const result = payload<QueueItem[]>(response);
      setItems(Array.isArray(result) ? result : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tidak dapat memuat antrian verifikasi.');
    } finally {
      setLoading(false);
    }
  }, [api, organization]);

  useEffect(() => { void load(); }, [load]);

  const transition = useCallback(async (
    item: QueueItem,
    status: 'under_review' | 'verified' | 'rejected' | 'revoked',
  ) => {
    const reason = (reasonDrafts[item.id] ?? '').trim();
    if ((status === 'rejected' || status === 'revoked') && !reason) {
      setError(status === 'rejected'
        ? 'Alasan penolakan wajib diisi.'
        : 'Alasan pencabutan verifikasi wajib diisi.');
      return;
    }
    setBusyId(item.id);
    setError(null);
    setNotice(null);
    try {
      await api.request(
        '/api/v1/research/projects/' + item.project_id + '/outputs/' + item.output_id
          + '/verification/' + item.id + '/transition/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, reason }),
        },
      );
      setNotice('Status verifikasi diperbarui: ' + status.replaceAll('_', ' ') + '.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui verifikasi.');
    } finally {
      setBusyId(null);
    }
  }, [api, load, reasonDrafts]);

  return <Screen>
    <Pressable onPress={() => router.back()} style={styles.back}>
      <Ionicons name="chevron-back" size={18} color={colors.primary} />
      <Text style={styles.backText}>Research</Text>
    </Pressable>
    <Text style={styles.eyebrow}>DIGNITY RESEARCH</Text>
    <Text style={styles.title}>Verification workspace</Text>
    <Text style={styles.subtitle}>
      Tinjau hanya luaran yang pemiliknya secara eksplisit bagikan kepada organisasi aktif. Izin reviewer divalidasi ulang oleh server pada setiap tindakan.
    </Text>
    <SurfaceCard style={styles.context}>
      <Ionicons name="business-outline" size={18} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>{organization?.name ?? 'Belum ada organisasi aktif'}</Text>
        <Text style={styles.detail}>Keanggotaan saja tidak cukup. Akun harus memiliki izin research.evidence.verify.</Text>
      </View>
    </SurfaceCard>
    <Pressable onPress={() => router.push('/assessment-workspace')} style={styles.assessmentLink}>
      <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>Competency assessment workspace</Text>
        <Text style={styles.detail}>Gunakan rubrik untuk menilai outcome kompetensi peserta</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>

    <View style={styles.section}>
      <SectionHeading title="Kasus verifikasi" subtitle={items.length + ' kasus yang dapat ditindaklanjuti oleh akun ini'} />
      {loading ? <SurfaceCard><Text style={styles.detail}>Memuat antrian…</Text></SurfaceCard> : null}
      {!loading && !error && items.length === 0 ? (
        <SurfaceCard style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
          <Text style={styles.cardTitle}>Tidak ada kasus untuk ditinjau</Text>
          <Text style={styles.detail}>Pengajuan baru akan muncul setelah pemilik menyetujui pembagian luaran kepada organisasi ini.</Text>
        </SurfaceCard>
      ) : null}
      {items.map((item) => (
        <SurfaceCard key={item.id} style={styles.item}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.submitter}>{item.submitter_name || 'Dignity member'}</Text>
              <Text style={styles.cardTitle}>{item.output_title}</Text>
              <Text style={styles.detail}>{item.output_type} · status {item.status.replaceAll('_', ' ')}</Text>
            </View>
            <Text style={styles.status}>{item.status.replaceAll('_', ' ')}</Text>
          </View>
          {item.output_abstract ? <Text style={styles.abstract}>{item.output_abstract}</Text> : null}
          {item.doi ? <Text style={styles.meta}>DOI · {item.doi}</Text> : null}
          {item.resource_url ? <Text style={styles.link} selectable>{item.resource_url}</Text> : null}
          <Text style={styles.meta}>Disetujui untuk dibagikan {new Date(item.consented_at).toLocaleDateString()}</Text>
          <View style={styles.history}>
            <Text style={styles.historyTitle}>Riwayat audit</Text>
            {item.events.map((event) => (
              <View key={event.id} style={styles.event}>
                <Text style={styles.eventStatus}>{event.to_status.replaceAll('_', ' ')}</Text>
                <Text style={styles.meta}>{new Date(event.created_at).toLocaleString()}</Text>
                {event.reason ? <Text style={styles.meta}>{event.reason}</Text> : null}
              </View>
            ))}
          </View>
          {item.status === 'submitted' ? (
            <Pressable disabled={busyId === item.id} onPress={() => void transition(item, 'under_review')} style={[styles.primaryButton, busyId === item.id && styles.disabled]}>
              <Text style={styles.primaryText}>{busyId === item.id ? 'Memproses…' : 'Ambil untuk ditinjau'}</Text>
            </Pressable>
          ) : null}
          {item.status === 'under_review' ? (
            <View style={styles.decisionArea}>
              <Text style={styles.fieldLabel}>Catatan keputusan (wajib untuk penolakan)</Text>
              <TextInput
                value={reasonDrafts[item.id] ?? ''}
                onChangeText={(value) => setReasonDrafts((current) => ({ ...current, [item.id]: value }))}
                placeholder="Tuliskan alasan atau catatan review"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={styles.input}
              />
              <View style={styles.actions}>
                <Pressable disabled={busyId === item.id} onPress={() => void transition(item, 'rejected')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Tolak</Text>
                </Pressable>
                <Pressable disabled={busyId === item.id} onPress={() => void transition(item, 'verified')} style={styles.primaryButton}>
                  <Text style={styles.primaryText}>Verifikasi</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {item.status === 'verified' ? (
            <View style={styles.decisionArea}>
              <Text style={styles.fieldLabel}>Alasan pencabutan (wajib)</Text>
              <TextInput
                value={reasonDrafts[item.id] ?? ''}
                onChangeText={(value) => setReasonDrafts((current) => ({ ...current, [item.id]: value }))}
                placeholder="Mis. sumber publikasi menarik kembali bukti"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={styles.input}
              />
              <Pressable disabled={busyId === item.id} onPress={() => void transition(item, 'revoked')} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Cabut verifikasi</Text>
              </Pressable>
            </View>
          ) : null}
        </SurfaceCard>
      ))}
    </View>
    {error ? <Pressable onPress={() => void load()} style={styles.error}><Text style={styles.errorText}>{error} · Ketuk untuk mencoba lagi</Text></Pressable> : null}
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
  assessmentLink: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: '900', marginTop: 4 },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  section: { marginTop: spacing.section },
  empty: { alignItems: 'center', gap: 7, paddingVertical: 24 },
  item: { marginBottom: spacing.md, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  submitter: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  status: { color: colors.primaryDark, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '900', textTransform: 'capitalize' },
  abstract: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 4 },
  meta: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  link: { color: colors.primaryDark, fontSize: 10, marginTop: 4 },
  history: { backgroundColor: colors.surfaceMuted, borderRadius: radius.small, padding: 10, marginTop: 5 },
  historyTitle: { color: colors.ink, fontSize: 10, fontWeight: '900', marginBottom: 5 },
  event: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 6, marginTop: 5 },
  eventStatus: { color: colors.primaryDark, fontSize: 9, fontWeight: '900', textTransform: 'capitalize' },
  decisionArea: { marginTop: 8, gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  input: { minHeight: 72, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: 10, color: colors.ink, fontSize: 11, backgroundColor: colors.background },
  actions: { flexDirection: 'row', gap: 8 },
  primaryButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.pill, backgroundColor: colors.primaryDark, marginTop: 7 },
  primaryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  secondaryButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, marginTop: 7 },
  secondaryText: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  error: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 12 },
  errorText: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  notice: { color: colors.success, fontSize: 11, marginTop: 12 },
});
