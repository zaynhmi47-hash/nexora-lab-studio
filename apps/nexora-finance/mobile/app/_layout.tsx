import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/lib/auth';
import { NexoraApiProvider } from '@/lib/api/NexoraApiProvider';
import { IdentityProvider } from '@/lib/identity';
import { OrganizationProvider, useOrganization } from '@/lib/organization';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { useWorkspace, WorkspaceProvider } from '@/lib/workspace';

function AuthGate() {
  const { status } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { loading: organizationsLoading } = useOrganization();
  const pathname = usePathname();

  if (status === 'unknown' || status === 'authenticating') return null;
  if (status !== 'authenticated') return pathname === '/auth' ? null : <Redirect href="/auth" />;
  if (organizationsLoading) return null;
  if (pathname === '/auth' || pathname === '/') return <Redirect href="/workspace" />;
  if (!activeWorkspace && pathname !== '/workspace') return <Redirect href="/workspace" />;
  return null;
}

function AppShell() {
  const { mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NexoraApiProvider>
        <IdentityProvider>
          <OrganizationProvider>
            <WorkspaceProvider>
              <ThemeProvider>
                <AppShell />
              </ThemeProvider>
            </WorkspaceProvider>
          </OrganizationProvider>
        </IdentityProvider>
      </NexoraApiProvider>
    </AuthProvider>
  );
}
