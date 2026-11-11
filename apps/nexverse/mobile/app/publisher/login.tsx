import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette } from '@/constants/theme';
import { signInNexoraWithEmailPassword } from '@/services/firebaseAuth';

function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email atau kata sandi tidak sesuai.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Koneksi terganggu. Periksa internet lalu coba lagi.';
  }
  if (code.startsWith('auth/operation-not-allowed')) {
    return 'Metode Email/Password belum diaktifkan pada Firebase Authentication proyek Nexora.';
  }
  if (error instanceof Error && error.message.includes('Konfigurasi Firebase')) {
    return error.message;
  }
  return 'Login gagal. Periksa konfigurasi Firebase dan coba lagi.';
}

export default function PublisherLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInNexoraWithEmailPassword(email, password);
      router.replace('/publisher');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={19} color={palette.ink} />
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>
        <View style={styles.brandMark}>
          <Ionicons name="shield-checkmark" size={27} color={palette.green} />
        </View>
        <Text style={styles.eyebrow}>NEXORA IDENTITY</Text>
        <Text style={styles.title}>Masuk ke Publisher Studio</Text>
        <Text style={styles.subtitle}>
          Gunakan akun Nexora yang telah diberi akses moderator. Hak akses akan diverifikasi kembali oleh server.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="nama@email.com"
          placeholderTextColor={palette.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          style={styles.input}
          returnKeyType="next"
        />
        <Text style={styles.label}>Kata sandi</Text>
        <View style={styles.passwordField}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan kata sandi"
            placeholderTextColor={palette.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            editable={!loading}
            style={styles.passwordInput}
            onSubmitEditing={() => void submit()}
            returnKeyType="go"
          />
          <Pressable onPress={() => setShowPassword(value => !value)} accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={palette.muted} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={17} color="#9A594B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable disabled={loading} onPress={() => void submit()} style={[styles.submit, loading && styles.disabled]}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Masuk dengan Nexora</Text>}
        </Pressable>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={15} color={palette.green} />
          <Text style={styles.securityText}>
            Autentikasi menggunakan Firebase Nexora. Token tidak disimpan manual; API memeriksa identitas dan role moderator pada setiap permintaan.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  back: { position: 'absolute', top: 22, left: 22, flexDirection: 'row', alignItems: 'center', gap: 7 },
  backText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: palette.ink, fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 19, marginTop: 8, marginBottom: 28 },
  label: { color: palette.ink, fontSize: 11, fontWeight: '800', marginBottom: 7, marginTop: 13 },
  input: { height: 48, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface, paddingHorizontal: 13, color: palette.ink, fontSize: 13 },
  passwordField: { minHeight: 48, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, color: palette.ink, fontSize: 13, paddingVertical: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: palette.rose, padding: 11, borderRadius: 10, marginTop: 15 },
  errorText: { flex: 1, color: '#8A5145', fontSize: 10, lineHeight: 15 },
  submit: { height: 49, backgroundColor: palette.green, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 22 },
  securityText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 16 },
});
