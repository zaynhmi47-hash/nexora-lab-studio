import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { useDatingApi } from '@/src/api/provider';
import { useDatingSession } from '@/src/auth/session';

export function DatingPushRegistration() {
  const api = useDatingApi();
  const { token } = useDatingSession();

  useEffect(() => {
    if (!token || Platform.OS === 'web') return;

    let cancelled = false;
    const register = async () => {
      const permissions = await Notifications.getPermissionsAsync();
      let status = permissions.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted' || cancelled) return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const pushToken = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      if (!cancelled) await api.registerPushToken(pushToken.data, Platform.OS);
    };

    void register();
    return () => { cancelled = true; };
  }, [api, token]);

  return null;
}
