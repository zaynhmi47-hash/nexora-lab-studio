import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette } from '@/constants/theme';
import {
  extractCreatorManuscript,
  importCreatorManuscriptChapters,
  type ManuscriptChapterProposal,
} from '@/services/uploads';

export default function ManuscriptImportScreen() {
  const { id, assetId } = useLocalSearchParams<{ id: string; assetId: string }>();
  const [filename, setFilename] = useState('');
  const [format, setFormat] = useState('');
  const [chapters, setChapters] = useState<ManuscriptChapterProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await extractCreatorManuscript(assetId);
        if (!active) return;
        setFilename(result.filename);
        setFormat(result.format);
        setChapters(result.proposals);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Manuskrip gagal diekstrak.');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (assetId) void load();
    return () => { active = false; };
  }, [assetId]);

  const updateChapter = (index: number, field: 'title' | 'content', value: string) => {
    setChapters(current => current.map((chapter, position) =>
      position === index ? { ...chapter, [field]: value, characters: field === 'content' ? value.length : chapter.characters } : chapter,
    ));
  };

  const moveChapter = (index: number, offset: number) => {
    setChapters(current => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((chapter, position) => ({ ...chapter, number: position + 1 }));
    });
  };

  const removeChapter = (index: number) => {
    setChapters(current => current.filter((_, position) => position !== index)
      .map((chapter, position) => ({ ...chapter, number: position + 1 })));
  };

  const saveDrafts = async () => {
    if (!chapters.length || chapters.some(chapter => !chapter.title.trim() || !chapter.content.trim())) {
      setError('Setiap bab harus memiliki judul dan isi. Hapus bagian kosong atau lengkapi dahulu.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await importCreatorManuscriptChapters(
        assetId,
        chapters.map(({ title, content }) => ({ title: title.trim(), content: content.trim() })),
      );
      setNotice(result.alreadyImported
        ? 'Bab dari manuskrip ini sebelumnya sudah disimpan. Tidak ada duplikasi.'
        : result.items.length + ' bab berhasil disimpan sebagai draf.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bab gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={18} color={palette.ink} />
        <Text style={s.backText}>Kembali ke Upload Center</Text>
      </Pressable>
      <Text style={s.kicker}>NEXVERSE · MANUSCRIPT STUDIO</Text>
      <Text style={s.title}>Tinjau struktur bab</Text>
      <Text style={s.subtitle}>Periksa hasil ekstraksi, perbaiki judul dan isi, atur urutan, atau hapus bagian yang tidak diperlukan sebelum menyimpannya ke editor karya.</Text>

      {loading ? (
        <View style={s.loading}><ActivityIndicator color={palette.green} /><Text style={s.muted}>Membaca manuskrip dan menyusun usulan bab…</Text></View>
      ) : error && chapters.length === 0 ? (
        <View style={s.noticeError}><Text style={s.errorText}>{error}</Text></View>
      ) : (
        <>
          <View style={s.summary}>
            <Ionicons name="document-text-outline" size={22} color={palette.green} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.summaryTitle}>{filename}</Text>
              <Text style={s.muted}>{format} · {chapters.length} usulan bab · belum disimpan</Text>
            </View>
          </View>

          {chapters.map((chapter, index) => (
            <View key={index} style={s.chapterCard}>
              <View style={s.chapterHeader}>
                <Text style={s.chapterNumber}>BAB {index + 1}</Text>
                <View style={s.actions}>
                  <Pressable disabled={index === 0} onPress={() => moveChapter(index, -1)} style={s.iconButton}>
                    <Ionicons name="arrow-up" size={16} color={index === 0 ? palette.line : palette.ink} />
                  </Pressable>
                  <Pressable disabled={index === chapters.length - 1} onPress={() => moveChapter(index, 1)} style={s.iconButton}>
                    <Ionicons name="arrow-down" size={16} color={index === chapters.length - 1 ? palette.line : palette.ink} />
                  </Pressable>
                  <Pressable onPress={() => removeChapter(index)} style={s.iconButton}>
                    <Ionicons name="trash-outline" size={16} color="#A34E42" />
                  </Pressable>
                </View>
              </View>
              <Text style={s.fieldLabel}>Judul bab</Text>
              <TextInput
                value={chapter.title}
                onChangeText={value => updateChapter(index, 'title', value)}
                maxLength={255}
                placeholder="Judul bab"
                style={s.titleInput}
              />
              <View style={s.bodyHeader}>
                <Text style={s.fieldLabel}>Isi bab</Text>
                <Text style={s.counter}>{chapter.content.length.toLocaleString('id-ID')} karakter</Text>
              </View>
              <TextInput
                value={chapter.content}
                onChangeText={value => updateChapter(index, 'content', value)}
                multiline
                textAlignVertical="top"
                style={s.contentInput}
                placeholder="Isi bab…"
              />
            </View>
          ))}

          {chapters.length === 0 ? <Text style={s.muted}>Semua usulan bab dihapus. Kembali dan ekstrak ulang jika diperlukan.</Text> : null}
          {error ? <View style={s.noticeError}><Text style={s.errorText}>{error}</Text></View> : null}
          {notice ? <View style={s.noticeSuccess}><Ionicons name="checkmark-circle" size={18} color={palette.green} /><Text style={s.successText}>{notice}</Text></View> : null}
          <Pressable disabled={saving || chapters.length === 0} onPress={() => void saveDrafts()} style={[s.saveButton, (saving || chapters.length === 0) && s.disabled]}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={18} color="#FFFFFF" />}
            <Text style={s.saveText}>{saving ? 'Menyimpan bab…' : 'Simpan semua sebagai draf'}</Text>
          </Pressable>
          <Text style={s.footnote}>Penyimpanan hanya membuat bab berstatus draf. Konten tidak diterbitkan, tidak dibuka untuk pembaca, dan tetap dapat diedit melalui editor karya.</Text>
          <Pressable onPress={() => router.replace('/creator/works/' + id)} style={s.editorLink}>
            <Text style={s.editorLinkText}>Buka editor karya</Text>
            <Ionicons name="arrow-forward" size={15} color={palette.green} />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 18, paddingBottom: 42, gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  backText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  kicker: { color: palette.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 27, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  loading: { padding: 28, alignItems: 'center', gap: 10 },
  muted: { color: palette.muted, fontSize: 10, lineHeight: 16 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 13, backgroundColor: palette.mint },
  summaryTitle: { color: palette.greenDark, fontSize: 12, fontWeight: '900' },
  chapterCard: { padding: 13, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, gap: 8 },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chapterNumber: { color: palette.green, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 5 },
  iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: palette.paper },
  fieldLabel: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  titleInput: { minHeight: 42, borderWidth: 1, borderColor: palette.line, borderRadius: 9, paddingHorizontal: 10, color: palette.ink, fontSize: 12, backgroundColor: palette.paper },
  bodyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { color: palette.muted, fontSize: 9 },
  contentInput: { minHeight: 190, borderWidth: 1, borderColor: palette.line, borderRadius: 9, padding: 10, color: palette.ink, fontSize: 11, lineHeight: 18, backgroundColor: palette.paper },
  noticeError: { padding: 12, borderRadius: 10, backgroundColor: palette.rose },
  errorText: { color: '#8E443A', fontSize: 11, lineHeight: 16 },
  noticeSuccess: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: palette.mint },
  successText: { flex: 1, color: palette.greenDark, fontSize: 11, lineHeight: 16 },
  saveButton: { minHeight: 48, borderRadius: 11, backgroundColor: palette.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  saveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  footnote: { color: palette.muted, fontSize: 10, lineHeight: 16 },
  editorLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 },
  editorLinkText: { color: palette.green, fontSize: 11, fontWeight: '900' },
});
