import type { ProfilePreferences } from '../profile/types';
import type { ReadingPosition } from '../quran/types';

export type AppStateSnapshot = {
  userId: string;
  learning: {
    xp: number;
    level: number;
    currentStreak: number;
    completedLessons: number;
  };
  quran: {
    readingPosition: ReadingPosition | null;
    bookmarkCount: number;
  };
  dhikr: {
    totalCompleted: number;
    totalTargets: number;
    completedGoals: number;
    goalCount: number;
  };
  umrah: {
    overallProgress: number;
    currentStageId: string;
  };
  profile: {
    preferences: ProfilePreferences;
  };
  syncedAt: string;
};

export interface AppStateRepository {
  getSnapshot(userId: string): Promise<AppStateSnapshot>;
}
