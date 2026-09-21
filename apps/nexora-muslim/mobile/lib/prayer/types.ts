export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type PrayerTime = { name: PrayerName; time: string; completed: boolean; isNext: boolean; };
export type DailyPrayerSchedule = { dateLabel: string; locationLabel: string; hijriLabel: string; prayers: PrayerTime[]; sunrise: string; };
export type PrayerPort = { getDailySchedule(): Promise<DailyPrayerSchedule>; setPrayerCompleted(prayerName: PrayerName, completed: boolean): Promise<DailyPrayerSchedule>; };
export type DhikrItem = { id: string; title: string; target: number; completed: number; };
