import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockKnowledgeProvider, nexoraCoreKnowledgeProvider, type HadithFavorite } from '@/lib/knowledge';
export default function HadithFavoritesScreen() {
 const { session }=useAuth(); const [items,setItems]=useState<HadithFavorite[]>([]);
 useEffect(()=>{let active=true;const provider=session?.user.provider==='firebase'?nexoraCoreKnowledgeProvider(session):mockKnowledgeProvider;void provider.listHadithFavorites?.().then((next)=>{if(active)setItems(next??[])}).catch(()=>undefined);return()=>{active=false};},[session]);
 return <Screen><ScrollView contentContainerStyle={styles.container}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.title}>Saved Hadith</Text><Text style={styles.subtitle}>Your personal hadith collection.</Text>{items.length===0?<Card><Text style={styles.muted}>No saved hadith yet. Open a hadith and save it here.</Text></Card>:items.map(item=><Pressable key={item.id} onPress={()=>router.push({pathname:'/knowledge/hadith/[hadithId]',params:{hadithId:item.id}})}><Card style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.meta}>{item.collection} · {item.reference}</Text><Text style={styles.muted}>{item.summary}</Text></Card></Pressable>)}</ScrollView></Screen>;
}
const styles=StyleSheet.create({container:{paddingBottom:spacing.xxl},back:{color:colors.primary,fontWeight:'800',marginBottom:spacing.xl},title:{fontSize:typography.title,fontWeight:'900',color:colors.text},subtitle:{marginTop:spacing.xs,marginBottom:spacing.xl,color:colors.textMuted},card:{marginBottom:spacing.md},cardTitle:{fontSize:17,fontWeight:'800',color:colors.text},meta:{marginTop:spacing.xs,color:colors.primaryDark,fontWeight:'700'},muted:{color:colors.textMuted,lineHeight:21}});
