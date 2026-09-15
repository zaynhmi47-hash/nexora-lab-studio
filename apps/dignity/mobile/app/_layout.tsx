import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NexoraApiProvider } from '@/lib/api/NexoraApiProvider';
import { OrganizationProvider } from '@/lib/organization/OrganizationProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NexoraApiProvider>
        <OrganizationProvider>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </OrganizationProvider>
      </NexoraApiProvider>
    </SafeAreaProvider>
  );
}
