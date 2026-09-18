import * as Notifications from "expo-notifications";
import type { DailyPrayerSchedule, PrayerName } from "@/lib/prayer/types";

const CHANNEL_ID = "prayer-reminders";
const PRAYER_NAMES: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export async function cancelPrayerReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function schedulePrayerReminders(
  schedule: DailyPrayerSchedule,
  beforeMinutes: number,
): Promise<string[]> {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Prayer reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  const ids: string[] = [];
  for (const prayer of schedule.prayers) {
    if (!PRAYER_NAMES.includes(prayer.name)) continue;
    const parts = prayer.time.match(/^(\d{1,2}):(\d{2})$/);
    if (!parts) continue;
    const hour = Number(parts[1]);
    const minute = Number(parts[2]) - beforeMinutes;
    const total = hour * 60 + minute;
    const dayOffset = total < 0 ? -1 : Math.floor(total / 1440);
    const normalized = ((total % 1440) + 1440) % 1440;
    const trigger = { hour: Math.floor(normalized / 60), minute: normalized % 60, repeats: true as const };
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayer.name} prayer`,
        body: beforeMinutes > 0 ? `Prayer time is in ${beforeMinutes} minutes.` : "It is time for prayer.",
        data: { screen: "prayer", prayer: prayer.name, dayOffset },
        sound: "default",
      },
      trigger,
    });
    ids.push(id);
  }
  return ids;
}
