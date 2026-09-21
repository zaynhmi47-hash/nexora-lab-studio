import type { AuthSession } from '../auth/types';
export type CoreClient = { get: <T>(path: string, session: AuthSession) => Promise<T> };
export function createCoreClient(baseUrl: string): CoreClient { return { async get<T>(path: string, session: AuthSession) { const response = await fetch(baseUrl.replace(/\/$/, '') + path, { headers: { Authorization: 'Bearer ' + session.accessToken, Accept: 'application/json' } }); if (!response.ok) throw new Error('Nexora Core request failed: ' + response.status); return response.json() as Promise<T>; } }; }
