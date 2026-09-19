import type { RamadanDashboard, RamadanPort } from './types';

const mockDashboard: RamadanDashboard = {
  isRamadan: false,
  year: 2026,
  day: null,
  startDate: '2026-02-18',
  endDate: '2026-03-19',
  dateStatus: 'outside_season',
  sourceStatus: 'Demo dates only; verify with the local moon-sighting authority.',
  fasting: { fastedDays: 0, brokenDays: 0, excusedDays: 0 },
  targets: { quranPages: 4, dhikrCount: 100, learningMinutes: 15 },
};

export const mockRamadan: RamadanPort = {
  getDashboard: async () => mockDashboard,
};
