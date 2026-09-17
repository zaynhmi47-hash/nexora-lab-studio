export type ProfileProgress = {
  quranReading: number;
  tajwid: number;
  arabic: number;
  kitabKuning: number;
};

export type ProfileStats = {
  learningXp: number;
  learningLevel: number;
  currentStreak: number;
  completedLessons: number;
  savedBookmarks: number;
};

export type ProfilePreferences = {
  notificationsEnabled: boolean;
  showArabicTransliteration: boolean;
};

export type ProfileSnapshot = {
  progress: ProfileProgress;
  stats: ProfileStats;
  preferences: ProfilePreferences;
};

export interface ProfileRepository {
  getSnapshot(): Promise<ProfileSnapshot>;
  updatePreferences(preferences: ProfilePreferences): Promise<ProfileSnapshot>;
}
