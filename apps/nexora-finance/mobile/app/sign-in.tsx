import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../lib/auth/AuthProvider.v2';

export default function SignInScreen() {
  const { signInGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await signInGoogle();
      router.replace('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <View style={styles.card}>
        <Text style={styles.eyebrow}>NEXORA FINANCE</Text>
        <Text style={styles.title}>Your financial OS</Text>
        <Text style={styles.subtitle}>
          Manage personal and business finances securely across Android, iOS, and Web.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          disabled={submitting}
          onPress={handleGoogleSignIn}
          style={({ pressed }) => [styles.googleButton, pressed && styles.pressed, submitting && styles.disabled]}
        >
          <Text style={styles.googleMark}>G</Text>
          <Text style={styles.googleText}>{submitting ? 'Connecting…' : 'Continue with Google'}</Text>
        </Pressable>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Text style={styles.legal}>
          By continuing, you agree to use Nexora Finance in accordance with its terms and privacy policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#020617',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0c4a6e',
    opacity: 0.32,
    transform: [{ translateY: -180 }],
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 28,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  eyebrow: {
    marginBottom: 12,
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 23,
  },
  googleButton: {
    minHeight: 54,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.55,
  },
  googleMark: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  googleText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    marginTop: 14,
    color: '#fda4af',
    fontSize: 13,
    lineHeight: 19,
  },
  legal: {
    marginTop: 22,
    color: '#64748b',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});
