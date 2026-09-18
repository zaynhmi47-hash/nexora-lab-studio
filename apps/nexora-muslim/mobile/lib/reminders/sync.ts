import { AppState, type AppStateStatus } from "react-native";
import type { PrayerPort } from "@/lib/prayer";
import type { ReminderPort } from "./types";
import { cancelPrayerReminders, schedulePrayerReminders } from "./scheduler";

export async function syncPrayerReminders(
  reminderRepository: ReminderPort,
  prayerRepository: PrayerPort,
): Promise<void> {
  const preference = await reminderRepository.getPrayerPreference();
  if (!preference.enabled) {
    await cancelPrayerReminders();
    return;
  }
  const schedule = await prayerRepository.getDailySchedule();
  await schedulePrayerReminders(schedule, preference.beforeMinutes);
}

export function subscribeToPrayerReminderResync(
  sync: () => Promise<void>,
): () => void {
  let syncing = false;
  const listener = (state: AppStateStatus) => {
    if (state !== "active" || syncing) return;
    syncing = true;
    void sync().finally(() => { syncing = false; });
  };
  const subscription = AppState.addEventListener("change", listener);
  return () => subscription.remove();
}
