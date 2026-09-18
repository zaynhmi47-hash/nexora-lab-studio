import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { nexoraCoreArabicRepository, mockArabic, type ArabicPath, type ArabicPort, type ArabicProgress } from '@/lib/arabic';

export default function ArabicScreen(){
 const router=useRouter(); const {session}=useAuth();
 const repository=useMemo<ArabicPort>(()=>session?.user.provider==='firebase'?nexoraCoreArabicRepository(session):mockArabic,[session]);
 const [paths,setPaths]=useState<ArabicPath[]>([]); const [progress,setProgress]=useState<ArabicProgress|null>(null); const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;Promise.all([repository.getPaths(),repository.getProgress()]).then(([p,g])=>{if(active){setPaths(p);setProgress(g);}}).catch(()=>active&&setError('Unable to load Arabic learning.'));return()=>{active=false};},[repository]);
 return <Screen><ScrollView contentContainerStyle={styles.container}><Text style={styles.eyebrow}>ARABIC</Text><Text style={styles.heading}>Arabic Learning</Text><Text style={styles.muted}>Learn useful Arabic step by step, with a dedicated path for Umrah preparation.</Text>{error&&<Text style={styles.error}>{error}</Text>}
 <Card style={styles.progress}><Text style={styles.progressTitle}>{progress?.xpEarned??0} XP · {progress?.currentStreak??0} day streak</Text><Text style={styles.muted}>{progress?.completedLessonIds.length??0} lessons completed</Text></Card>
 {paths.map(path=><Card key={path.id} style={styles.path}><Text style={styles.title}>{path.title}</Text><Text style={styles.muted}>{path.description}</Text>{path.lessons.map(lesson=>{const done=progress?.completedLessonIds.includes(lesson.id)||lesson.status==='completed';const locked=lesson.status==='locked';return <Pressable key={lesson.id} disabled={locked} onPress={()=>router.push('/arabic/lesson/'+lesson.id)}><View style={styles.lesson}><View style={[styles.circle,done&&styles.done]}><Text style={styles.circleText}>{done?'✓':lesson.order}</Text></View><View style={styles.info}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.muted}>{locked?'Locked':done?'Completed':'Available'} · +{lesson.xpReward} XP</Text></View><Text style={styles.arrow}>{locked?'🔒':'›'}</Text></View></Pressable>})}</Card>)}
 </ScrollView></Screen>;
}
const styles=StyleSheet.create({container:{paddingBottom:spacing.xl},eyebrow:{fontSize:11,fontWeight:'800',color:colors.primary},heading:{fontSize:28,fontWeight:'800',color:colors.text,marginTop:spacing.sm},muted:{color:colors.textMuted,lineHeight:20,marginTop:4},error:{color:colors.danger,fontWeight:'700',marginTop:spacing.md},progress:{marginTop:spacing.lg},progressTitle:{fontSize:18,fontWeight:'800',color:colors.text},path:{marginTop:spacing.md},title:{fontSize:19,fontWeight:'800',color:colors.text},lesson:{flexDirection:'row',alignItems:'center',borderTopWidth:1,borderTopColor:colors.border,marginTop:spacing.md,paddingTop:spacing.md},circle:{width:36,height:36,borderRadius:18,backgroundColor:colors.surfaceMuted,alignItems:'center',justifyContent:'center'},done:{backgroundColor:colors.primarySoft},circleText:{fontWeight:'800',color:colors.primary},info:{flex:1,marginLeft:spacing.md},lessonTitle:{fontWeight:'700',color:colors.text},arrow:{marginLeft:spacing.sm,color:colors.textMuted}});
