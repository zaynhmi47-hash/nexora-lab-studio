import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { DailyPrayerSchedule, PrayerName, PrayerPort } from './types';

const url = () => env.nexoraCoreUrl.replace(/\/$/, '') + '/api/v1/prayer/';
async function request(session: AuthSession, init?: RequestInit): Promise<DailyPrayerSchedule> {
  const response = await fetch(url(), { ...init, headers: { Accept: 'application/json', Authorization: 'Bearer ' + session.accessToken, ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error('Nexora Core prayer request failed (' + response.status + ').');
  return (await response.json()) as DailyPrayerSchedule;
}

export const nexoraCorePrayerRepository = (session: AuthSession): PrayerPort => ({
  getDailySchedule: () => request(session),
  setPrayerCompleted: (prayerName: PrayerName, completed: boolean) => request(session, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: prayerName, completed }) }),
});
