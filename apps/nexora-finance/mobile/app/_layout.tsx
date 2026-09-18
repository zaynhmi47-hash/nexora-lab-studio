import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/lib/auth';
import { NexoraApiProvider } from '@/lib/api/NexoraApiProvider';
import { OrganizationProvider } from '@/lib/organization/OrganizationProvider';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { WorkspaceProvider } from '@/lib/workspace';

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
    <AuthProvider>
      <NexoraApiProvider>
        <WorkspaceProvider>
          <OrganizationProvider>
            <ThemeProvider>
              <AppShell />
            </ThemeProvider>
          </OrganizationProvider>
        </WorkspaceProvider>
      </NexoraApiProvider>
    </AuthProvider>
  );
}
