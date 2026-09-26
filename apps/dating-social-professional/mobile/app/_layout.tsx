import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatingApiProvider } from '@/src/api/provider';
import { DatingSessionProvider } from '@/src/auth/session';
import { DatingPushRegistration } from '@/src/notifications/registration';

export default function RootLayout() {
  return (
    <DatingSessionProvider>
      <DatingApiProvider>
        <DatingPushRegistration />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </DatingApiProvider>
    </DatingSessionProvider>
  );
}