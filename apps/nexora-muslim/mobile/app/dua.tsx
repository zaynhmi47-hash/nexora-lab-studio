import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockDua, nexoraCoreDuaRepository, type DuaEntry, type DuaPort } from '@/lib/dua';
export default function DuaScreen() {
 const { session } = useAuth();
 const repository=useMemo<DuaPort>(()=>session?.user.provider==='firebase'&&session?nexoraCoreDuaRepository(session):mockDua,[session]);
 const [items,setItems]=useState<DuaEntry[]>([]); const [favorites,setFavorites]=useState<string[]>([]);
 useEffect(()=>{let active=true;Promise.all([repository.list(),repository.listFavorites()]).then(([list,favs])=>{if(active){setItems(list);setFavorites(favs.map((item)=>item.id));}}).catch(()=>undefined);return()=>{active=false};},[repository]);
 const toggle=async(id:string)=>{const active=await repository.toggleFavorite(id);setFavorites((current)=>active?[...new Set([...current,id])]:current.filter((item)=>item!==id));};
 return <Screen><ScrollView contentContainerStyle={styles.container}><Text style={styles.eyebrow}>DUA</Text><Text style={styles.heading}>Daily Duas</Text><Text style={styles.muted}>Verified references are preserved with each dua entry.</Text><Pressable onPress={()=>router.push('/dua-favorites')}><Text style={styles.favoriteLink}>View favorites</Text></Pressable>{items.map((item)=><Card key={item.id} style={styles.card}><Text style={styles.title}>{item.title}</Text><Text style={styles.arabic}>{item.arabic}</Text>{item.transliteration?<Text style={styles.muted}>{item.transliteration}</Text>:null}<Text style={styles.muted}>{item.translation}</Text><Text style={styles.reference}>{item.reference}</Text><Pressable onPress={()=>void toggle(item.id)}><Text style={styles.favorite}>{favorites.includes(item.id)?'★ Saved':'☆ Save'}</Text></Pressable></Card>)}</ScrollView></Screen>;
}
const styles=StyleSheet.create({container:{paddingBottom:spacing.xl},eyebrow:{fontSize:11,fontWeight:'800',color:colors.primary},heading:{fontSize:28,fontWeight:'800',color:colors.text,marginTop:spacing.sm},muted:{color:colors.textMuted,lineHeight:20,marginTop:4},favoriteLink:{color:colors.primary,fontWeight:'800',marginTop:spacing.lg},card:{marginTop:spacing.md},title:{fontSize:18,fontWeight:'800',color:colors.text},arabic:{fontSize:25,color:colors.text,textAlign:'right',marginTop:spacing.md,lineHeight:42},reference:{color:colors.textMuted,fontSize:12,marginTop:spacing.sm},favorite:{color:colors.primary,fontWeight:'800',marginTop:spacing.md}});
