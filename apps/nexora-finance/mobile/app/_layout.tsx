import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { NexoraApiProvider } from '../lib/api/NexoraApiProvider';
import { OrganizationProvider } from '../lib/organization/OrganizationProvider';

export default function RootLayout() {
  return (
    <NexoraApiProvider>
      <OrganizationProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </OrganizationProvider>
    </NexoraApiProvider>
  );
}
