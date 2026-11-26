import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { palette } from '@/components/ui';

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas }}><ActivityIndicator size="large" color={palette.primary} /></View>;
  }

  if (status !== 'signed_in') return <Redirect href="/sign-in" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: palette.primary,
      tabBarInactiveTintColor: '#9AA3B6',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 3 },
      tabBarStyle: { height: 65, paddingTop: 8, paddingBottom: 7, borderTopColor: palette.line, backgroundColor: '#FFFFFF' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="learning" options={{ title: 'Learning', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="academic" options={{ title: 'Academic', tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="journey" options={{ href: null }} />
      <Tabs.Screen name="skills" options={{ href: null }} />
      <Tabs.Screen name="lesson/[lessonKey]" options={{ href: null }} />
    </Tabs>
  );
}