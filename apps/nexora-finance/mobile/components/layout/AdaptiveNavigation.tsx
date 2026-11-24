import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useResponsive } from '@/lib/responsive';
import { useTheme } from '@/lib/theme';

const items = [
  { name: 'index', title: 'Home', icon: 'home-outline' as const, href: '/(tabs)' as const },
  { name: 'transactions', title: 'Finance', icon: 'swap-horizontal-outline' as const, href: '/(tabs)/transactions' as const },
  { name: 'budgets', title: 'Budgets', icon: 'pie-chart-outline' as const, href: '/(tabs)/budgets' as const },
  { name: 'goals', title: 'Goals', icon: 'flag-outline' as const, href: '/(tabs)/goals' as const },
  { name: 'profile', title: 'Profile', icon: 'person-outline' as const, href: '/(tabs)/profile' as const },
];

function isActiveRoute(pathname: string, name: string) {
  if (name === 'index') {
    return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
  }
  return pathname.endsWith('/' + name);
}

export function AdaptiveNavigation() {
  const { isMobile, isTablet } = useResponsive();
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const desktop = !isMobile;

  return (
    <View style={styles.root}>
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
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
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

      {desktop ? (
        <View
          style={[
            styles.sidebar,
            {
              width: isTablet ? 80 : 240,
              borderRightColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[styles.brand, { color: theme.colors.text }]}>
            {isTablet ? 'N' : 'NEXORA'}
          </Text>
          <View style={styles.navItems}>
            {items.map((item) => {
              const active = isActiveRoute(pathname, item.name);
              return (
                <Pressable
                  key={item.name}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityState={{ selected: active }}
                  onPress={() => router.navigate(item.href)}
                  style={[
                    styles.navItem,
                    isTablet && styles.navItemCompact,
                    active && { backgroundColor: theme.colors.primary + '14' },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={21}
                    color={active ? theme.colors.primary : theme.colors.muted}
                  />
                  {!isTablet ? (
                    <Text
                      style={[
                        styles.navLabel,
                        { color: active ? theme.colors.primary : theme.colors.textSecondary },
                        active && styles.navLabelActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {!isTablet ? (
            <Text style={[styles.sidebarFooter, { color: theme.colors.muted }]}>
              Finance workspace
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sidebar: {
    position: 'absolute',
    zIndex: 10,
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: 1, paddingHorizontal: 12, paddingBottom: 28 },
  navItems: { gap: 6 },
  navItem: { minHeight: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12 },
  navItemCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  navLabel: { fontSize: 14, fontWeight: '600' },
  navLabelActive: { fontWeight: '800' },
  sidebarFooter: { marginTop: 'auto', paddingHorizontal: 12, paddingBottom: 20, fontSize: 11 },
});
