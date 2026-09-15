import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import { AuthProvider } from '@/lib/auth/AuthProvider';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
          >
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="quran" options={{ title: 'Quran', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="prayer" options={{ title: 'Prayer', tabBarIcon: ({ color, size }) => <Ionicons name="moon-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="qibla" options={{ href: null }} />
            <Tabs.Screen name="dhikr" options={{ href: null }} />
            <Tabs.Screen name="travel" options={{ href: null }} />
            <Tabs.Screen name="umrah" options={{ href: null }} />
            <Tabs.Screen name="knowledge" options={{ href: null }} />
          </Tabs>
        </AuthGate>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
