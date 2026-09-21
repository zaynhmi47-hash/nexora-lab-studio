import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockQuran, nexoraCoreQuranRepository, type Bookmark, type QuranPage, type QuranPort, type SurahSummary } from '@/lib/quran';

export default function QuranScreen() {
  const { session } = useAuth();
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [page, setPage] = useState<QuranPage | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showSurahs, setShowSurahs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyBookmarkId, setBusyBookmarkId] = useState<string | null>(null);

  const repository = useMemo<QuranPort>(() => {
    if (session?.user.provider === 'firebase') return nexoraCoreQuranRepository(session);
    return mockQuran;
  }, [session]);

  async function loadReader() {
    setLoading(true);
    setError(null);
    try {
      const [nextSurahs, nextPage, nextBookmarks] = await Promise.all([
        repository.listSurahs(),
        repository.getReadingPosition().then((position) => repository.getSurah(position?.surahNumber ?? 2)),
        repository.listBookmarks(),
      ]);
      setSurahs(nextSurahs);
      setPage(nextPage);
      setBookmarks(nextBookmarks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Quran reader could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReader();
  }, [repository]);

  async function toggleBookmark(ayah: QuranPage['ayahs'][number]) {
    const id = `${ayah.surahNumber}:${ayah.numberInSurah}`;
    setBusyBookmarkId(id);
    try {
      const saved = bookmarks.some(
        (item) => item.surahNumber === ayah.surahNumber && item.ayahNumber === ayah.numberInSurah,
      );
      if (saved) {
        await repository.removeBookmark(id);
      } else {
        await repository.saveBookmark({
          id,
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.numberInSurah,
          createdAt: new Date().toISOString(),
        });
      }
      setBookmarks(await repository.listBookmarks());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bookmark could not be updated.');
    } finally {
      setBusyBookmarkId(null);
    }
  }

  async function openSurah(surah: SurahSummary) {
    setLoading(true);
    setError(null);
    try {
      const next = await repository.getSurah(surah.number);
      if (!next) {
        setError('This surah is not available from the current Quran source.');
        return;
      }
      setPage(next);
      setShowSurahs(false);
      await repository.saveReadingPosition({
        surahNumber: surah.number,
        ayahNumber: next.ayahs[0]?.numberInSurah ?? 1,
        updatedAt: new Date().toISOString(),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Surah could not be opened.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>AL-QURAN</Text>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.heading}>Quran Reader</Text>
          <Text style={styles.subtitle}>Read, reflect, and continue your journey.</Text>
        </View>
        <Pressable
          style={styles.iconButton}
          onPress={() => setShowSurahs((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel="Open surah list"
        >
          <Ionicons name="list-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.primaryDark} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <Pressable style={styles.retryButton} onPress={() => void loadReader()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </Card>
      )}

      {showSurahs && (
        <Card style={styles.surahListCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Surahs</Text>
            <Text style={styles.meta}>{surahs.length} available</Text>
          </View>
          {surahs.map((surah) => (
            <Pressable
              key={surah.number}
              style={styles.surahRow}
              onPress={() => void openSurah(surah)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${surah.name}`}
            >
              <View style={styles.number}>
                <Text style={styles.numberText}>{surah.number}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>{surah.name}</Text>
                <Text style={styles.meta}>
                  {surah.revelationPlace === 'makkah' ? 'Makkah' : 'Madinah'} · {surah.ayahCount} ayahs
                </Text>
              </View>
              <Text style={styles.arabicName}>{surah.arabicName}</Text>
            </Pressable>
          ))}
        </Card>
      )}

      {loading ? (
        <Card style={styles.readerCard}>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.empty}>Loading verified Quran content…</Text>
          </View>
        </Card>
      ) : page ? (
        <Card style={styles.readerCard}>
          <View style={styles.readerTop}>
            <View>
              <Text style={styles.surah}>{page.surah.name}</Text>
              <Text style={styles.meta}>
                {page.surah.number} · {page.ayahs.length} ayahs loaded
              </Text>
            </View>
            <Ionicons name="book-outline" size={23} color={colors.primary} />
          </View>

          {page.ayahs.map((ayah) => {
            const id = `${ayah.surahNumber}:${ayah.numberInSurah}`;
            const isBookmarked = bookmarks.some(
              (item) => item.surahNumber === ayah.surahNumber && item.ayahNumber === ayah.numberInSurah,
            );
            return (
              <View key={id} style={styles.ayah}>
                <View style={styles.ayahHeader}>
                  <View style={styles.ayahNumber}>
                    <Text style={styles.ayahNumberText}>{ayah.numberInSurah}</Text>
                  </View>
                  <Pressable
                    onPress={() => void toggleBookmark(ayah)}
                    disabled={busyBookmarkId === id}
                    accessibilityRole="button"
                    accessibilityLabel={isBookmarked ? `Remove bookmark from ayah ${ayah.numberInSurah}` : `Bookmark ayah ${ayah.numberInSurah}`}
                  >
                    {busyBookmarkId === id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                </View>
                <Text style={styles.arabic}>{ayah.arabicText}</Text>
                {ayah.translation ? <Text style={styles.translation}>{ayah.translation}</Text> : null}
              </View>
            );
          })}

          <View style={styles.readerActions}>
            <Pressable
              style={styles.action}
              disabled
              accessibilityLabel="Audio recitation will be available when a verified audio provider is connected"
            >
              <Ionicons name="play-circle-outline" size={21} color={colors.textMuted} />
              <Text style={styles.disabledActionText}>Audio provider pending</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <Card style={styles.readerCard}>
          <Text style={styles.empty}>
            No Quran content is available from the configured source yet. The app will not substitute
            unverified text.
          </Text>
        </Card>
      )}

      <Text style={styles.sectionHeading}>Explore</Text>
      {[
        ['book-outline', 'Surah', 'Browse the verified Quran source'],
        ['bookmark-outline', 'Bookmarks', `${bookmarks.length} saved`],
        ['chatbox-ellipses-outline', 'Tafsir', 'Source-aware explanations'],
        ['headset-outline', 'Audio Recitations', 'Provider-ready audio layer'],
      ].map(([icon, title, description]) => (
        <Pressable
          key={title}
          style={styles.item}
          disabled={title !== 'Surah'}
          onPress={() => title === 'Surah' && setShowSurahs(true)}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          <View style={styles.itemIcon}>
            <Ionicons name={icon as never} size={21} color={title === 'Surah' ? colors.primary : colors.textMuted} />
          </View>
          <View style={styles.itemBody}>
            <Text style={styles.itemText}>{title}</Text>
            <Text style={styles.itemDescription}>{description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: typography.small, fontWeight: '800', color: colors.primary },
  headerRow: { marginTop: spacing.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  heading: { fontSize: typography.title, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted },
  iconButton: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  errorCard: { marginTop: spacing.md, backgroundColor: colors.primarySoft },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  errorText: { flex: 1, color: colors.primaryDark, lineHeight: 21 },
  retryButton: { alignSelf: 'flex-start', marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface },
  retryText: { color: colors.primaryDark, fontWeight: '800' },
  readerCard: { marginTop: spacing.lg, padding: spacing.xl },
  readerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  surah: { fontSize: typography.heading, fontWeight: '800', color: colors.text },
  meta: { marginTop: spacing.xs, color: colors.textMuted, fontSize: typography.caption },
  loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  empty: { color: colors.textMuted, lineHeight: 22 },
  ayah: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  ayahHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ayahNumber: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  ayahNumberText: { color: colors.primaryDark, fontWeight: '800' },
  arabic: { fontSize: 28, lineHeight: 54, textAlign: 'right', marginTop: spacing.lg, color: colors.text },
  translation: { marginTop: spacing.lg, lineHeight: 24, color: colors.textMuted, fontSize: typography.body },
  readerActions: { flexDirection: 'row', marginTop: spacing.xl },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surfaceMuted, paddingVertical: 10, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  disabledActionText: { color: colors.textMuted, fontWeight: '700' },
  surahListCard: { marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: typography.heading, fontWeight: '800', color: colors.text },
  surahRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  number: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.primaryDark, fontWeight: '800' },
  surahInfo: { flex: 1, marginLeft: spacing.md },
  surahName: { fontWeight: '800', color: colors.text },
  arabicName: { color: colors.text, fontSize: 17 },
  sectionHeading: { fontSize: typography.heading, fontWeight: '800', color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md },
  item: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, marginLeft: spacing.md },
  itemText: { fontWeight: '800', color: colors.text },
  itemDescription: { marginTop: 2, color: colors.textMuted, fontSize: typography.caption },
});
