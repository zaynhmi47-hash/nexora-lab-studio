import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Experience = {
  id: string;
  role_title: string;
  organization_name: string;
  employment_type: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description?: string;
};
type Project = {
  id: string;
  title: string;
  summary: string;
  role: string;
  skills: string[];
  status: string;
  visibility: string;
  artifact_url?: string;
};
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export default function CareerScreen() {
  const api = useNexoraApi();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mode, setMode] = useState<'experience' | 'project'>('experience');
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [projectSkills, setProjectSkills] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [experienceResponse, projectResponse] = await Promise.all([
        api.request<Experience[]>('/api/v1/career/experiences/'),
        api.request<Project[]>('/api/v1/career/projects/'),
      ]);
      const nextExperiences = payload<Experience[]>(experienceResponse);
      const nextProjects = payload<Project[]>(projectResponse);
      setExperiences(Array.isArray(nextExperiences) ? nextExperiences : []);
      setProjects(Array.isArray(nextProjects) ? nextProjects : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load career records.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'experience') {
        if (!role.trim() || !organization.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          throw new Error('Isi posisi, organisasi, dan tanggal mulai dengan format YYYY-MM-DD.');
        }
        await api.request(editingExperienceId ? `/api/v1/career/experiences/${editingExperienceId}/` : '/api/v1/career/experiences/', {
          method: editingExperienceId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role_title: role.trim(),
            organization_name: organization.trim(),
            employment_type: 'other',
            start_date: startDate,
            is_current: true,
          }),
        });
        setRole('');
        setOrganization('');
        setStartDate('');
        setEditingExperienceId(null);
        setNotice('Pengalaman profesional tersimpan sebagai laporan pribadi.');
      } else {
        if (!projectTitle.trim()) throw new Error('Judul proyek wajib diisi.');
        await api.request(editingProjectId ? `/api/v1/career/projects/${editingProjectId}/` : '/api/v1/career/projects/', {
          method: editingProjectId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: projectTitle.trim(),
            summary: projectSummary.trim(),
            skills: projectSkills.split(',').map((item) => item.trim()).filter(Boolean),
          }),
        });
        setProjectTitle('');
        setProjectSummary('');
        setProjectSkills('');
        setEditingProjectId(null);
        setNotice('Proyek portofolio tersimpan.');
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save career record.');
    } finally {
      setSaving(false);
    }
  }, [api, editingExperienceId, editingProjectId, load, mode, organization, projectSkills, projectSummary, projectTitle, role, startDate]);


  const editExperience = useCallback((item: Experience) => {
    setMode('experience'); setEditingExperienceId(item.id); setEditingProjectId(null);
    setRole(item.role_title); setOrganization(item.organization_name); setStartDate(item.start_date);
    setNotice('Mode edit pengalaman aktif. Simpan perubahan melalui tombol di bawah.');
  }, []);

  const editProject = useCallback((item: Project) => {
    setMode('project'); setEditingProjectId(item.id); setEditingExperienceId(null);
    setProjectTitle(item.title); setProjectSummary(item.summary); setProjectSkills(item.skills.join(', '));
    setNotice('Mode edit proyek aktif. Simpan perubahan melalui tombol di bawah.');
  }, []);

  const removeExperience = useCallback(async (id: string) => {
    setSaving(true); setError(null);
    try { await api.request(`/api/v1/career/experiences/${id}/`, { method: 'DELETE' }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menghapus pengalaman.'); }
    finally { setSaving(false); }
  }, [api, load]);

  const removeProject = useCallback(async (id: string) => {
    setSaving(true); setError(null);
    try { await api.request(`/api/v1/career/projects/${id}/`, { method: 'DELETE' }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menghapus proyek.'); }
    finally { setSaving(false); }
  }, [api, load]);

  return <Screen>
    <Text style={styles.eyebrow}>DIGNITY CAREER</Text>
    <Text style={styles.title}>Turn capability into opportunity.</Text>
    <Text style={styles.subtitle}>Catat pengalaman profesional dan proyek yang membuktikan proses belajar serta kontribusimu.</Text>

    <SurfaceCard style={styles.privacy}>
      <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>Portofolio privat secara default</Text>
        <Text style={styles.detail}>Data ini hanya terlihat oleh akunmu. Menambahkan pengalaman bukan berarti mendapat verifikasi atau sertifikasi otomatis.</Text>
      </View>
    </SurfaceCard>

    <View style={styles.switcher}>
      <Pressable onPress={() => setMode('experience')} style={[styles.switch, mode === 'experience' && styles.switchActive]}>
        <Text style={[styles.switchText, mode === 'experience' && styles.switchTextActive]}>Pengalaman</Text>
      </Pressable>
      <Pressable onPress={() => setMode('project')} style={[styles.switch, mode === 'project' && styles.switchActive]}>
        <Text style={[styles.switchText, mode === 'project' && styles.switchTextActive]}>Proyek</Text>
      </Pressable>
    </View>

    <SurfaceCard style={styles.form}>
      <SectionHeading title={mode === 'experience' ? (editingExperienceId ? 'Edit pengalaman' : 'Tambah pengalaman') : (editingProjectId ? 'Edit proyek' : 'Tambah proyek')} subtitle={mode === 'experience' ? 'Riwayat pekerjaan, magang, freelance, atau kontribusi.' : 'Dokumentasikan karya dan keterampilan yang digunakan.'} />
      {mode === 'experience' ? <>
        <TextInput value={role} onChangeText={setRole} placeholder="Posisi / peran" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={organization} onChangeText={setOrganization} placeholder="Organisasi / perusahaan" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={startDate} onChangeText={setStartDate} placeholder="Tanggal mulai · YYYY-MM-DD" placeholderTextColor={colors.muted} style={styles.input} />
      </> : <>
        <TextInput value={projectTitle} onChangeText={setProjectTitle} placeholder="Nama proyek" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={projectSummary} onChangeText={setProjectSummary} placeholder="Ringkasan kontribusi dan hasil" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.multiline]} />
        <TextInput value={projectSkills} onChangeText={setProjectSkills} placeholder="Keterampilan · pisahkan dengan koma" placeholderTextColor={colors.muted} style={styles.input} />
      </>}
      <Pressable onPress={() => void save()} disabled={saving} style={[styles.save, saving && styles.disabled]}>
        <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" />
        <Text style={styles.saveText}>{saving ? 'Menyimpan…' : 'Simpan catatan'}</Text>
      </Pressable>
    </SurfaceCard>

    {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    {error ? <Pressable onPress={() => void load()} style={styles.error}><Text style={styles.errorText}>{error} · Coba muat ulang</Text></Pressable> : null}

    <View style={styles.section}>
      <SectionHeading title="Pengalaman profesional" subtitle={`${experiences.length} catatan · laporan pribadi`} />
      {loading ? <SurfaceCard><Text style={styles.detail}>Memuat pengalaman…</Text></SurfaceCard> : null}
      {!loading && experiences.length === 0 ? <SurfaceCard><Text style={styles.detail}>Belum ada pengalaman. Tambahkan pengalaman pertama di atas.</Text></SurfaceCard> : null}
      {experiences.map((item) => <SurfaceCard key={item.id} style={styles.record}>
        <Text style={styles.cardTitle}>{item.role_title}</Text>
        <Text style={styles.detail}>{item.organization_name} · {item.employment_type.replaceAll('_', ' ')}</Text>
        <Text style={styles.meta}>{item.start_date} — {item.is_current ? 'Sekarang' : item.end_date ?? 'Tanggal akhir tidak dicatat'}</Text>
        <Text style={styles.selfReported}>Laporan pribadi · belum diverifikasi</Text>
        <View style={styles.actions}><Pressable onPress={() => editExperience(item)}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable disabled={saving} onPress={() => void removeExperience(item.id)}><Text style={styles.deleteText}>Hapus</Text></Pressable></View>
      </SurfaceCard>)}
    </View>

    <View style={styles.section}>
      <SectionHeading title="Portofolio proyek" subtitle={`${projects.length} proyek · privat secara default`} />
      {!loading && projects.length === 0 ? <SurfaceCard><Text style={styles.detail}>Proyek yang kamu tambahkan akan muncul di sini.</Text></SurfaceCard> : null}
      {projects.map((item) => <SurfaceCard key={item.id} style={styles.record}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.summary ? <Text style={styles.detail}>{item.summary}</Text> : null}
        {item.skills.length ? <Text style={styles.meta}>Keterampilan · {item.skills.join(', ')}</Text> : null}
        <Text style={styles.selfReported}>Portofolio pribadi · {item.visibility}</Text>
        <View style={styles.actions}><Pressable onPress={() => editProject(item)}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable disabled={saving} onPress={() => void removeProject(item.id)}><Text style={styles.deleteText}>Hapus</Text></Pressable></View>
      </SurfaceCard>)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 26, lineHeight: 33, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  privacy: { flexDirection: 'row', gap: 10, backgroundColor: colors.primarySoft },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  switcher: { flexDirection: 'row', gap: 8, marginTop: spacing.lg },
  switch: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center' },
  switchActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  switchText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  switchTextActive: { color: colors.primaryDark },
  form: { marginTop: spacing.md, gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, paddingHorizontal: 12, paddingVertical: 11, color: colors.ink, fontSize: 12 },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  save: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 12, marginTop: 3 },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  notice: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', marginTop: 10 },
  error: { backgroundColor: colors.roseSoft, borderRadius: radius.medium, padding: 11, marginTop: 10 },
  errorText: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  section: { marginTop: spacing.section },
  record: { marginBottom: spacing.sm },
  meta: { color: colors.muted, fontSize: 9, marginTop: 7 },
  selfReported: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  actionText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  deleteText: { color: colors.danger, fontSize: 10, fontWeight: '900' },
});
