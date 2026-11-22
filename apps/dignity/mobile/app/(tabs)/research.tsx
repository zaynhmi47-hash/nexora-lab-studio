import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Project = {
  id: string; title: string; abstract: string; research_question: string;
  field_of_study: string; methodology: string; status: string; visibility: string;
};
type Output = { id: string; title: string; output_type: string; status: string; provenance_status: string };
type Contribution = { id: string; contributor_name: string; role: string; contribution_type: string; attribution_status: string };
type VerificationEvent = { id: string; from_status: string; to_status: string; reason: string; created_at: string };
type Verification = { id: string; organization_id: string; status: string; reviewer_id: string | null; decision_reason: string; events: VerificationEvent[]; created_at: string };
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) return (response as { data: T }).data;
  return response as T;
}

export default function ResearchScreen() {
  const api = useNexoraApi();
  const { organization } = useOrganization();
  const [projects, setProjects] = useState<Project[]>([]);
  const [outputs, setOutputs] = useState<Record<string, Output[]>>({});
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [verifications, setVerifications] = useState<Record<string, Verification[]>>({});
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [field, setField] = useState('');
  const [methodology, setMethodology] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingOutput, setEditingOutput] = useState<{ projectId: string; id: string } | null>(null);
  const [editingContribution, setEditingContribution] = useState<{ projectId: string; id: string } | null>(null);
  const [outputEditDraft, setOutputEditDraft] = useState('');
  const [contributionEditDraft, setContributionEditDraft] = useState('');
  const [outputDraft, setOutputDraft] = useState<Record<string, string>>({});
  const [contributorDraft, setContributorDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.request<Project[]>('/api/v1/research/projects/');
      const next = payload<Project[]>(response);
      const rows = Array.isArray(next) ? next : [];
      setProjects(rows);
      const details = await Promise.all(rows.map(async (project) => {
        const [out, people] = await Promise.all([
          api.request<Output[]>(`/api/v1/research/projects/${project.id}/outputs/`),
          api.request<Contribution[]>(`/api/v1/research/projects/${project.id}/contributions/`),
        ]);
        return [project.id, payload<Output[]>(out), payload<Contribution[]>(people)] as const;
      }));
      setOutputs(Object.fromEntries(details.map(([id, out]) => [id, Array.isArray(out) ? out : []])));
      setContributions(Object.fromEntries(details.map(([id, , people]) => [id, Array.isArray(people) ? people : []])));
      const verificationRows = await Promise.all(details.flatMap(([projectId, rows]) => rows.map(async (item) => {
        const response = await api.request<Verification[]>('/api/v1/research/projects/' + projectId + '/outputs/' + item.id + '/verification/');
        const result = payload<Verification[]>(response);
        return [item.id, Array.isArray(result) ? result : []] as const;
      })));
      setVerifications(Object.fromEntries(verificationRows));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tidak dapat memuat data penelitian.');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const createProject = useCallback(async () => {
    if (!title.trim()) { setError('Judul penelitian wajib diisi.'); return; }
    setSaving(true); setError(null); setNotice(null);
    try {
      await api.request(editingProjectId ? '/api/v1/research/projects/' + editingProjectId + '/' : '/api/v1/research/projects/', {
        method: editingProjectId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), research_question: question.trim(), field_of_study: field.trim(), methodology: methodology.trim() }),
      });
      setTitle(''); setQuestion(''); setField(''); setMethodology(''); setEditingProjectId(null);
      setNotice(editingProjectId ? 'Perubahan proyek berhasil disimpan.' : 'Proyek penelitian tersimpan sebagai catatan privat.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menyimpan penelitian.'); }
    finally { setSaving(false); }
  }, [api, editingProjectId, field, load, methodology, question, title]);

  const addOutput = useCallback(async (projectId: string) => {
    const outputTitle = (outputDraft[projectId] ?? '').trim();
    if (!outputTitle) { setError('Judul luaran penelitian wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      await api.request(`/api/v1/research/projects/${projectId}/outputs/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: outputTitle, output_type: 'report', status: 'draft' }),
      });
      setOutputDraft((current) => ({ ...current, [projectId]: '' }));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menambah luaran.'); }
    finally { setSaving(false); }
  }, [api, load, outputDraft]);

  const addContribution = useCallback(async (projectId: string) => {
    const name = (contributorDraft[projectId] ?? '').trim();
    if (!name) { setError('Nama kontributor wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      await api.request(`/api/v1/research/projects/${projectId}/contributions/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributor_name: name, contribution_type: 'other' }),
      });
      setContributorDraft((current) => ({ ...current, [projectId]: '' }));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menambah kontributor.'); }
    finally { setSaving(false); }
  }, [api, contributorDraft, load]);


  const submitVerification = useCallback((projectId: string, outputId: string, outputTitle: string) => {
    if (!organization) { setError('Pilih organisasi aktif terlebih dahulu untuk mengajukan verifikasi.'); return; }
    Alert.alert(
      'Bagikan bukti untuk verifikasi?',
      'Judul luaran “' + outputTitle + '” dan informasi pendukungnya akan dibagikan kepada ' + organization.name + '. Organisasi tidak memperoleh akses ke jurnal pribadi atau data Grow lainnya.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Setuju & ajukan', onPress: () => {
          void (async () => {
            setSaving(true); setError(null); setNotice(null);
            try {
              await api.request('/api/v1/research/projects/' + projectId + '/outputs/' + outputId + '/verification/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organization_id: organization.id, consent: true }),
              });
              setNotice('Bukti berhasil diajukan. Organisasi hanya dapat meninjau luaran yang kamu setujui untuk dibagikan.');
              await load();
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal mengajukan verifikasi.'); }
            finally { setSaving(false); }
          })();
        } },
      ],
    );
  }, [api, load, organization]);
  const withdrawVerification = useCallback((projectId: string, outputId: string, verificationId: string) => {
    Alert.alert(
      'Cabut persetujuan berbagi?',
      'Organisasi tidak lagi dapat melanjutkan peninjauan bukti ini. Riwayat audit tetap disimpan.',
      [
        { text: 'Kembali', style: 'cancel' },
        { text: 'Cabut persetujuan', style: 'destructive', onPress: () => {
          void (async () => {
            setSaving(true); setError(null);
            try {
              await api.request('/api/v1/research/projects/' + projectId + '/outputs/' + outputId + '/verification/' + verificationId + '/transition/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'revoked', reason: 'Pemilik menarik persetujuan berbagi bukti kepada organisasi.' }),
              });
              setNotice('Persetujuan dicabut. Riwayat verifikasi tetap tersedia bagi pemilik.');
              await load();
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal mencabut persetujuan.'); }
            finally { setSaving(false); }
          })();
        } },
      ],
    );
  }, [api, load]);
  const startProjectEdit = useCallback((project: Project) => {
    setEditingProjectId(project.id); setTitle(project.title); setQuestion(project.research_question ?? '');
    setField(project.field_of_study ?? ''); setMethodology(project.methodology ?? '');
    setNotice('Mode edit proyek aktif.');
  }, []);


  const saveOutputEdit = useCallback(async () => {
    if (!editingOutput || !outputEditDraft.trim()) { setError('Judul luaran wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      await api.request('/api/v1/research/projects/' + editingOutput.projectId + '/outputs/' + editingOutput.id + '/', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: outputEditDraft.trim() }),
      });
      setEditingOutput(null); setOutputEditDraft(''); setNotice('Luaran penelitian diperbarui.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal memperbarui luaran.'); }
    finally { setSaving(false); }
  }, [api, editingOutput, load, outputEditDraft]);

  const saveContributionEdit = useCallback(async () => {
    if (!editingContribution || !contributionEditDraft.trim()) { setError('Nama kontributor wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      await api.request('/api/v1/research/projects/' + editingContribution.projectId + '/contributions/' + editingContribution.id + '/', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributor_name: contributionEditDraft.trim() }),
      });
      setEditingContribution(null); setContributionEditDraft(''); setNotice('Nama kontributor diperbarui.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal memperbarui kontributor.'); }
    finally { setSaving(false); }
  }, [api, contributionEditDraft, editingContribution, load]);

  const removeProject = useCallback(async (projectId: string) => {
    setSaving(true); setError(null);
    try { await api.request(`/api/v1/research/projects/${projectId}/`, { method: 'DELETE' }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menghapus proyek penelitian.'); }
    finally { setSaving(false); }
  }, [api, load]);

  const removeOutput = useCallback(async (projectId: string, outputId: string) => {
    setSaving(true); setError(null);
    try { await api.request(`/api/v1/research/projects/${projectId}/outputs/${outputId}/`, { method: 'DELETE' }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menghapus luaran.'); }
    finally { setSaving(false); }
  }, [api, load]);

  const removeContribution = useCallback(async (projectId: string, contributionId: string) => {
    setSaving(true); setError(null);
    try { await api.request(`/api/v1/research/projects/${projectId}/contributions/${contributionId}/`, { method: 'DELETE' }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menghapus kontribusi.'); }
    finally { setSaving(false); }
  }, [api, load]);

  return <Screen>
    <Text style={styles.eyebrow}>DIGNITY RESEARCH</Text>
    <Text style={styles.title}>Explore questions. Create knowledge.</Text>
    <Text style={styles.subtitle}>Bangun rekam jejak penelitian, kontribusi, dan luaran ilmiah dalam satu ruang yang terstruktur.</Text>
    <Pressable onPress={() => router.push('/research-review')} style={styles.reviewQueue}><Ionicons name="shield-checkmark-outline" size={16} color={colors.primaryDark} /><Text style={styles.reviewQueueText}>Antrian verifikasi organisasi</Text></Pressable>
    <SurfaceCard style={styles.privacy}>
      <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>Penelitian privat secara default</Text>
        <Text style={styles.detail}>Catatan proyek dan atribusi kontributor adalah laporan mandiri. Dignity tidak mengesahkan kepengarangan atau status publikasi secara otomatis.</Text>
      </View>
    </SurfaceCard>
    <SurfaceCard style={styles.form}>
      <SectionHeading title={editingProjectId ? "Edit proyek penelitian" : "Mulai proyek penelitian"} subtitle="Pertanyaan penelitian, bidang, dan metode dapat disempurnakan nanti." />
      <TextInput value={title} onChangeText={setTitle} placeholder="Judul penelitian" placeholderTextColor={colors.muted} style={styles.input} />
      <TextInput value={question} onChangeText={setQuestion} placeholder="Pertanyaan penelitian" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.multiline]} />
      <TextInput value={field} onChangeText={setField} placeholder="Bidang studi · mis. Pendidikan" placeholderTextColor={colors.muted} style={styles.input} />
      <TextInput value={methodology} onChangeText={setMethodology} placeholder="Metodologi · opsional" placeholderTextColor={colors.muted} style={styles.input} />
      <Pressable disabled={saving} onPress={() => void createProject()} style={[styles.save, saving && styles.disabled]}>
        <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{saving ? 'Menyimpan…' : editingProjectId ? 'Simpan perubahan' : 'Simpan proyek'}</Text>
      </Pressable>
    </SurfaceCard>
    {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    {error ? <Pressable onPress={() => void load()} style={styles.error}><Text style={styles.errorText}>{error} · Ketuk untuk memuat ulang</Text></Pressable> : null}
    <View style={styles.section}>
      <SectionHeading title="Ruang penelitian" subtitle={`${projects.length} proyek · hanya pemilik yang dapat mengakses`} />
      {loading ? <SurfaceCard><Text style={styles.detail}>Memuat proyek penelitian…</Text></SurfaceCard> : null}
      {!loading && projects.length === 0 ? <SurfaceCard><Text style={styles.detail}>Belum ada proyek penelitian. Mulai dari pertanyaan yang ingin kamu jawab.</Text></SurfaceCard> : null}
      {projects.map((project) => <SurfaceCard key={project.id} style={styles.project}>
        <View style={styles.projectHeader}>
          <View style={styles.flex}><Text style={styles.cardTitle}>{project.title}</Text><Text style={styles.meta}>{project.field_of_study || 'Bidang belum ditentukan'} · {project.methodology || 'Metode belum ditentukan'}</Text></View>
          <Text style={styles.pill}>{project.status.replaceAll('_', ' ')}</Text>
        </View>
        {project.research_question ? <Text style={styles.detail}>Pertanyaan · {project.research_question}</Text> : null}
        <Text style={styles.privateLabel}>Privat · laporan mandiri</Text>
        <View style={styles.actionRow}><Pressable disabled={saving} onPress={() => startProjectEdit(project)}><Text style={styles.actionText}>Edit proyek</Text></Pressable><Pressable disabled={saving} onPress={() => void removeProject(project.id)}><Text style={styles.deleteText}>Hapus proyek</Text></Pressable></View>
        <View style={styles.subsection}>
          <Text style={styles.subheading}>Luaran penelitian ({outputs[project.id]?.length ?? 0})</Text>
          {(outputs[project.id] ?? []).map((item) => <View key={item.id} style={styles.record}>
            <Text style={styles.recordTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.output_type} · {item.status} · {item.provenance_status}</Text>
            {(() => {
              const cases = verifications[item.id] ?? [];
              const latest = cases[0];
              return (
                <View style={styles.verificationPanel}>
                  <Text style={styles.verificationStatus}>Verifikasi · {latest?.status ?? 'belum diajukan'}</Text>
                  {latest?.events?.slice(-3).map((event) => <Text key={event.id} style={styles.verificationEvent}>{event.to_status} · {new Date(event.created_at).toLocaleDateString()}</Text>)}
                  {latest?.decision_reason ? <Text style={styles.meta}>Catatan reviewer · {latest.decision_reason}</Text> : null}
                  {latest && ['submitted', 'under_review', 'verified'].includes(latest.status) ? (
                    <Pressable disabled={saving} onPress={() => withdrawVerification(project.id, item.id, latest.id)} style={[styles.secondary, saving && styles.disabled]}>
                      <Text style={styles.secondaryText}>Cabut persetujuan berbagi</Text>
                    </Pressable>
                  ) : (
                    <Pressable disabled={saving || !organization} onPress={() => submitVerification(project.id, item.id, item.title)} style={[styles.secondary, (!organization || saving) && styles.disabled]}>
                      <Text style={styles.secondaryText}>{organization ? 'Ajukan ke ' + organization.name : 'Pilih organisasi untuk verifikasi'}</Text>
                    </Pressable>
                  )}
                  <Text style={styles.meta}>Pengajuan membagikan luaran ini saja, bukan seluruh profil atau jurnal pribadi.</Text>
                </View>
              );
            })()}
            {editingOutput?.id === item.id ? <View style={styles.inlineEditor}><TextInput value={outputEditDraft} onChangeText={setOutputEditDraft} style={styles.input} placeholder="Judul luaran" placeholderTextColor={colors.muted} /><View style={styles.actionRow}><Pressable disabled={saving} onPress={() => void saveOutputEdit()}><Text style={styles.actionText}>Simpan</Text></Pressable><Pressable onPress={() => setEditingOutput(null)}><Text style={styles.deleteText}>Batal</Text></Pressable></View></View> : <View style={styles.actionRow}><Pressable onPress={() => { setEditingOutput({ projectId: project.id, id: item.id }); setOutputEditDraft(item.title); }}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable disabled={saving} onPress={() => void removeOutput(project.id, item.id)}><Text style={styles.deleteText}>Hapus luaran</Text></Pressable></View>}
          </View>)}
          <TextInput value={outputDraft[project.id] ?? ''} onChangeText={(value) => setOutputDraft((current) => ({ ...current, [project.id]: value }))} placeholder="Judul luaran / laporan" placeholderTextColor={colors.muted} style={styles.input} />
          <Pressable onPress={() => void addOutput(project.id)} disabled={saving} style={styles.secondary}><Text style={styles.secondaryText}>Tambah luaran sebagai draft</Text></Pressable>
        </View>
        <View style={styles.subsection}>
          <Text style={styles.subheading}>Kontribusi ({contributions[project.id]?.length ?? 0})</Text>
          {(contributions[project.id] ?? []).map((person) => <View key={person.id} style={styles.record}>
            <Text style={styles.recordTitle}>{person.contributor_name}{person.role ? ` · ${person.role}` : ''}</Text>
            <Text style={styles.meta}>Atribusi · {person.attribution_status}</Text>
            {editingContribution?.id === person.id ? <View style={styles.inlineEditor}><TextInput value={contributionEditDraft} onChangeText={setContributionEditDraft} style={styles.input} placeholder="Nama kontributor" placeholderTextColor={colors.muted} /><View style={styles.actionRow}><Pressable disabled={saving} onPress={() => void saveContributionEdit()}><Text style={styles.actionText}>Simpan</Text></Pressable><Pressable onPress={() => setEditingContribution(null)}><Text style={styles.deleteText}>Batal</Text></Pressable></View></View> : <View style={styles.actionRow}><Pressable onPress={() => { setEditingContribution({ projectId: project.id, id: person.id }); setContributionEditDraft(person.contributor_name); }}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable disabled={saving} onPress={() => void removeContribution(project.id, person.id)}><Text style={styles.deleteText}>Hapus kontributor</Text></Pressable></View>}
          </View>)}
          <TextInput value={contributorDraft[project.id] ?? ''} onChangeText={(value) => setContributorDraft((current) => ({ ...current, [project.id]: value }))} placeholder="Nama kontributor" placeholderTextColor={colors.muted} style={styles.input} />
          <Pressable onPress={() => void addContribution(project.id)} disabled={saving} style={styles.secondary}><Text style={styles.secondaryText}>Catat kontributor</Text></Pressable>
        </View>
      </SurfaceCard>)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 26, lineHeight: 33, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  privacy: { flexDirection: 'row', gap: 10, backgroundColor: colors.primarySoft },
  reviewQueue: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 9, marginBottom: spacing.md },
  reviewQueueText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  verificationPanel: { marginTop: 8, padding: 9, borderRadius: radius.small, backgroundColor: colors.surfaceMuted, gap: 5 },
  verificationStatus: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  verificationEvent: { color: colors.muted, fontSize: 9 },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  form: { marginTop: spacing.lg, gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, paddingHorizontal: 12, paddingVertical: 11, color: colors.ink, fontSize: 12 },
  multiline: { minHeight: 68, textAlignVertical: 'top' },
  save: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 12 },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  notice: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', marginTop: 10 },
  error: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 10 },
  errorText: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  section: { marginTop: spacing.section },
  project: { marginBottom: spacing.md },
  projectHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pill: { color: colors.primaryDark, fontSize: 9, fontWeight: '900', backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, textTransform: 'capitalize' },
  meta: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  privateLabel: { color: colors.primaryDark, fontSize: 9, fontWeight: '900', marginTop: 9 },
  subsection: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 12, paddingTop: 11, gap: 7 },
  subheading: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  record: { backgroundColor: colors.surfaceMuted, borderRadius: radius.small, padding: 9 },
  recordTitle: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  secondary: { alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  secondaryText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  deleteAction: { alignSelf: 'flex-start', marginTop: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  inlineEditor: { marginTop: 8, gap: 5 },
  actionText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' },
  deleteText: { color: colors.danger, fontSize: 9, fontWeight: '900' },
});
