import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function SignInScreen() {
  const { status, error, signIn, register, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'sign_in' | 'register'>('sign_in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'signed_in') router.replace('/(tabs)');
  }, [status]);

  const handleSubmit = async () => {
    setBusy(true);
    setNotice(null);
    try {
      if (mode === 'sign_in') {
        await signIn(email, password);
      } else {
        if (displayName.trim().length < 2) throw new Error('Enter your full name.');
        if (password.length < 8) throw new Error('Password must contain at least 8 characters.');
        await register({ displayName, email, password });
      }
    } catch (submitError) {
      setNotice(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    setNotice(null);
    try {
      if (!email.trim()) throw new Error('Enter your email address first.');
      await sendPasswordReset(email);
      setNotice('Password reset instructions have been sent if this email is registered.');
    } catch (resetError) {
      setNotice(resetError instanceof Error ? resetError.message : 'Unable to send reset email.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Text style={styles.brandInitial}>D</Text></View>
        <Text style={styles.eyebrow}>NEXORA EDUCATION</Text>
        <Text style={styles.title}>{mode === 'sign_in' ? 'Welcome to Dignity' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'sign_in'
            ? 'Sign in with your Nexora account to continue learning.'
            : 'Your account will use Nexora Identity across supported apps.'}
        </Text>

        <View style={styles.card}>
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput autoCapitalize="words" value={displayName} onChangeText={setDisplayName} placeholder="Your name" style={styles.input} editable={!busy} />
            </>
          )}
          <Text style={styles.label}>Email address</Text>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" style={styles.input} editable={!busy} />
          <Text style={styles.label}>Password</Text>
          <TextInput autoCapitalize="none" autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'} secureTextEntry value={password} onChangeText={setPassword} placeholder={mode === 'sign_in' ? 'Your password' : 'At least 8 characters'} style={styles.input} editable={!busy} />

          {(notice || error) && <Text accessibilityRole="alert" style={styles.error}>{notice ?? error}</Text>}

          <Pressable
            accessibilityRole="button"
            disabled={busy || status === 'unavailable'}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (busy || status === 'unavailable') && styles.disabled]}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === 'sign_in' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>

          {mode === 'sign_in' && (
            <Pressable onPress={() => void handlePasswordReset()} disabled={busy} style={styles.textButton}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => { setMode((current) => current === 'sign_in' ? 'register' : 'sign_in'); setNotice(null); }} style={styles.textButton}>
          <Text style={styles.linkText}>
            {mode === 'sign_in' ? 'New to Dignity? Create an account' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>

        {status === 'unavailable' && (
          <Text style={styles.configWarning}>
            Authentication is not configured. Set the Firebase public environment variables and API URL before launching the app.
          </Text>
        )}
        <Text style={styles.footer}>
          Firebase verifies your sign-in. Nexora Identity provides your internal account ID and access context.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brandMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  brandInitial: { color: '#fff', fontSize: 28, fontWeight: '800' },
  eyebrow: { color: '#2563eb', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#0f172a', fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#64748b', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, color: '#0f172a', backgroundColor: '#fff' },
  error: { color: '#be123c', fontSize: 12, lineHeight: 18, marginTop: 12 },
  primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  textButton: { alignItems: 'center', paddingVertical: 14 },
  linkText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  configWarning: { color: '#9a3412', backgroundColor: '#ffedd5', borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18, marginTop: 14 },
  footer: { color: '#94a3b8', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 24 },
});
