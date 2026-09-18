import type { ReminderPort } from "./types";
let preference = { enabled: false, beforeMinutes: 10 };
export const mockReminders: ReminderPort = {
  getPrayerPreference: async () => preference,
  updatePrayerPreference: async (value) => { preference = value; return preference; },
};
