import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { AppStateRepository, AppStateSnapshot } from './types';

function getAppStateUrl() {
  return `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/app-state/`;
}

export const nexoraCoreAppStateRepository = (
  session: AuthSession,
): AppStateRepository => ({
  async getSnapshot(userId: string): Promise<AppStateSnapshot> {
    if (session.user.id !== userId) {
      throw new Error('App state user does not match the authenticated NEXORA identity.');
    }

    const response = await fetch(getAppStateUrl(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Nexora Core app-state request failed (${response.status}).`);
    }

    return (await response.json()) as AppStateSnapshot;
  },
});
