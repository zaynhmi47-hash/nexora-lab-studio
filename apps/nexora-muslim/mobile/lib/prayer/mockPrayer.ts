import type { DailyPrayerSchedule, DhikrItem, PrayerPort } from './types';

export const mockPrayerSchedule: DailyPrayerSchedule = {
  dateLabel: 'Today',
  locationLabel: 'Current location',
  hijriLabel: 'Hijri date will be provided by the prayer service',
  sunrise: '05:58',
  prayers: [
    { name: 'Fajr', time: '05:01', completed: true, isNext: false },
    { name: 'Dhuhr', time: '12:02', completed: true, isNext: false },
    { name: 'Asr', time: '15:18', completed: false, isNext: false },
    { name: 'Maghrib', time: '18:02', completed: false, isNext: true },
    { name: 'Isha', time: '19:12', completed: false, isNext: false },
  ],
};

export const mockDhikr: DhikrItem[] = [
  { id: 'morning', title: 'Morning adhkar', target: 10, completed: 6 },
  { id: 'istighfar', title: 'Istighfar', target: 100, completed: 37 },
  { id: 'salawat', title: 'Salawat', target: 100, completed: 24 },
];

let prayerState: DailyPrayerSchedule = {
  ...mockPrayerSchedule,
  prayers: mockPrayerSchedule.prayers.map((prayer) => ({ ...prayer })),
};

export const mockPrayerRepository: PrayerPort = {
  async getDailySchedule() {
    return {
      ...prayerState,
      prayers: prayerState.prayers.map((prayer) => ({ ...prayer })),
    };
  },

  async setPrayerCompleted(prayerName, completed) {
    prayerState = {
      ...prayerState,
      prayers: prayerState.prayers.map((prayer) =>
        prayer.name === prayerName
          ? { ...prayer, completed }
          : { ...prayer },
      ),
    };

    return {
      ...prayerState,
      prayers: prayerState.prayers.map((prayer) => ({ ...prayer })),
    };
  },
};
