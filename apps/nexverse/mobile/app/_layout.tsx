import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { palette } from '@/constants/theme';
import { getNexoraCoreAccessToken } from '@/services/firebaseAuth';
import { configureNexverseAccessTokenProvider } from '@/services/moderation';

export default function RootLayout() {
  // Register the shared Firebase identity-token bridge before protected screens load.
  configureNexverseAccessTokenProvider(getNexoraCoreAccessToken);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.paper },
        animation: 'slide_from_right'
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="creator/index" options={{ title: "Creator Studio" }} />
        <Stack.Screen name="creator/works/new" options={{ title: "Karya Baru" }} />
        <Stack.Screen name="creator/works/[id]" options={{ title: "Editor Karya" }} />
        <Stack.Screen name="publisher/index" options={{ title: 'Publisher Studio' }} />
        <Stack.Screen name="publisher/login" options={{ title: 'Masuk Publisher Studio' }} />
        <Stack.Screen name="publisher/works/[id]" options={{ title: 'Review Naskah' }} />
        <Stack.Screen name="work/[slug]" />
        <Stack.Screen name="reader/[slug]" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}
