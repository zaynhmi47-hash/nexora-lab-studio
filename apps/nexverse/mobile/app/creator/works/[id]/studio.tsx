import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette } from '@/constants/theme';
import {
  getCreatorWork,
  reorderCreatorChapters,
  updateCreatorChapter,
  type CreatorChapter,
  type CreatorWork,
} from '@/services/creator';

export default function ChapterStudioScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const [work, setWork] = useState<CreatorWork | null>(null);
  const [chapters, setChapters] = useState<CreatorChapter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(chapterId ?? null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [freePreview, setFreePreview] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const editable = work?.publicationStatus === 'draft'
    && (work.reviewStatus === 'draft' || work.reviewStatus === 'rejected');
  const selected = useMemo(
    () => chapters.find(chapter => chapter.id === selectedId) ?? null,
    [chapters, selectedId],
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await getCreatorWork(id);
      const nextChapters = result.chapters ?? [];
      setWork(result);
      setChapters(nextChapters);
      const nextSelected = nextChapters.some(chapter => chapter.id === chapterId)
        ? chapterId ?? null
        : nextChapters[0]?.id ?? null;
      setSelectedId(nextSelected);
      const active = nextChapters.find(chapter => chapter.id === nextSelected);
      setTitle(active?.title ?? '');
      setSummary(active?.summary ?? '');
      setContent(active?.content ?? '');
      setFreePreview(active?.freePreview ?? false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memuat naskah.');
    } finally {
      setLoading(false);
    }
  }, [id, chapterId]);

  useEffect(() => { void load(); }, [load]);

  const selectChapter = (chapter: CreatorChapter) => {
    setSelectedId(chapter.id);
    setTitle(chapter.title);
    setSummary(chapter.summary ?? '');
    setContent(chapter.content ?? '');
    setFreePreview(chapter.freePreview);
    setPreviewMode(false);
    setError('');
    setNotice('');
  };

  const saveChapter = async () => {
    if (!id || !selected || !title.trim() || !content.trim()) {
      setError('Judul dan isi bab tidak boleh kosong.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateCreatorChapter(id, selected.id, {
        title: title.trim(),
        summary: summary.trim(),
        content,
        freePreview,
      });
      setChapters(current => current.map(chapter => chapter.id === updated.id ? updated : chapter));
      setNotice('Perubahan bab tersimpan di server.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan bab.');
    } finally {
      setSaving(false);
    }
  };

  const moveChapter = async (index: number, direction: -1 | 1) => {
    if (!id || !editable || ordering) return;
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    const next = [...chapters];
    [next[index], next[target]] = [next[target], next[index]];
    setOrdering(true);
    setError('');
    setNotice('');
    try {
      const result = await reorderCreatorChapters(id, next.map(chapter => chapter.id));
      setChapters(result.items);
      setNotice('Urutan bab diperbarui.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Urutan bab gagal diperbarui.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={palette.green} /><Text style={s.muted}>Memuat Chapter Studio…</Text></View>;
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={18} color={palette.ink} />
        <Text style={s.backText}>Kembali ke karya</Text>
      </Pressable>
      <Text style={s.kicker}>NEXVERSE CREATOR TOOLS</Text>
      <Text style={s.title}>Chapter Studio</Text>
      <Text style={s.subtitle}>{work?.title ?? 'Manuscript editor'} · Kelola isi, urutan, dan pratinjau bab.</Text>

      {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
      {notice ? <View style={s.notice}><Ionicons name="checkmark-circle" size={16} color={palette.green} /><Text style={s.noticeText}>{notice}</Text></View> : null}

      <View style={s.layout}>
        <View style={s.sidebar}>
          <View style={s.sidebarHeader}>
            <Text style={s.sectionTitle}>Daftar bab</Text>
            <Text style={s.count}>{chapters.length}</Text>
          </View>
          {chapters.map((chapter, index) => (
            <View key={chapter.id} style={[s.chapterItem, selectedId === chapter.id && s.chapterSelected]}>
              <Pressable onPress={() => selectChapter(chapter)} style={s.chapterSelect}>
                <Text style={s.chapterNo}>BAB {chapter.number}</Text>
                <Text numberOfLines={2} style={s.chapterName}>{chapter.title}</Text>
                <Text style={s.chapterStatus}>{chapter.status === 'published' ? 'Terbit' : chapter.freePreview ? 'Pratinjau gratis' : 'Draf'}</Text>
              </Pressable>
              {editable ? (
                <View style={s.orderActions}>
                  <Pressable disabled={index === 0 || ordering} onPress={() => void moveChapter(index, -1)} style={s.orderButton}>
                    <Ionicons name="chevron-up" size={16} color={index === 0 ? palette.muted : palette.ink} />
                  </Pressable>
                  <Pressable disabled={index === chapters.length - 1 || ordering} onPress={() => void moveChapter(index, 1)} style={s.orderButton}>
                    <Ionicons name="chevron-down" size={16} color={index === chapters.length - 1 ? palette.muted : palette.ink} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
          {!chapters.length ? <Text style={s.muted}>Belum ada bab. Impor manuskrip atau tambahkan bab dari editor karya.</Text> : null}
          {ordering ? <Text style={s.muted}>Menyimpan urutan…</Text> : null}
        </View>

        <View style={s.editor}>
          {selected ? (
            <>
              <View style={s.editorHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionTitle}>Editor bab {selected.number}</Text>
                  <Text style={s.muted}>{content.length.toLocaleString('id-ID')} karakter · {content.trim() ? content.trim().split(/\s+/).length.toLocaleString('id-ID') : 0} kata</Text>
                </View>
                <Pressable onPress={() => setPreviewMode(value => !value)} style={s.previewToggle}>
                  <Ionicons name={previewMode ? 'create-outline' : 'eye-outline'} size={16} color={palette.green} />
                  <Text style={s.previewToggleText}>{previewMode ? 'Edit' : 'Pratinjau'}</Text>
                </Pressable>
              </View>
              {previewMode ? (
                <View style={s.readerPreview}>
                  <Text style={s.previewKicker}>NEXVERSE · {freePreview ? 'PRATINJAU GRATIS' : 'BAB PREMIUM'}</Text>
                  <Text style={s.previewTitle}>{title || 'Tanpa judul'}</Text>
                  {summary.trim() ? <Text style={s.previewSummary}>{summary}</Text> : null}
                  {content.split(/\n{2,}/).map(value => value.trim()).filter(Boolean).map((paragraph, index) => (
                    <Text key={index} style={s.previewParagraph}>{paragraph}</Text>
                  ))}
                  <Text style={s.previewEnd}>— Akhir pratinjau —</Text>
                </View>
              ) : (
                <>
                  <Text style={s.fieldLabel}>Judul bab</Text>
                  <TextInput editable={!!editable} value={title} onChangeText={setTitle} maxLength={255} style={s.titleInput} placeholder="Judul bab" />
                  <Text style={s.fieldLabel}>Ringkasan (opsional)</Text>
                  <TextInput editable={!!editable} value={summary} onChangeText={setSummary} maxLength={500} style={s.summaryInput} placeholder="Ringkasan singkat bab" />
                  <Text style={s.fieldLabel}>Isi naskah</Text>
                  <TextInput
                    editable={!!editable}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    style={s.contentInput}
                    placeholder="Tulis isi bab di sini…"
                  />
                  <View style={s.freePreviewRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.fieldLabel}>Bab pratinjau gratis</Text>
                      <Text style={s.muted}>Bab gratis dapat dibaca tanpa pembelian.</Text>
                    </View>
                    <Switch value={freePreview} onValueChange={setFreePreview} disabled={!editable} trackColor={{ true: palette.green }} />
                  </View>
                  {editable ? (
                    <Pressable disabled={saving} onPress={() => void saveChapter()} style={[s.saveButton, saving && s.disabled]}>
                      {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={17} color="#FFFFFF" />}
                      <Text style={s.saveText}>{saving ? 'Menyimpan…' : 'Simpan perubahan bab'}</Text>
                    </Pressable>
                  ) : (
                    <Text style={s.muted}>Bab terkunci karena karya sedang direview atau telah terbit. Workflow revisi akan disediakan terpisah.</Text>
                  )}
                </>
              )}
            </>
          ) : (
            <View style={s.emptyEditor}>
              <Ionicons name="book-outline" size={30} color={palette.muted} />
              <Text style={s.sectionTitle}>Pilih bab untuk mulai</Text>
              <Text style={s.muted}>Pilih bab dari daftar untuk mengedit atau melihat pratinjau.</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={s.footnote}>Pratinjau ini hanya untuk penulis dan belum dipublikasikan. Reader publik hanya dapat mengakses bab yang telah diterbitkan melalui proses editorial.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: palette.paper },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  backText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  kicker: { color: palette.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 27, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  layout: { gap: 12 },
  sidebar: { padding: 12, backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, gap: 8 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  count: { color: palette.green, fontSize: 12, fontWeight: '900' },
  chapterItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 8 },
  chapterSelected: { borderColor: palette.green, backgroundColor: palette.mint },
  chapterSelect: { flex: 1, gap: 3, padding: 3 },
  chapterNo: { color: palette.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  chapterName: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  chapterStatus: { color: palette.muted, fontSize: 9 },
  orderActions: { flexDirection: 'row', gap: 3 },
  orderButton: { width: 28, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: palette.surface },
  editor: { padding: 13, backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, gap: 9 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  previewToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: palette.mint },
  previewToggleText: { color: palette.greenDark, fontSize: 10, fontWeight: '900' },
  fieldLabel: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  titleInput: { minHeight: 43, borderWidth: 1, borderColor: palette.line, borderRadius: 9, paddingHorizontal: 10, color: palette.ink, backgroundColor: palette.paper, fontSize: 12 },
  summaryInput: { minHeight: 42, borderWidth: 1, borderColor: palette.line, borderRadius: 9, paddingHorizontal: 10, color: palette.ink, backgroundColor: palette.paper, fontSize: 11 },
  contentInput: { minHeight: 330, borderWidth: 1, borderColor: palette.line, borderRadius: 9, padding: 12, color: palette.ink, backgroundColor: palette.paper, fontSize: 12, lineHeight: 21 },
  freePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 9, backgroundColor: palette.paper },
  saveButton: { minHeight: 45, borderRadius: 10, backgroundColor: palette.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  readerPreview: { backgroundColor: '#FCFBF7', padding: 17, borderRadius: 10, minHeight: 300 },
  previewKicker: { color: palette.green, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  previewTitle: { color: '#35423B', fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  previewSummary: { color: '#78847E', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginVertical: 15 },
  previewParagraph: { color: '#35423B', fontSize: 13, lineHeight: 24, marginTop: 17 },
  previewEnd: { color: palette.green, fontSize: 11, textAlign: 'center', marginTop: 25 },
  emptyEditor: { alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 9 },
  muted: { color: palette.muted, fontSize: 10, lineHeight: 16 },
  errorBox: { padding: 11, borderRadius: 9, backgroundColor: palette.rose },
  errorText: { color: '#8E443A', fontSize: 10, lineHeight: 15 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 9, backgroundColor: palette.mint },
  noticeText: { color: palette.greenDark, fontSize: 10, flex: 1 },
  footnote: { color: palette.muted, fontSize: 9, lineHeight: 15 },
});
