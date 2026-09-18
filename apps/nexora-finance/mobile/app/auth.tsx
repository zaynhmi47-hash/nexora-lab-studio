import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { NexoraButton, NexoraCard, NexoraInput } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function AuthScreen() {
  const { firebaseConfigured, status, signInWithEmail, registerWithEmail, signInWithGoogle } = useAuth();
  const { theme } = useTheme();
  const [mode, setMode] = useState<'signIn' | 'register'>('signIn');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async () => { setBusy(true); setError(null); try { if (mode === 'signIn') await signInWithEmail(email.trim(), password); else await registerWithEmail(email.trim(), password); router.replace('/workspace'); } catch (err) { setError(err instanceof Error ? err.message : 'Authentication failed.'); } finally { setBusy(false); } };
  if (!firebaseConfigured) return <View style={[styles.root,{backgroundColor:theme.colors.background}]}><NexoraCard style={styles.card}><Text style={[styles.title,{color:theme.colors.text}]}>Firebase belum dikonfigurasi</Text><Text style={[styles.subtitle,{color:theme.colors.muted}]}>Isi EXPO_PUBLIC_FIREBASE_* pada environment aplikasi sebelum login digunakan.</Text></NexoraCard></View>;
  return <View style={[styles.root,{backgroundColor:theme.colors.background}]}><NexoraCard style={styles.card}><Text style={[styles.title,{color:theme.colors.text}]}>Nexora Finance</Text><Text style={[styles.subtitle,{color:theme.colors.muted}]}>{mode === 'signIn' ? 'Sign in to continue.' : 'Create your Nexora account.'}</Text><NexoraInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/><NexoraInput label="Password" value={password} onChangeText={setPassword} secureTextEntry/>{error ? <Text style={[styles.error,{color:theme.colors.danger}]}>{error}</Text> : null}<NexoraButton onPress={submit} disabled={busy || status === 'authenticating'}>{busy ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Create account'}</NexoraButton><NexoraButton variant="secondary" onPress={async()=>{setBusy(true);setError(null);try{await signInWithGoogle();router.replace('/workspace');}catch(err){setError(err instanceof Error?err.message:'Google sign-in failed.');}finally{setBusy(false);}}} disabled={busy}>Continue with Google</NexoraButton><NexoraButton variant="secondary" onPress={()=>{setMode(mode==='signIn'?'register':'signIn');setError(null);}} disabled={busy}>{mode==='signIn'?'Create an account':'I already have an account'}</NexoraButton></NexoraCard></View>;
}
const styles=StyleSheet.create({root:{flex:1,alignItems:'center',justifyContent:'center',padding:24},card:{width:'100%',maxWidth:480,gap:16},title:{fontSize:28,fontWeight:'800'},subtitle:{fontSize:15,lineHeight:22},error:{fontSize:14,lineHeight:20}});
