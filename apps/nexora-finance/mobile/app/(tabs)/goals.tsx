import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { theme } from '@/lib/theme';
import { useGoals } from '@/lib/features/goals';
import type { CreateGoalInput, FinanceGoal } from '@/lib/features/goals';

const todayInput=()=>new Date().toISOString().slice(0,10);
const formatIdr=(v:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(v);

export default function GoalsScreen(){
 const {goals,loading,error,ready,create,update,archive}=useGoals();
 const [selected,setSelected]=useState<FinanceGoal|null>(null);
 const [mode,setMode]=useState<'detail'|'add'|'edit'>('detail');
 const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [startDate,setStartDate]=useState(todayInput()); const [targetDate,setTargetDate]=useState(todayInput());
 const [formError,setFormError]=useState<string|null>(null); const [submitting,setSubmitting]=useState(false);
 const reset=(g?:FinanceGoal)=>{setName(g?.name??'');setTarget(g?String(g.targetAmountMinor):'');setStartDate(g?.startDate??todayInput());setTargetDate(g?.targetDate??todayInput());setFormError(null);};
 const openAdd=()=>{reset();setSelected(null);setMode('add');};
 const openDetail=(g:FinanceGoal)=>{setSelected(g);setMode('detail');setFormError(null);};
 const submit=async()=>{
   const amount=Number(target.replace(/[^0-9]/g,''));
   if(!name.trim())return setFormError('Goal name is required.');
   if(!Number.isSafeInteger(amount)||amount<1)return setFormError('Enter a valid target amount.');
   if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(targetDate))return setFormError('Dates must use YYYY-MM-DD format.');
   if(targetDate<startDate)return setFormError('Target date must be on or after start date.');
   setSubmitting(true);setFormError(null);
   try{
     const input:CreateGoalInput={name:name.trim(),targetAmountMinor:amount,currency:'IDR',startDate,targetDate};
     if(mode==='add'){const g=await create(input);setSelected(g);setMode('detail');}
     else if(selected){const g=await update(selected.id,input);setSelected(g);setMode('detail');}
   }catch(cause){setFormError(cause instanceof Error?cause.message:'Unable to save goal.');}finally{setSubmitting(false);}
 };
 const doArchive=()=>{if(!selected)return;Alert.alert('Archive goal?','The goal will remain in history and stop accepting contributions.',[{text:'Cancel',style:'cancel'},{text:'Archive',style:'destructive',onPress:async()=>{setSubmitting(true);try{await archive(selected.id);setSelected(null);setMode('detail');}catch(cause){setFormError(cause instanceof Error?cause.message:'Unable to archive goal.');}finally{setSubmitting(false);}}}]);};
 const close=()=>{if(!submitting){setSelected(null);setMode('detail');setFormError(null);}};
 return <ResponsiveScaffold><ResponsiveContainer maxWidth={1200}><ScrollView contentContainerStyle={styles.content}>
   <AdaptiveHeader title="Financial Goals" subtitle="Track savings targets, progress, deadlines, and contributions." />
   <View style={styles.toolbar}><View style={{flex:1,gap:3}}><Text style={styles.sectionTitle}>Your goals</Text><Text style={styles.hint}>{goals.length} goal{goals.length===1?'':'s'}</Text></View><Pressable disabled={!ready} onPress={openAdd} style={[styles.primary,!ready&&styles.disabled]}><Text style={styles.primaryText}>+ Add goal</Text></Pressable></View>
   {error?<View style={styles.card}><Text style={styles.title}>Unable to load goals</Text><Text style={styles.hint}>{error.message}</Text></View>:null}
   {loading&&goals.length===0?<View style={styles.state}><ActivityIndicator/><Text style={styles.hint}>Loading goals…</Text></View>:goals.length===0?<View style={styles.state}><Text style={styles.title}>No financial goals</Text><Text style={styles.hint}>Create a target such as emergency savings, a laptop, or a travel fund.</Text><Pressable disabled={!ready} onPress={openAdd} style={[styles.primary,!ready&&styles.disabled]}><Text style={styles.primaryText}>Create your first goal</Text></Pressable></View>:
   <View style={styles.card}>{goals.map(g=><Pressable key={g.id} onPress={()=>openDetail(g)} style={styles.row}><View style={{flex:1,gap:4}}><Text style={styles.title}>{g.name}</Text><Text style={styles.hint}>{g.startDate} → {g.targetDate}</Text></View><Text style={styles.amount}>{formatIdr(g.targetAmountMinor)}</Text></Pressable>)}</View>}
 </ScrollView></ResponsiveContainer>
 <Modal visible={mode!=='detail'||selected!==null} transparent animationType="slide" onRequestClose={close}><View style={styles.backdrop}><View style={[styles.modal,Platform.OS==='web'?styles.modalWeb:null]}><ScrollView contentContainerStyle={styles.modalContent}>
   <View style={styles.modalHeader}><View style={{flex:1,gap:3}}><Text style={styles.modalTitle}>{mode==='add'?'Add goal':mode==='edit'?'Edit goal':'Goal detail'}</Text><Text style={styles.hint}>All amounts are stored as whole IDR values.</Text></View><Pressable onPress={close}><Text style={styles.close}>×</Text></Pressable></View>
   {mode==='detail'&&selected?<><View style={styles.hero}><Text style={styles.heroAmount}>{formatIdr(selected.targetAmountMinor)}</Text><Text style={styles.hint}>{selected.name}</Text><Text style={styles.hint}>Status: {selected.status}</Text></View><View style={styles.detail}><Text style={styles.field}>Period</Text><Text style={styles.value}>{selected.startDate} → {selected.targetDate}</Text><Text style={styles.field}>Target date</Text><Text style={styles.value}>{selected.targetDate}</Text></View>{formError?<Text style={styles.error}>{formError}</Text>:null}<View style={styles.actions}>{selected.status==='active'?<><Pressable onPress={()=>{reset(selected);setMode('edit')}} style={styles.secondary}><Text style={styles.secondaryText}>Edit</Text></Pressable><Pressable disabled={submitting} onPress={doArchive} style={styles.secondary}><Text style={styles.secondaryText}>Archive</Text></Pressable></>:null}</View></>:
   <><Text style={styles.field}>Goal name *</Text><TextInput value={name} onChangeText={setName} placeholder="Emergency fund" placeholderTextColor={theme.colors.muted} style={styles.input}/><ResponsiveGrid gap={12}><View style={styles.fieldWrap}><Text style={styles.field}>Target amount (IDR) *</Text><TextInput value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="10000000" placeholderTextColor={theme.colors.muted} style={styles.input}/></View><View style={styles.fieldWrap}><Text style={styles.field}>Start date *</Text><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.muted} style={styles.input}/></View></ResponsiveGrid><Text style={styles.field}>Target date *</Text><TextInput value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.muted} style={styles.input}/>{formError?<Text style={styles.error}>{formError}</Text>:null}<View style={styles.actions}><Pressable onPress={close} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={submitting} onPress={()=>void submit()} style={styles.primary}>{submitting?<ActivityIndicator color={theme.colors.surface}/>:<Text style={styles.primaryText}>{mode==='edit'?'Save changes':'Save goal'}</Text>}</Pressable></View></>}
 </ScrollView></View></View></Modal>
 </ResponsiveScaffold>;
}
const styles=StyleSheet.create({
 content:{paddingTop:20,paddingBottom:40,gap:16},toolbar:{padding:20,borderRadius:16,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,flexDirection:'row',alignItems:'center',gap:16},sectionTitle:{fontSize:18,fontWeight:'800',color:theme.colors.text},hint:{fontSize:14,lineHeight:20,color:theme.colors.muted},primary:{minHeight:44,paddingHorizontal:16,borderRadius:12,backgroundColor:theme.colors.primary,alignItems:'center',justifyContent:'center'},primaryText:{color:theme.colors.surface,fontWeight:'700'},disabled:{opacity:.5},card:{paddingHorizontal:20,borderRadius:16,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface},row:{minHeight:78,paddingVertical:14,borderBottomWidth:1,borderBottomColor:theme.colors.border,flexDirection:'row',alignItems:'center',gap:16},title:{fontSize:15,fontWeight:'700',color:theme.colors.text},amount:{fontSize:15,fontWeight:'800',color:theme.colors.text},state:{minHeight:200,padding:24,borderRadius:16,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,alignItems:'center',justifyContent:'center',gap:10},backdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,.35)'},modal:{maxHeight:'92%',backgroundColor:theme.colors.surface,borderTopLeftRadius:24,borderTopRightRadius:24},modalWeb:{alignSelf:'center',width:'92%',maxWidth:720,borderRadius:24,marginBottom:24},modalContent:{padding:24,gap:12},modalHeader:{flexDirection:'row',alignItems:'flex-start',gap:12},modalTitle:{fontSize:22,fontWeight:'800',color:theme.colors.text},close:{fontSize:28,color:theme.colors.muted},input:{minHeight:46,paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.background,color:theme.colors.text},field:{fontSize:14,fontWeight:'700',color:theme.colors.text},fieldWrap:{flex:1,gap:6},hero:{padding:20,borderRadius:16,backgroundColor:theme.colors.background,alignItems:'center',gap:6},heroAmount:{fontSize:30,fontWeight:'900',color:theme.colors.text},detail:{gap:5},value:{fontSize:15,color:theme.colors.text,marginBottom:8},error:{padding:10,borderRadius:10,borderWidth:1,borderColor:theme.colors.border,color:theme.colors.text},actions:{flexDirection:'row',justifyContent:'flex-end',gap:10,flexWrap:'wrap'},secondary:{minHeight:44,paddingHorizontal:16,borderRadius:12,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center'},secondaryText:{color:theme.colors.text,fontWeight:'700'}
});