export type GamificationSource =
  | 'learning'
  | 'tajwid'
  | 'arabic'
  | 'gamification';

export type GamificationActivity = {
  id: string;
  source: GamificationSource;
  action: string;
  sourceKey: string;
  xpEarned: number;
  occurredAt: string;
};

export type GamificationStatistics = {
  days: number;
  totalXp: number;
  activityCount: number;
  bySource: Record<GamificationSource, number>;
  dailyXp: Array<{
    date: string;
    xp: number;
  }>;
};

export type GamificationPort = {
  getActivities: (limit?: number) => Promise<GamificationActivity[]>;
  getStatistics: (days?: number) => Promise<GamificationStatistics>;
};
