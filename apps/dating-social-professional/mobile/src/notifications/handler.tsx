import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function openNotification(data: Record<string, unknown>) {
  if (data.type === 'message' && typeof data.conversation_id === 'string') {
    router.push(`/(tabs)/chat/${data.conversation_id}`);
    return;
  }

  if (data.type === 'match') {
    router.push('/(tabs)/matches');
  }
}

export function DatingNotificationHandler() {
  useEffect(() => {
    let mounted = true;

    const openInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (mounted && response) {
        openNotification(response.notification.request.content.data as Record<string, unknown>);
      }
    };

    void openInitialNotification();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotification(response.notification.request.content.data as Record<string, unknown>);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return null;
}
