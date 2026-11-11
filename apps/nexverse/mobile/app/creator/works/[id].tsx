import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  addCreatorChapter,
  deactivateCreatorChapterPrice,
  getCreatorChapterPrice,
  getCreatorWork,
  setCreatorChapterPrice,
  submitCreatorWork,
  type CreatorChapterPrice,
  type CreatorWork,
} from '@/services/creator';

export default function WorkEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [work, setWork] = useState<CreatorWork | null>(null);
  const [busy, setBusy] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [priceBusyId, setPriceBusyId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, CreatorChapterPrice>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [currencyDrafts, setCurrencyDrafts] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      const nextWork = await getCreatorWork(id);
      setWork(nextWork);
      const priceEntries = await Promise.all(
        (nextWork.chapters ?? [])
          .filter((chapter) => !chapter.freePreview)
          .map(async (chapter) => {
            try {
              return [chapter.id, await getCreatorChapterPrice(id, chapter.id)] as const;
            } catch {
              return [chapter.id, { isPriced: false, price: null }] as const;
            }
          }),
      );
      const nextPrices = Object.fromEntries(priceEntries);
      setPrices(nextPrices);
      setPriceDrafts(
        Object.fromEntries(
          priceEntries.map(([chapterId, value]) => [
            chapterId,
            value.price?.amountMinor?.toString() ?? '',
          ]),
        ),
      );
      setCurrencyDrafts(
        Object.fromEntries(
          priceEntries.map(([chapterId, value]) => [chapterId, value.price?.currency ?? 'IDR']),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat karya.');
    } finally {
      setBusy(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!work || !title.trim() || !content.trim()) {
      setError('Judul dan isi bab wajib diisi.');
      return;
    }
    setSaveBusy(true);
    setError('');
    try {
      await addCreatorChapter(work.id, {
        number: (work.chapters?.length ?? 0) + 1,
        title: title.trim(),
        summary,
        content,
        freePreview: preview,
      });
      setTitle('');
      setContent('');
      setSummary('');
      setPreview(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan bab.');
    } finally {
      setSaveBusy(false);
    }
  };

  const savePrice = async (chapterId: string) => {
    if (!work) return;
    const amountMinor = Number(priceDrafts[chapterId]);
    const currency = (currencyDrafts[chapterId] ?? 'IDR').trim().toUpperCase();
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      setError('Harga harus berupa bilangan bulat positif dalam satuan minor mata uang.');
      return;
    }
    setPriceBusyId(chapterId);
    setError('');
    try {
      const result = await setCreatorChapterPrice(work.id, chapterId, {
        amountMinor,
        currency,
      });
      setPrices((current) => ({ ...current, [chapterId]: result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan harga.');
    } finally {
      setPriceBusyId(null);
    }
  };

  const removePrice = async (chapterId: string) => {
    if (!work) return;
    setPriceBusyId(chapterId);
    setError('');
    try {
      await deactivateCreatorChapterPrice(work.id, chapterId);
      setPrices((current) => ({
        ...current,
        [chapterId]: { isPriced: false, price: current[chapterId]?.price ?? null },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menonaktifkan harga.');
    } finally {
      setPriceBusyId(null);
    }
  };

  const submit = () => {
    if (!work) return;
    Alert.alert('Kirim untuk review?', 'Naskah akan dikunci sampai keputusan editorial.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Kirim',
        onPress: () => {
          void (async () => {
            setSaveBusy(true);
            try {
              await submitCreatorWork(work.id);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Pengajuan gagal.');
            } finally {
              setSaveBusy(false);
            }
          })();
        },
      },
    ]);
  };

  if (busy) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={palette.green} />
      </View>
    );
  }
  if (!work) {
    return (
      <View style={s.center}>
        <Text>{error || 'Karya tidak ditemukan.'}</Text>
      </View>
    );
  }

  const editable = work.reviewStatus === 'draft' || work.reviewStatus === 'rejected';

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={18} color={palette.ink} />
        <Text>Creator Studio</Text>
      </Pressable>
      <Text style={s.title}>{work.title}</Text>
      <Text style={s.muted}>
        Review: {work.reviewStatus} · Publikasi: {work.publicationStatus}
      </Text>
      {work.reviewNote ? <Text style={s.note}>Catatan editor: {work.reviewNote}</Text> : null}

      <Text style={s.heading}>Bab ({work.chapters?.length ?? 0})</Text>
      {work.chapters?.map((chapter) => {
        const chapterPrice = prices[chapter.id];
        const isPriceBusy = priceBusyId === chapter.id;
        return (
          <View key={chapter.id} style={s.card}>
            <Text style={s.chapter}>
              {chapter.number}. {chapter.title}
            </Text>
            <Text style={s.muted}>{chapter.freePreview ? 'Pratinjau gratis' : 'Bab premium'}</Text>
            {!chapter.freePreview ? (
              <View style={s.priceEditor}>
                <Text style={s.priceLabel}>
                  {chapterPrice?.isPriced && chapterPrice.price
                    ? `Harga aktif: ${chapterPrice.price.currency} ${chapterPrice.price.amountMinor.toLocaleString('id-ID')}`
                    : 'Belum memiliki harga aktif'}
                </Text>
                <View style={s.priceFields}>
                  <TextInput
                    value={priceDrafts[chapter.id] ?? ''}
                    onChangeText={(value) =>
                      setPriceDrafts((current) => ({ ...current, [chapter.id]: value }))
                    }
                    keyboardType="number-pad"
                    style={[s.input, s.amountInput]}
                    placeholder="Nominal"
                  />
                  <TextInput
                    value={currencyDrafts[chapter.id] ?? 'IDR'}
                    onChangeText={(value) =>
                      setCurrencyDrafts((current) => ({ ...current, [chapter.id]: value }))
                    }
                    autoCapitalize="characters"
                    maxLength={3}
                    style={[s.input, s.currencyInput]}
                    placeholder="IDR"
                  />
                </View>
                <Pressable
                  disabled={isPriceBusy}
                  onPress={() => void savePrice(chapter.id)}
                  style={s.secondary}
                >
                  {isPriceBusy ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={s.secondaryText}>Simpan harga</Text>
                  )}
                </Pressable>
                {chapterPrice?.isPriced ? (
                  <Pressable
                    disabled={isPriceBusy}
                    onPress={() => void removePrice(chapter.id)}
                    style={s.removePrice}
                  >
                    <Text style={s.removePriceText}>Nonaktifkan harga</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {editable ? (
        <>
          <Text style={s.heading}>Tambah bab</Text>
          <TextInput value={title} onChangeText={setTitle} style={s.input} placeholder="Judul bab" />
          <TextInput
            value={summary}
            onChangeText={setSummary}
            style={s.input}
            placeholder="Ringkasan"
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            style={[s.input, s.body]}
            placeholder="Isi bab..."
            textAlignVertical="top"
          />
          <View style={s.switch}>
            <Text>Bab pratinjau gratis</Text>
            <Switch value={preview} onValueChange={setPreview} />
          </View>
          <Pressable disabled={saveBusy} onPress={() => void add()} style={s.secondary}>
            {saveBusy ? <ActivityIndicator /> : <Text style={s.secondaryText}>Simpan bab</Text>}
          </Pressable>
          <Pressable
            disabled={saveBusy || !(work.chapters?.length)}
            onPress={submit}
            style={s.primary}
          >
            <Text style={s.primaryText}>Kirim ke editorial</Text>
          </Pressable>
        </>
      ) : (
        <Text style={s.note}>
          Naskah sedang direview atau sudah terbit; pengeditan isi ditutup sampai workflow revisi
          tersedia. Harga bab premium tetap dapat dikelola.
        </Text>
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 20, gap: 11, paddingBottom: 45 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: palette.ink, fontSize: 24, fontWeight: '900' },
  heading: { color: palette.ink, fontSize: 17, fontWeight: '900', marginTop: 12 },
  muted: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  note: {
    backgroundColor: palette.mint,
    padding: 12,
    borderRadius: 10,
    color: palette.greenDark,
    fontSize: 11,
  },
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 11,
    padding: 13,
    gap: 8,
  },
  chapter: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  priceEditor: { gap: 8, marginTop: 4 },
  priceLabel: { color: palette.ink, fontSize: 11, fontWeight: '700' },
  priceFields: { flexDirection: 'row', gap: 8 },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    padding: 12,
    color: palette.ink,
    backgroundColor: palette.surface,
  },
  amountInput: { flex: 1 },
  currencyInput: { width: 82 },
  body: { minHeight: 190, textAlignVertical: 'top' },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    padding: 12,
    borderRadius: 10,
  },
  secondary: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.green,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: palette.green, fontWeight: '800' },
  removePrice: { alignItems: 'center', paddingVertical: 7 },
  removePriceText: { color: '#9A594B', fontSize: 11, fontWeight: '700' },
  primary: {
    minHeight: 46,
    backgroundColor: palette.green,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '900' },
  error: { color: '#9A594B', fontSize: 11 },
});
