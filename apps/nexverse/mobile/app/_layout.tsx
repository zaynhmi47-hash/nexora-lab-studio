import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { palette } from '@/constants/theme';
import { getNexoraCoreAccessToken } from '@/services/firebaseAuth';
import { configureNexverseAccessTokenProvider } from '@/services/moderation';
import { useAuthStore} from '@/hooks/useAuth';
import {useEffect} from 'react';
// Register once at module initialization; the provider reads the live Firebase session.
configureNexverseAccessTokenProvider(getNexoraCoreAccessToken);

export default function RootLayout() {
  const {user} = useAuthStore();
  useEffect(()=>{
    if(user){
      getNexoraCoreAccessToken().then(token=>{
        configureNexverseAccessTokenProvider(async () => token);
      });
    }
  }, [user])
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.paper },
        animation: 'slide_from_right'
      }}>
        {!user ? (
          <Stack.Screen name="auth/login" options={{ title: "Masuk Nexverse" }} />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="creator/index" options={{ title: "Creator Studio" }} />
        <Stack.Screen name="creator/works/new" options={{ title: "Karya Baru" }} />
        <Stack.Screen name="creator/works/[id]" options={{ title: "Editor Karya" }} />
        <Stack.Screen name="auth/login" options={{ title: "Masuk Nexverse" }} />
        <Stack.Screen name="publisher/index" options={{ title: 'Publisher Studio' }} />
        <Stack.Screen name="publisher/login" options={{ title: 'Masuk Publisher Studio' }} />
        <Stack.Screen name="publisher/works/[id]" options={{ title: 'Review Naskah' }} />
        <Stack.Screen name="work/[slug]" />
        <Stack.Screen name="reader/[slug]" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}
