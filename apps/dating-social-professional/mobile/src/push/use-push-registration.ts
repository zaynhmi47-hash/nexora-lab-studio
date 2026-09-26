import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useDatingApi } from '@/src/api/provider';

export function usePushRegistration() {
  const api = useDatingApi();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;

    const register = async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (!active || status !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (active) await api.registerPushToken(token.data, Platform.OS);
      } catch {
        // Push registration is best-effort and must not block app startup.
      }
    };

    void register();
    return () => { active = false; };
  }, [api]);
}