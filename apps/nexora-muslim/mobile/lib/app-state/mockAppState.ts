import { mockDhikrRepository } from '../dhikr/mockDhikr';
import { mockLearning } from '../learning/mockLearning';
import { mockProfileRepository } from '../profile/mockProfile';
import { mockQuran } from '../quran/mockQuran';
import { mockUmrahRepository } from '../umrah/repository';
import type { AppStateRepository, AppStateSnapshot } from './types';

export const mockAppStateRepository: AppStateRepository = {
  async getSnapshot(userId: string): Promise<AppStateSnapshot> {
    const [learning, readingPosition, bookmarks, dhikr, umrah, profile] = await Promise.all([
      mockLearning.getProgress(userId),
      mockQuran.getReadingPosition(),
      mockQuran.listBookmarks(),
      mockDhikrRepository.getAll(),
      mockUmrahRepository.getJourney(),
      mockProfileRepository.getSnapshot(),
    ]);

    const totalCompleted = dhikr.reduce((sum, item) => sum + item.completed, 0);
    const totalTargets = dhikr.reduce((sum, item) => sum + item.target, 0);
    const completedGoals = dhikr.filter((item) => item.completed >= item.target).length;

    return {
      userId,
      learning: {
        xp: learning.xp,
        level: learning.level,
        currentStreak: learning.currentStreak,
        completedLessons: learning.completedLessonIds.length,
      },
      quran: {
        readingPosition,
        bookmarkCount: bookmarks.length,
      },
      dhikr: {
        totalCompleted,
        totalTargets,
        completedGoals,
        goalCount: dhikr.length,
      },
      umrah: {
        overallProgress: umrah.overallProgress,
        currentStageId: umrah.currentStageId,
      },
      profile: {
        preferences: profile.preferences,
      },
      syncedAt: new Date().toISOString(),
    };
  },
};
