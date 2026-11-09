import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { palette } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.paper },
        animation: 'slide_from_right'
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="publisher/index" options={{ title: 'Publisher Studio' }} />
        <Stack.Screen name="publisher/works/[id]" options={{ title: 'Review Naskah' }} />
        <Stack.Screen name="work/[slug]" />
        <Stack.Screen name="reader/[slug]" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}