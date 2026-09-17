import type { ProfileRepository, ProfileSnapshot } from './types';

let snapshot: ProfileSnapshot = {
  progress: {
    quranReading: 78,
    tajwid: 60,
    arabic: 40,
    kitabKuning: 30,
  },
  stats: {
    learningXp: 60,
    learningLevel: 3,
    currentStreak: 17,
    completedLessons: 2,
    savedBookmarks: 1,
  },
  preferences: {
    notificationsEnabled: true,
    showArabicTransliteration: true,
  },
};

export const mockProfileRepository: ProfileRepository = {
  async getSnapshot() {
    return structuredClone(snapshot);
  },
  async updatePreferences(preferences) {
    snapshot = {
      ...snapshot,
      preferences: { ...preferences },
    };
    return structuredClone(snapshot);
  },
};
