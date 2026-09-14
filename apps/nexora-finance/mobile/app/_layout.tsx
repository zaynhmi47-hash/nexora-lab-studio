import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth/AuthProvider';
import { NexoraApiProvider } from '../lib/api/NexoraApiProvider';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020617',
      }}
    >
      <ActivityIndicator size="large" color="#38bdf8" />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#020617' },
        headerTintColor: '#38bdf8',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#020617' },
        animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
      }}
    >
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Scanner & Quick Ledger' }} />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Screen name="+not-found" options={{ title: 'Page Not Found' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NexoraApiProvider>
        <StatusBar style="light" backgroundColor="#020617" />
        <RootNavigator />
      </NexoraApiProvider>
    </AuthProvider>
  );
}
