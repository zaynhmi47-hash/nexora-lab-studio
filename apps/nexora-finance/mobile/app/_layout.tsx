import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { NexoraApiProvider } from '@/lib/api/NexoraApiProvider';
import { OrganizationProvider } from '@/lib/organization/OrganizationProvider';
import { ThemeProvider, useTheme } from '@/lib/theme';

function AppShell() {
  const { mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <NexoraApiProvider>
      <OrganizationProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </OrganizationProvider>
    </NexoraApiProvider>
  );
}
