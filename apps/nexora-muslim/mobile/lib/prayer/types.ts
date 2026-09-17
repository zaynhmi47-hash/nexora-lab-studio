export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerTime = {
  name: PrayerName;
  time: string;
  completed: boolean;
  isNext: boolean;
};

export type DailyPrayerSchedule = {
  dateLabel: string;
  locationLabel: string;
  hijriLabel: string;
  prayers: PrayerTime[];
  sunrise: string;
};

export type DhikrItem = {
  id: string;
  title: string;
  target: number;
  completed: number;
};

/**
 * Provider boundary for prayer data.
 *
 * The UI depends on this contract rather than a concrete calculation service,
 * so a backend or local calculation provider can be introduced later without
 * changing the prayer screen.
 */
export interface PrayerPort {
  getDailySchedule(): Promise<DailyPrayerSchedule>;
  setPrayerCompleted(
    prayerName: PrayerName,
    completed: boolean,
  ): Promise<DailyPrayerSchedule>;
}
