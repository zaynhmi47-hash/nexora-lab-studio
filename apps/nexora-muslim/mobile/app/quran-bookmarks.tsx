import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockQuran, nexoraCoreQuranRepository, type Bookmark, type QuranPage, type QuranPort } from '@/lib/quran';

export default function QuranBookmarksScreen() {
  const { session } = useAuth();
  const { refresh: refreshAppState } = useAppState();
  const repository = useMemo<QuranPort>(() => session?.user.provider === 'firebase' ? nexoraCoreQuranRepository(session) : mockQuran, [session]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [pages, setPages] = useState<Record<string, QuranPage>>({});

  async function load() {
    const saved = await repository.listBookmarks();
    setBookmarks(saved);
    const entries = await Promise.all(saved.map(async (bookmark) => [`${bookmark.surahNumber}:${bookmark.ayahNumber}`, await repository.getSurah(bookmark.surahNumber)] as const));
    setPages(Object.fromEntries(entries.filter(([, page]) => page !== null)) as Record<string, QuranPage>);
  }

  useEffect(() => { void load(); }, [repository]);

  async function remove(bookmarkId: string) {
    await repository.removeBookmark(bookmarkId);
    await load();
    await refreshAppState();
  }

  return (
    <Screen><ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>‹ Back to Quran</Text></Pressable>
      <Text style={styles.eyebrow}>SAVED AYAH</Text><Text style={styles.heading}>Bookmarks</Text><Text style={styles.subtitle}>Your saved reading points.</Text>
      {bookmarks.length === 0 ? <Card style={styles.emptyCard}><Ionicons name="bookmark-outline" size={32} color={colors.primary} /><Text style={styles.emptyTitle}>No bookmarks yet</Text><Text style={styles.muted}>Save an ayah from the Quran reader and it will appear here.</Text></Card> : bookmarks.map((bookmark) => {
        const page = pages[`${bookmark.surahNumber}:${bookmark.ayahNumber}`]; const ayah = page?.ayahs.find((item) => item.numberInSurah === bookmark.ayahNumber);
        return <Card key={bookmark.id} style={styles.card}><View style={styles.row}><View style={styles.copy}><Text style={styles.surah}>{page?.surah.name ?? `Surah ${bookmark.surahNumber}`}</Text><Text style={styles.meta}>Ayah {bookmark.ayahNumber}</Text></View><Pressable onPress={() => void remove(bookmark.id)} accessibilityLabel="Remove bookmark"><Ionicons name="bookmark" size={22} color={colors.primary} /></Pressable></View>{ayah && <Text style={styles.arabic}>{ayah.arabicText}</Text>}{ayah?.translation && <Text style={styles.translation}>{ayah.translation}</Text>}</Card>;
      })}
    </ScrollView></Screen>
  );
}

const styles = StyleSheet.create({container:{paddingBottom:spacing.xxl},back:{color:colors.primary,fontWeight:'800',marginBottom:spacing.xl},eyebrow:{fontSize:typography.small,fontWeight:'800',color:colors.primary},heading:{fontSize:typography.title,fontWeight:'900',color:colors.text,marginTop:spacing.xs},subtitle:{color:colors.textMuted,marginTop:spacing.xs},emptyCard:{marginTop:spacing.xl,alignItems:'center',padding:spacing.xl},emptyTitle:{color:colors.text,fontSize:19,fontWeight:'900',marginTop:spacing.md},muted:{color:colors.textMuted,lineHeight:21,textAlign:'center',marginTop:spacing.xs},card:{marginTop:spacing.md},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},copy:{flex:1},surah:{color:colors.text,fontSize:17,fontWeight:'900'},meta:{color:colors.textMuted,marginTop:3,fontSize:typography.caption},arabic:{color:colors.text,textAlign:'right',fontSize:24,lineHeight:44,marginTop:spacing.lg},translation:{color:colors.textMuted,lineHeight:22,marginTop:spacing.md}});
