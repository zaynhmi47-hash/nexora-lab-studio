import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider } from '../lib/auth/AuthProvider';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#020617" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#020617' },
          headerTintColor: '#38bdf8',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#020617' },
          animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Scanner & Quick Ledger' }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Page Not Found' }} />
      </Stack>
    </AuthProvider>
  );
}
