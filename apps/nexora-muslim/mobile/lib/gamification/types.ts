import type { GamificationActivity, GamificationStatistics } from '../learning/types';

export type { GamificationActivity, GamificationStatistics };

export type GamificationPort = {
  getActivities: (limit?: number) => Promise<GamificationActivity[]>;
  getStatistics: (days?: number) => Promise<GamificationStatistics>;
};
