import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useDatingApi } from '@/src/api/provider';
import { usePushRegistration } from '@/src/push/use-push-registration';
import { datingColors } from '@/src/ui/tokens';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<string, { active: TabIconName; inactive: TabIconName }> = {
  moments: { active: 'play-circle', inactive: 'play-circle-outline' },
  discover: { active: 'compass', inactive: 'compass-outline' },
  matches: { active: 'heart', inactive: 'heart-outline' },
  chats: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function AppLayout() {
  usePushRegistration();
  const api = useDatingApi();
  const notifications = useQuery({
    queryKey: ['dating', 'notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 30000,
  });

  return (
    <Tabs
      screenOptions={({ route }) => {
        const icons = tabIcons[route.name] ?? tabIcons.discover;
        return {
          headerShown: false,
          tabBarActiveTintColor: datingColors.primary,
          tabBarInactiveTintColor: datingColors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: 1,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size + (focused ? 1 : 0)}
              color={color}
            />
          ),
          tabBarStyle: {
            height: 66,
            paddingTop: 7,
            paddingBottom: 7,
            paddingHorizontal: 3,
            backgroundColor: datingColors.surface,
            borderTopColor: datingColors.border,
            borderTopWidth: 1,
            elevation: 12,
            shadowColor: '#21182B',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
          },
          tabBarItemStyle: { paddingVertical: 1 },
          tabBarHideOnKeyboard: true,
        };
      }}
    >
      <Tabs.Screen name="moments" options={{ title: 'Moments' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: notifications.data?.unreadCount
            ? notifications.data.unreadCount > 99
              ? '99+'
              : notifications.data.unreadCount
            : undefined,
          tabBarBadgeStyle: {
            backgroundColor: datingColors.accent,
            color: datingColors.white,
            fontSize: 9,
            fontWeight: '800',
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="profile/[profileId]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
