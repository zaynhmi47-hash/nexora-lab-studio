import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { GamificationActivity, GamificationPort, GamificationStatistics } from './types';

export function nexoraCoreGamificationRepository(session: AuthSession): GamificationPort {
  const base = env.nexoraCoreUrl.replace(/\/$/, '');

  async function request<T>(path: string): Promise<T> {
    const response = await fetch(`${base}/api/v1/gamification/${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Nexora Core gamification request failed (${response.status}).`);
    }

    return (await response.json()) as T;
  }

  return {
    getActivities: (limit = 50) => request<GamificationActivity[]>(`activities/?limit=${Math.min(Math.max(limit, 1), 100)}`),
    getStatistics: (days = 30) => request<GamificationStatistics>(`statistics/?days=${Math.min(Math.max(days, 1), 90)}`),
  };
}
