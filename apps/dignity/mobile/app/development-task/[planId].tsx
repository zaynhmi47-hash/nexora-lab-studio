import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type TaskStatus = 'not_started' | 'in_progress' | 'pending_review' | 'completed';
interface Task {
  id: string; title: string; description: string; status: TaskStatus;
  dueDate: string | null; evidenceCount: number; sortOrder?: number;
}
interface Evidence {
  id: string; evidenceType: string; title: string; description: string; artifactUrl: string;
}
function payload<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
}
const statuses: TaskStatus[] = ['not_started', 'in_progress', 'pending_review', 'completed'];
const statusLabel: Record<TaskStatus, string> = {
  not_started: 'Not started', in_progress: 'In progress',
  pending_review: 'Pending review', completed: 'Completed',
};

export default function DevelopmentTaskScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const api = useNexoraApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidence, setEvidence] = useState<Record<string, Evidence[]>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<string, { title: string; description: string; url: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!planId) return;
    setLoading(true); setError(null);
    try {
      const response = await api.request<Task[]>('/api/v1/learning/development-plans/' + planId + '/tasks/');
      const rows = payload<Task[]>(response);
      const next = Array.isArray(rows) ? rows : [];
      setTasks(next);
      const evidenceRows = await Promise.all(next.map(async (task) => {
        const result = await api.request<Evidence[]>('/api/v1/learning/development-tasks/' + task.id + '/evidence/');
        return [task.id, payload<Evidence[]>(result)] as const;
      }));
      setEvidence(Object.fromEntries(evidenceRows));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load execution tasks.');
    } finally { setLoading(false); }
  }, [api, planId]);

  useEffect(() => { void load(); }, [load]);

  const addTask = useCallback(async () => {
    if (!planId || !title.trim()) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      await api.request('/api/v1/learning/development-plans/' + planId + '/tasks/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), sortOrder: tasks.length, dueDate: dueDate.trim() || null }),
      });
      setTitle(''); setDescription(''); setDueDate(''); setNotice('Task added to your private development plan.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to add task.'); }
    finally { setSaving(false); }
  }, [api, description, load, planId, tasks.length, title]);

  const updateTask = useCallback(async (task: Task, status: TaskStatus) => {
    setError(null);
    try {
      await api.request('/api/v1/learning/development-tasks/' + task.id + '/', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update task.'); }
  }, [api, load]);

  const addEvidence = useCallback(async (task: Task) => {
    const draft = evidenceDrafts[task.id] ?? { title: '', description: '', url: '' };
    if (!draft.title.trim()) return;
    setError(null);
    try {
      await api.request('/api/v1/learning/development-tasks/' + task.id + '/evidence/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceType: 'practice', title: draft.title.trim(),
          description: draft.description.trim(), artifactUrl: draft.url.trim(),
        }),
      });
      setEvidenceDrafts((current) => ({ ...current, [task.id]: { title: '', description: '', url: '' } }));
      setNotice('Evidence saved privately. It does not change your assessed competency level.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save evidence.'); }
  }, [api, evidenceDrafts, load]);

  return <Screen>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
        <Text style={styles.backText}>Development plan</Text>
      </Pressable>
      <Text style={styles.eyebrow}>DIGNITY · EXECUTION</Text>
      <Text style={styles.title}>Practice tasks</Text>
      <Text style={styles.subtitle}>Break your development plan into concrete actions. Record evidence as you practice.</Text>
      <SurfaceCard style={styles.noticeCard}>
        <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Private evidence ledger</Text>
          <Text style={styles.detail}>Your task records and evidence are visible to you only. Submission does not verify mastery or share data with an institution.</Text>
        </View>
      </SurfaceCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.sectionTitle}>Add an execution task</Text>
      <SurfaceCard style={styles.form}>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Build a prototype" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={description} onChangeText={setDescription} multiline placeholder="Describe what you will do and what success looks like" placeholderTextColor={colors.muted} style={[styles.input, styles.multiline]} />
        <TextInput value={dueDate} onChangeText={setDueDate} placeholder="Due date · YYYY-MM-DD (optional)" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable disabled={!title.trim() || saving} onPress={() => void addTask()} style={[styles.submit, (!title.trim() || saving) && styles.disabled]}>
          <Text style={styles.submitText}>{saving ? 'Saving…' : 'Add task'}</Text>
        </Pressable>
      </SurfaceCard>
      <Text style={styles.sectionTitle}>Execution checklist</Text>
      {loading ? <Text style={styles.detail}>Loading tasks…</Text> : tasks.length === 0 ? <SurfaceCard><Text style={styles.detail}>No tasks yet. Add your first practical step above.</Text></SurfaceCard> : tasks.map((task) => {
        const draft = evidenceDrafts[task.id] ?? { title: '', description: '', url: '' };
        return <SurfaceCard key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{task.title}</Text>
              {task.description ? <Text style={styles.detail}>{task.description}</Text> : null}
            </View>
            <Text style={styles.count}>{evidence[task.id]?.length ?? task.evidenceCount} evidence</Text>
          </View>
          {task.dueDate ? <Text style={styles.detail}>Due: {task.dueDate}</Text> : null}
          <View style={styles.statusOptions}>
            {statuses.map((status) => <Pressable key={status} onPress={() => void updateTask(task, status)} style={[styles.statusButton, task.status === status && styles.statusSelected]}>
              <Text style={[styles.statusText, task.status === status && styles.statusSelectedText]}>{statusLabel[status]}</Text>
            </Pressable>)}
          </View>
          <Text style={styles.label}>Add practice evidence</Text>
          <TextInput value={draft.title} onChangeText={(value) => setEvidenceDrafts((current) => ({ ...current, [task.id]: { ...draft, title: value } }))} placeholder="Evidence title" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={draft.description} onChangeText={(value) => setEvidenceDrafts((current) => ({ ...current, [task.id]: { ...draft, description: value } }))} placeholder="What did you make, try or learn?" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={draft.url} onChangeText={(value) => setEvidenceDrafts((current) => ({ ...current, [task.id]: { ...draft, url: value } }))} autoCapitalize="none" keyboardType="url" placeholder="HTTPS artifact link (optional)" placeholderTextColor={colors.muted} style={styles.input} />
          <Pressable disabled={!draft.title.trim()} onPress={() => void addEvidence(task)} style={[styles.evidenceButton, !draft.title.trim() && styles.disabled]}>
            <Text style={styles.evidenceButtonText}>Save private evidence</Text>
          </Pressable>
          {(evidence[task.id] ?? []).map((item) => <View key={item.id} style={styles.evidenceItem}>
            <Text style={styles.evidenceTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.detail}>{item.description}</Text> : null}
            {item.artifactUrl ? <Text style={styles.detail}>{item.artifactUrl}</Text> : null}
          </View>)}
        </SurfaceCard>;
      })}
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
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: spacing.md },
  form: { gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, color: colors.ink, padding: spacing.md, fontSize: 14 },
  multiline: { minHeight: 78, textAlignVertical: 'top' },
  submit: { backgroundColor: colors.primary, borderRadius: radius.medium, padding: spacing.md, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  taskCard: { gap: spacing.sm },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  count: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  statusButton: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.small, padding: spacing.sm },
  statusText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statusSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusSelectedText: { color: '#FFFFFF' },
  label: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  evidenceButton: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.small, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  evidenceButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  evidenceItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm, gap: 2 },
  evidenceTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 13 },
  notice: { color: colors.success, fontSize: 13 },
});
