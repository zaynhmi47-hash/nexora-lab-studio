import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NexoraApiProvider } from '@/lib/api/NexoraApiProvider';
import { OrganizationProvider } from '@/lib/organization/OrganizationProvider';
import { AuthProvider } from '@/lib/auth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NexoraApiProvider>
        <AuthProvider>
          <OrganizationProvider>
            <StatusBar style="auto" />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </OrganizationProvider>
        </AuthProvider>
      </NexoraApiProvider>
    </SafeAreaProvider>
  );
}
