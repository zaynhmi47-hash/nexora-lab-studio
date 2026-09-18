import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { nexoraCoreArabicRepository, mockArabic, type ArabicPort, type ArabicPracticeItem } from '@/lib/arabic';

export default function ArabicLessonScreen(){
 const {lessonId}=useLocalSearchParams<{lessonId:string}>(); const router=useRouter(); const {session}=useAuth();
 const repository=useMemo<ArabicPort>(()=>session?.user.provider==='firebase'?nexoraCoreArabicRepository(session):mockArabic,[session]);
 const [items,setItems]=useState<ArabicPracticeItem[]>([]); const [selected,setSelected]=useState<number|null>(null); const [completed,setCompleted]=useState(false); const [error,setError]=useState<string|null>(null);
 useEffect(()=>{if(!lessonId)return;repository.getPractice(lessonId).then(setItems).catch(()=>setError('Unable to load practice.'));},[lessonId,repository]);
 const item=items[0];
 const finish=async()=>{if(!lessonId)return;try{await repository.completeLesson(lessonId);setCompleted(true);}catch{setError('Unable to save lesson progress.');}};
 return <Screen><Text style={styles.eyebrow}>ARABIC LESSON</Text><Text style={styles.heading}>{lessonId}</Text>{error&&<Text style={styles.error}>{error}</Text>}{item&&<Card style={styles.card}><Text style={styles.prompt}>{item.prompt}</Text>{item.options.map((option,index)=><Pressable key={option} onPress={()=>setSelected(index)} style={[styles.option,selected===index&&styles.selected]}><Text style={styles.optionText}>{option}</Text></Pressable>)}{selected!==null&&<Text style={styles.explanation}>{selected===item.correctOptionIndex?'Correct. ':'Review: '}{item.explanation}</Text>}</Card>}{completed?<Card><Text style={styles.success}>Lesson completed and progress saved.</Text><Pressable onPress={()=>router.back()}><Text style={styles.cta}>Back to Arabic →</Text></Pressable></Card>:<Pressable style={styles.button} onPress={finish}><Text style={styles.buttonText}>Complete lesson</Text></Pressable>}</Screen>;
}
const styles=StyleSheet.create({eyebrow:{fontSize:11,fontWeight:'800',color:colors.primary},heading:{fontSize:24,fontWeight:'800',color:colors.text,marginTop:spacing.sm},error:{color:colors.danger,fontWeight:'700',marginTop:spacing.md},card:{marginTop:spacing.lg},prompt:{fontSize:19,fontWeight:'800',color:colors.text,lineHeight:26},option:{padding:spacing.md,borderWidth:1,borderColor:colors.border,borderRadius:12,marginTop:spacing.sm},selected:{borderColor:colors.primary,backgroundColor:colors.primarySoft},optionText:{color:colors.text,fontWeight:'600'},explanation:{marginTop:spacing.md,color:colors.textMuted,lineHeight:20},button:{marginTop:spacing.lg,padding:spacing.md,borderRadius:12,backgroundColor:colors.primary,alignItems:'center'},buttonText:{color:colors.white,fontWeight:'800'},success:{color:colors.success,fontWeight:'800',marginBottom:spacing.md},cta:{color:colors.primary,fontWeight:'800'}});
