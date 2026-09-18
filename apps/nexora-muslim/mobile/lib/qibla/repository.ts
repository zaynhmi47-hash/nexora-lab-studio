import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { Coordinates, QiblaDirection, QiblaProvider } from './types';

export const nexoraCoreQiblaProvider = (session: AuthSession, coordinates: Coordinates): QiblaProvider => ({
  async getDirection(): Promise<QiblaDirection> {
    const response = await fetch(`${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/qibla/direction/`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify(coordinates),
    });
    if (!response.ok) throw new Error(`Nexora Core qibla request failed (${response.status}).`);
    return (await response.json()) as QiblaDirection;
  },
});
