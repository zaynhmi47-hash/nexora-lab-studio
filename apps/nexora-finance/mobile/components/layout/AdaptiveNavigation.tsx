import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';

const items = [
  { name: 'index', title: 'Home', icon: 'home-outline' as const },
  { name: 'transactions', title: 'Finance', icon: 'swap-horizontal-outline' as const },
  { name: 'budgets', title: 'Budgets', icon: 'pie-chart-outline' as const },
  { name: 'goals', title: 'Goals', icon: 'flag-outline' as const },
  { name: 'profile', title: 'Profile', icon: 'person-outline' as const },
];

export function AdaptiveNavigation() {
  const { width } = useWindowDimensions();
  const { isMobile, isTablet } = useResponsive();

  // Keep Expo Router as the single navigation source of truth.
  // Presentation adapts by viewport instead of creating platform-specific routes.
  const desktop = width >= 1024;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarStyle: {
            display: isMobile ? 'flex' : 'none',
            height: 64,
            paddingTop: 6,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIconStyle: { marginTop: 2 },
        }}
      >
        {items.map((item) => (
          <Tabs.Screen
            key={item.name}
            name={item.name}
            options={{
              title: item.title,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={item.icon} color={color} size={size} />
              ),
            }}
          />
        ))}
      </Tabs>
      {!isMobile && (
        <View
          accessibilityRole="navigation"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: isTablet ? 80 : 240,
            borderRightWidth: 1,
            borderRightColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingTop: 24,
          }}
        >
          {items.map((item) => (
            <View key={item.name} style={{ padding: 16 }}>
              <Ionicons name={item.icon} size={22} color={theme.colors.text} />
            </View>
          ))}
        </View>
      )}
      {desktop && null}
    </View>
  );
}
