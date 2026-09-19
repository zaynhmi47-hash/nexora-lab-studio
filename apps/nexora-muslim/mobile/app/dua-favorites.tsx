import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockDua, nexoraCoreDuaRepository, type DuaFavorite, type DuaPort } from '@/lib/dua';

export default function DuaFavoritesScreen() {
  const { session } = useAuth();
  const repo = useMemo<DuaPort>(() => session?.user.provider === 'firebase' ? nexoraCoreDuaRepository(session) : mockDua, [session]);
  const [items, setItems] = useState<DuaFavorite[]>([]);

  useEffect(() => { void repo.listFavorites().then(setItems).catch(() => setItems([])); }, [repo]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Dua</Text></Pressable>
        <Text style={styles.eyebrow}>PERSONAL COLLECTION</Text>
        <Text style={styles.heading}>Favorite Duas</Text>
        <Text style={styles.subtitle}>Your saved supplications in one place.</Text>
        {items.length === 0 ? <Card style={styles.card}><Text style={styles.muted}>No favorite duas yet.</Text></Card> : items.map(item => (
          <Card key={item.favoriteId} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.arabic}>{item.arabic}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
            <Text style={styles.reference}>{item.reference}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container:{paddingBottom:spacing.xxl},
  back:{color:colors.primary,fontWeight:'800',fontSize:16,marginBottom:spacing.lg},
  eyebrow:{color:colors.primary,fontSize:typography.small,fontWeight:'800'},
  heading:{color:colors.text,fontSize:typography.title,fontWeight:'800',marginTop:spacing.xs},
  subtitle:{color:colors.textMuted,marginTop:spacing.xs},
  card:{marginTop:spacing.md,padding:spacing.lg},
  title:{color:colors.text,fontSize:typography.heading,fontWeight:'800'},
  arabic:{color:colors.text,fontSize:25,textAlign:'right',lineHeight:44,marginTop:spacing.lg},
  translation:{color:colors.textMuted,lineHeight:22,marginTop:spacing.md},
  reference:{color:colors.primary,fontSize:typography.caption,fontWeight:'700',marginTop:spacing.md},
  muted:{color:colors.textMuted},
});
