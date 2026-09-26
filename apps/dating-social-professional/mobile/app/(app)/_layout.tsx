import { Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';
import { usePushRegistration } from '@/src/push/use-push-registration';

export default function AppLayout() {
  usePushRegistration();
  const api = useDatingApi();
  const notifications = useQuery({ queryKey: ['dating', 'notifications'], queryFn: () => api.getNotifications(), refetchInterval: 30000 });
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarBadge: notifications.data?.unreadCount ? (notifications.data.unreadCount > 99 ? '99+' : notifications.data.unreadCount) : undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="profile/[profileId]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}