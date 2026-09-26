import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatingApiProvider } from '@/src/api/provider';
import { DatingSessionProvider } from '@/src/auth/session';
import { DatingPushRegistration } from '@/src/notifications/registration';
import { DatingNotificationHandler } from '@/src/notifications/handler';

export default function RootLayout() {
  return (
    <DatingSessionProvider>
      <DatingApiProvider>
        <DatingPushRegistration />
        <DatingNotificationHandler />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </DatingApiProvider>
    </DatingSessionProvider>
  );
}