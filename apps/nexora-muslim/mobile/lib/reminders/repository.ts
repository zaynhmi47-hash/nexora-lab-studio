import type { AuthSession } from "@/lib/auth/types";
import type { PrayerReminderPreference, ReminderPort } from "./types";
const baseUrl = process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? "http://localhost:8000";
export const nexoraCoreReminderRepository = (session: AuthSession): ReminderPort => ({
  getPrayerPreference: async () => {
    const r = await fetch(baseUrl + "/api/v1/reminders/prayer/", { headers: { Authorization: "Bearer " + session.accessToken } });
    if (!r.ok) throw new Error("Reminder request failed.");
    return r.json() as Promise<PrayerReminderPreference>;
  },
  updatePrayerPreference: async (value) => {
    const r = await fetch(baseUrl + "/api/v1/reminders/prayer/", {
      method: "PUT", headers: { Authorization: "Bearer " + session.accessToken, "Content-Type": "application/json" }, body: JSON.stringify(value),
    });
    if (!r.ok) throw new Error("Reminder update failed.");
    return r.json() as Promise<PrayerReminderPreference>;
  },
});
