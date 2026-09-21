import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AppStateProvider } from '@/lib/app-state/AppStateProvider';

const tabBarHeight = Platform.select({
  ios: 76,
  android: 68,
  web: 68,
  default: 68,
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: {
              backgroundColor: colors.background,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarActiveBackgroundColor: colors.primarySoft,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              height: tabBarHeight,
              paddingTop: spacing.xs,
              paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.sm,
              paddingHorizontal: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
              elevation: 0,
              shadowOpacity: 0,
            },
            tabBarItemStyle: {
              minHeight: 52,
              marginHorizontal: spacing.xs,
              borderRadius: radius.md,
            },
            tabBarIconStyle: {
              marginTop: 1,
            },
            tabBarLabelStyle: {
              marginTop: 1,
              fontSize: typography.small,
              fontWeight: '700',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="quran"
            options={{
              title: 'Quran',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="book-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="learn"
            options={{
              title: 'Learn',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="school-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="prayer"
            options={{
              title: 'Prayer',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="moon-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen name="travel" options={{ href: null }} />
        </Tabs>
      </AppStateProvider>
    </AuthProvider>
  );
}
