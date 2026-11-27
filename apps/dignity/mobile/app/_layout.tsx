import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NexoraApiProvider } from '@/lib/api/NexoraApiProvider';
import { AuthProvider } from '@/lib/auth';
import { createFirebaseAuthPort } from '@/lib/auth/firebase/authPort';
import { hasFirebaseConfig } from '@/lib/auth/firebase/config';
import { createFirebaseTokenPort } from '@/lib/auth/firebase/tokenPort';
import { OrganizationProvider } from '@/lib/organization/OrganizationProvider';

export default function RootLayout() {
  const apiUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL ?? 'http://localhost:8000';
  const firebaseConfigured = hasFirebaseConfig();
  const authPort = useMemo(
    () => firebaseConfigured ? createFirebaseAuthPort(apiUrl) : undefined,
    [apiUrl, firebaseConfigured],
  );
  const tokenPort = useMemo(() => createFirebaseTokenPort(), []);

  return (
    <SafeAreaProvider>
      <NexoraApiProvider tokenPort={tokenPort}>
        <AuthProvider port={authPort}>
          <OrganizationProvider>
            <StatusBar style="auto" />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </OrganizationProvider>
        </AuthProvider>
      </NexoraApiProvider>
    </SafeAreaProvider>
  );
}
