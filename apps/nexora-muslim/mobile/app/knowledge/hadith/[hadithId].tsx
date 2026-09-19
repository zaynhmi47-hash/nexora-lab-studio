import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockKnowledgeProvider, nexoraCoreKnowledgeProvider, type HadithItem } from '@/lib/knowledge';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function HadithDetailScreen() {
  const { hadithId } = useLocalSearchParams<{ hadithId: string }>();
  const { session } = useAuth();
  const [item, setItem] = useState<HadithItem | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!hadithId) return;
    const provider = session?.user.provider === 'firebase' ? nexoraCoreKnowledgeProvider(session) : mockKnowledgeProvider;
    void Promise.all([provider.getHadith(hadithId), provider.listHadithFavorites()]).then(([nextItem, favorites]) => {
      if (active) { setItem(nextItem); setFavorite(favorites.some((entry) => entry.id === hadithId)); }
    });
    return () => { active = false; };
  }, [session, hadithId]);

  const toggleFavorite = async () => {
    if (!hadithId || busy) return;
    setBusy(true);
    try {
      const provider = session?.user.provider === 'firebase' ? nexoraCoreKnowledgeProvider(session!) : mockKnowledgeProvider;
      setFavorite(await provider.toggleHadithFavorite(hadithId));
    } finally {
      setBusy(false);
    }
  };

  if (!item) return <Screen><View style={styles.center}><Text style={styles.title}>Hadith not found</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Go back</Text></Pressable></View></Screen>;
  const gradeLabel: Record<HadithItem['grade'], string> = { sahih: 'Sahih', hasan: 'Hasan', daif: 'Daif', unknown: 'Unknown' };

  return <Screen><ScrollView contentContainerStyle={styles.container}>
    <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>‹ Back to knowledge</Text></Pressable>
    <Text style={styles.eyebrow}>HADITH DETAIL</Text>
    <Text style={styles.title}>{item.title}</Text>
    <Card style={styles.referenceCard}>
      <Text style={styles.collection}>{item.collection}</Text>
      <Text style={styles.reference}>{item.reference}</Text>
      <View style={styles.gradePill}><Text style={styles.grade}>Grade: {gradeLabel[item.grade]}</Text></View>
      <Pressable onPress={toggleFavorite} disabled={busy} style={styles.favoriteButton} accessibilityRole="button" accessibilityLabel={favorite ? 'Remove hadith from favorites' : 'Save hadith to favorites'}>
        <Text style={styles.favoriteText}>{favorite ? '★ Saved to favorites' : '☆ Save to favorites'}</Text>
      </Pressable>
    </Card>
    <Text style={styles.section}>Summary</Text><Card><Text style={styles.body}>{item.summary}</Text></Card>
    <Text style={styles.section}>Source</Text><Card><Text style={styles.sourceTitle}>{item.source.title}</Text><Text style={styles.meta}>Type: {item.source.type}</Text>{item.source.reference ? <Text style={styles.muted}>{item.source.reference}</Text> : null}{item.source.url ? <Text style={styles.muted}>External source available</Text> : null}</Card>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Verification status</Text><Text style={styles.muted}>This prototype intentionally does not display fabricated Arabic text or translations. Production content must preserve original text, collection, reference, grading, and source provenance.</Text></View>
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({
  container:{paddingBottom:spacing.xxl}, center:{flex:1,justifyContent:'center',alignItems:'center',gap:spacing.lg}, back:{color:colors.primary,fontWeight:'800',marginBottom:spacing.xl}, eyebrow:{color:colors.primary,fontSize:11,fontWeight:'900',letterSpacing:.7}, title:{marginTop:spacing.md,color:colors.text,fontSize:typography.title,fontWeight:'900'}, referenceCard:{marginTop:spacing.xl}, collection:{color:colors.primaryDark,fontWeight:'900',fontSize:17}, reference:{marginTop:spacing.xs,color:colors.textMuted,lineHeight:21}, gradePill:{alignSelf:'flex-start',marginTop:spacing.md,paddingHorizontal:spacing.md,paddingVertical:spacing.xs,borderRadius:radius.pill,backgroundColor:colors.surfaceMuted}, grade:{color:colors.primaryDark,fontWeight:'800',fontSize:typography.caption}, favoriteButton:{marginTop:spacing.lg,paddingVertical:spacing.sm}, favoriteText:{color:colors.primary,fontWeight:'900'}, section:{marginTop:spacing.xl,marginBottom:spacing.sm,color:colors.text,fontSize:19,fontWeight:'900'}, body:{color:colors.text,lineHeight:22}, sourceTitle:{color:colors.text,fontSize:16,fontWeight:'900'}, meta:{marginTop:spacing.xs,color:colors.primaryDark,fontWeight:'700'}, muted:{marginTop:spacing.xs,color:colors.textMuted,lineHeight:21}, notice:{marginTop:spacing.xl,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surfaceMuted}, noticeTitle:{color:colors.primaryDark,fontWeight:'900'}
});
