import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<Notifications.NotificationPermissionsStatus> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("prayer-reminders", {
      name: "Prayer reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return current;
  return Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
