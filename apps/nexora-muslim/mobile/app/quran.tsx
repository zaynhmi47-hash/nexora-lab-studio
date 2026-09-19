import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockQuran, nexoraCoreQuranRepository, type Bookmark, type QuranPage, type QuranPort, type ReadingPosition, type Recitation, type SurahSummary } from '@/lib/quran';

export default function QuranScreen() {
  const { session } = useAuth();
  const { refresh: refreshAppState } = useAppState();
  const repository = useMemo<QuranPort>(() => session?.user.provider === 'firebase' ? nexoraCoreQuranRepository(session) : mockQuran, [session]);
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [page, setPage] = useState<QuranPage | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readingPosition, setReadingPosition] = useState<ReadingPosition | null>(null);
  const [showSurahs, setShowSurahs] = useState(false);
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  async function load() {
    const [nextSurahs, position, saved, nextRecitations] = await Promise.all([repository.listSurahs(), repository.getReadingPosition(), repository.listBookmarks(), repository.listRecitations()]);
    const nextPage = await repository.getSurah(position?.surahNumber ?? 2);
    setSurahs(nextSurahs); setReadingPosition(position); setBookmarks(saved); setPage(nextPage); setRecitations(nextRecitations); setSelectedRecitation(nextRecitations[0] ?? null);
  }

  useEffect(() => { void load(); return () => { if (sound) void sound.unloadAsync(); }; }, [repository]);

  const ayah = page?.ayahs.find((item) => item.numberInSurah === readingPosition?.ayahNumber) ?? page?.ayahs[0];
  const isBookmarked = ayah ? bookmarks.some((item) => item.surahNumber === ayah.surahNumber && item.ayahNumber === ayah.numberInSurah) : false;

  async function toggleBookmark() {
    if (!ayah) return;
    const existing = bookmarks.find((item) => item.surahNumber === ayah.surahNumber && item.ayahNumber === ayah.numberInSurah);
    if (existing) await repository.removeBookmark(existing.id);
    else await repository.saveBookmark({ id: `${ayah.surahNumber}:${ayah.numberInSurah}`, surahNumber: ayah.surahNumber, ayahNumber: ayah.numberInSurah, createdAt: new Date().toISOString() });
    setBookmarks(await repository.listBookmarks());
    await refreshAppState();
  }

  async function openSurah(surah: SurahSummary) {
    const next = await repository.getSurah(surah.number);
    if (!next) return;
    setPage(next);
    const firstAyah = next.ayahs[0];
    if (firstAyah) {
      const position = { surahNumber: surah.number, ayahNumber: firstAyah.numberInSurah, updatedAt: new Date().toISOString() };
      await repository.saveReadingPosition(position); setReadingPosition(position); await refreshAppState();
    }
    setShowSurahs(false);
  }

  async function togglePlayback() {
    if (!selectedRecitation?.audioUrl) return;
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
          setPlaying(false);
        } else {
          await sound.playAsync();
          setPlaying(true);
        }
        return;
      }
    }
    const { sound: nextSound } = await Audio.Sound.createAsync(
      { uri: selectedRecitation.audioUrl },
      { shouldPlay: true },
      (status) => {
        if (!status.isLoaded) return;
        setPlaying(status.isPlaying);
      },
    );
    setSound(nextSound);
    setPlaying(true);
  }

  async function stopPlayback() {
    if (!sound) return;
    await sound.stopAsync();
    setPlaying(false);
  }

  async function saveCurrentPosition() {
    if (!ayah) return;
    const position = { surahNumber: ayah.surahNumber, ayahNumber: ayah.numberInSurah, updatedAt: new Date().toISOString() };
    await repository.saveReadingPosition(position); setReadingPosition(position); await refreshAppState();
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>AL-QURAN</Text>
        <View style={styles.headerRow}><View style={styles.headerCopy}><Text style={styles.heading}>Quran Reader</Text><Text style={styles.subtitle}>Read, reflect, and continue your journey.</Text></View><Pressable style={styles.iconButton} onPress={() => setShowSurahs((value) => !value)} accessibilityLabel="Open surah list"><Ionicons name="list-outline" size={22} color={colors.primary} /></Pressable></View>
        <Card style={styles.readerCard}>
          <View style={styles.readerTop}><View><Text style={styles.surah}>{page?.surah.name ?? 'Loading…'}</Text><Text style={styles.meta}>{page?.surah.number ?? '—'} · Ayah {ayah?.numberInSurah ?? '—'}</Text></View><Pressable onPress={toggleBookmark} accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark ayah'}><Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={23} color={colors.primary} /></Pressable></View>
          {ayah ? <><Text style={styles.arabic}>{ayah.arabicText}</Text><View style={styles.divider} /><Text style={styles.translation}>{ayah.translation}</Text><View style={styles.readerActions}><Pressable style={styles.action} onPress={() => void saveCurrentPosition()}><Ionicons name="location-outline" size={21} color={colors.primary} /><Text style={styles.actionText}>Save position</Text></Pressable><Pressable style={styles.action} onPress={toggleBookmark}><Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} /><Text style={styles.actionText}>{isBookmarked ? 'Saved' : 'Save'}</Text></Pressable></View></> : <Text style={styles.empty}>No Quran content is available for this surah in the current dataset.</Text>}
        </Card>
        {showSurahs && <Card style={styles.surahListCard}><Text style={styles.sectionTitle}>Surahs</Text>{surahs.map((surah) => <Pressable key={surah.number} style={styles.surahRow} onPress={() => void openSurah(surah)}><View style={styles.number}><Text style={styles.numberText}>{surah.number}</Text></View><View style={styles.surahInfo}><Text style={styles.surahName}>{surah.name}</Text><Text style={styles.meta}>{surah.revelationPlace === 'makkah' ? 'Makkah' : 'Madinah'} · {surah.ayahCount} ayahs</Text></View><Text style={styles.arabicName}>{surah.arabicName}</Text></Pressable>)}</Card>}
                <Card style={styles.audioCard}>
          <View style={styles.audioHeader}>
            <View style={styles.itemBody}>
              <Text style={styles.sectionTitle}>Quran Audio</Text>
              <Text style={styles.meta}>{selectedRecitation?.name ?? 'No recitation configured'}</Text>
            </View>
            <Ionicons name="volume-high-outline" size={23} color={colors.primary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recitationRow}>
            {recitations.map((item) => (
              <Pressable key={item.id} onPress={() => setSelectedRecitation(item)} style={[styles.recitationChip, selectedRecitation?.id === item.id && styles.recitationChipActive]}>
                <Text style={[styles.recitationText, selectedRecitation?.id === item.id && styles.recitationTextActive]}>{item.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.playerRow}>
            <Pressable style={styles.playButton} onPress={() => void togglePlayback()} disabled={!selectedRecitation?.audioUrl}>
              <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.white} />
              <Text style={styles.playText}>{playing ? 'Pause' : 'Play'}</Text>
            </Pressable>
            <Pressable style={styles.stopButton} onPress={() => void stopPlayback()} disabled={!sound}>
              <Ionicons name="stop" size={18} color={colors.primary} />
              <Text style={styles.stopText}>Stop</Text>
            </Pressable>
          </View>
          {!selectedRecitation?.audioUrl && <Text style={styles.audioNote}>Audio source is not configured yet. Add a verified recitation URL before production use.</Text>}
        </Card>

<Text style={styles.sectionHeading}>Explore</Text>
        <Pressable style={styles.item} onPress={() => setShowSurahs(true)}><View style={styles.itemIcon}><Ionicons name="book-outline" size={21} color={colors.primary} /></View><View style={styles.itemBody}><Text style={styles.itemText}>Surah</Text><Text style={styles.itemDescription}>Browse the Quran</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>
        <Pressable style={styles.item} onPress={() => router.push('/quran-bookmarks')}><View style={styles.itemIcon}><Ionicons name="bookmark-outline" size={21} color={colors.primary} /></View><View style={styles.itemBody}><Text style={styles.itemText}>Bookmarks</Text><Text style={styles.itemDescription}>{bookmarks.length} saved</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container:{paddingBottom:spacing.xxl},eyebrow:{fontSize:typography.small,fontWeight:'800',color:colors.primary},headerRow:{marginTop:spacing.xs,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},headerCopy:{flex:1,paddingRight:spacing.md},heading:{fontSize:typography.title,fontWeight:'800',color:colors.text},subtitle:{marginTop:spacing.xs,color:colors.textMuted},iconButton:{width:46,height:46,borderRadius:radius.md,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},readerCard:{marginTop:spacing.lg,padding:spacing.xl},readerTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},surah:{fontSize:typography.heading,fontWeight:'800',color:colors.text},meta:{marginTop:spacing.xs,color:colors.textMuted,fontSize:typography.caption},arabic:{fontSize:28,lineHeight:52,textAlign:'right',marginTop:spacing.xxl,color:colors.text},divider:{height:1,backgroundColor:colors.border,marginVertical:spacing.lg},translation:{lineHeight:24,color:colors.textMuted,fontSize:typography.body},readerActions:{flexDirection:'row',marginTop:spacing.xl,gap:spacing.sm},action:{flexDirection:'row',alignItems:'center',gap:spacing.xs,backgroundColor:colors.surfaceMuted,paddingVertical:10,paddingHorizontal:spacing.md,borderRadius:radius.pill},actionText:{color:colors.primaryDark,fontWeight:'700'},empty:{color:colors.textMuted,lineHeight:22,marginTop:spacing.lg},surahListCard:{marginTop:spacing.md},sectionTitle:{fontSize:typography.heading,fontWeight:'800',color:colors.text,marginBottom:spacing.sm},surahRow:{flexDirection:'row',alignItems:'center',paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},number:{width:36,height:36,borderRadius:radius.sm,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},numberText:{color:colors.primaryDark,fontWeight:'800'},surahInfo:{flex:1,marginLeft:spacing.md},surahName:{fontWeight:'800',color:colors.text},arabicName:{color:colors.text,fontSize:17},sectionHeading:{fontSize:typography.heading,fontWeight:'800',color:colors.text,marginTop:spacing.xxl,marginBottom:spacing.md},item:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,padding:spacing.md,borderRadius:radius.md,marginBottom:spacing.sm,flexDirection:'row',alignItems:'center'},itemIcon:{width:40,height:40,borderRadius:radius.sm,backgroundColor:colors.surfaceMuted,alignItems:'center',justifyContent:'center'},itemBody:{flex:1,marginLeft:spacing.md},itemText:{fontWeight:'800',color:colors.text},itemDescription:{marginTop:2,color:colors.textMuted,fontSize:typography.caption}
});
