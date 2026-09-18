import { router } from "expo-router";
import type * as Notifications from "expo-notifications";

export function handlePrayerNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data;
  if (data?.type === "prayer-reminder" && data.screen === "/prayer") {
    router.push("/prayer");
  }
}
