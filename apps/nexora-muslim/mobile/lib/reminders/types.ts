export type PrayerReminderPreference = { enabled: boolean; beforeMinutes: number };
export interface ReminderPort {
  getPrayerPreference(): Promise<PrayerReminderPreference>;
  updatePrayerPreference(value: PrayerReminderPreference): Promise<PrayerReminderPreference>;
}
