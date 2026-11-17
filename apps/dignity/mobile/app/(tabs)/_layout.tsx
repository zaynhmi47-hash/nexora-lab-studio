import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const { status } = useAuth();
  if (status === 'loading') return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (status !== 'signed_in') return <Redirect href="/sign-in" />;
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.line, height: 62, paddingTop: 6, paddingBottom: 7 },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="grow" options={{ title: 'Grow', tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="learning" options={{ title: 'Learn', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="academic" options={{ href: null }} />
    <Tabs.Screen name="career" options={{ href: null }} />
    <Tabs.Screen name="research" options={{ href: null }} />
    <Tabs.Screen name="mentor" options={{ href: null }} />
  </Tabs>;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } });
