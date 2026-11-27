import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { ProfilePreferences, ProfileRepository, ProfileSnapshot } from './types';

type ProfileWireSnapshot = Pick<ProfileSnapshot, 'progress' | 'preferences'> & {
  stats?: Partial<ProfileSnapshot['stats']>;
};

const baseUrl = () => `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/profile/`;

async function request(session: AuthSession, init?: RequestInit): Promise<ProfileSnapshot> {
  const response = await fetch(baseUrl(), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Nexora Core profile request failed (${response.status}).`);

  const wire = await response.json() as ProfileWireSnapshot;
  return {
    progress: wire.progress,
    preferences: wire.preferences,
    stats: {
      learningXp: wire.stats?.learningXp ?? 0,
      learningLevel: wire.stats?.learningLevel ?? 1,
      currentStreak: wire.stats?.currentStreak ?? 0,
      completedLessons: wire.stats?.completedLessons ?? 0,
      savedBookmarks: wire.stats?.savedBookmarks ?? 0,
    },
  };
}

export function nexoraCoreProfileRepository(session: AuthSession): ProfileRepository {
  return {
    getSnapshot: () => request(session),
    updatePreferences: (preferences: ProfilePreferences) =>
      request(session, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      }),
  };
}
