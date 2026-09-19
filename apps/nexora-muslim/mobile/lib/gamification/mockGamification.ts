import type { GamificationActivity, GamificationPort, GamificationStatistics } from './types';

const activities: GamificationActivity[] = [
  { id: 'activity-1', source: 'learning', action: 'lesson_completed', sourceKey: 'harakat', xpEarned: 20, occurredAt: '2026-09-19T08:00:00.000Z' },
  { id: 'activity-2', source: 'tajwid', action: 'practice_completed', sourceKey: 'makharij-1', xpEarned: 5, occurredAt: '2026-09-19T08:30:00.000Z' },
  { id: 'activity-3', source: 'arabic', action: 'lesson_completed', sourceKey: 'arabic-umrah-1', xpEarned: 30, occurredAt: '2026-09-18T08:00:00.000Z' },
  { id: 'activity-4', source: 'learning', action: 'lesson_completed', sourceKey: 'arabic-alphabet', xpEarned: 20, occurredAt: '2026-09-17T08:00:00.000Z' },
  { id: 'activity-5', source: 'tajwid', action: 'topic_completed', sourceKey: 'noon-sakinah', xpEarned: 25, occurredAt: '2026-09-16T08:00:00.000Z' },
  { id: 'activity-6', source: 'arabic', action: 'lesson_completed', sourceKey: 'arabic-umrah-2', xpEarned: 25, occurredAt: '2026-09-15T08:00:00.000Z' },
  { id: 'activity-7', source: 'gamification', action: 'milestone_unlocked', sourceKey: 'xp-100', xpEarned: 0, occurredAt: '2026-09-19T09:00:00.000Z' },
];

function statistics(days: number): GamificationStatistics {
  const normalizedDays = Math.min(Math.max(days, 1), 90);
  const cutoff = Date.now() - normalizedDays * 24 * 60 * 60 * 1000;
  const recent = activities.filter((item) => new Date(item.occurredAt).getTime() >= cutoff);
  const bySource = { learning: 0, tajwid: 0, arabic: 0, gamification: 0 };
  const byDate = new Map<string, number>();

  for (const item of recent) {
    bySource[item.source] += item.xpEarned;
    const date = item.occurredAt.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + item.xpEarned);
  }

  const dailyXp = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xp]) => ({ date, xp }));

  return {
    days: normalizedDays,
    totalXp: recent.reduce((sum, item) => sum + item.xpEarned, 0),
    activityCount: recent.length,
    bySource,
    dailyXp,
  };
}

export const mockGamification: GamificationPort = {
  async getActivities(limit = 50) {
    return activities.slice(0, Math.min(Math.max(limit, 1), 100)).map((item) => ({ ...item }));
  },
  async getStatistics(days = 30) {
    return statistics(days);
  },
};
