import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type {
  Bookmark,
  QuranPage,
  QuranPort,
  ReadingPosition,
  Recitation,
  SurahSummary, QuranReadingGoal, QuranReadingLog, QuranReadingStatistics,
} from './types';

const baseUrl = () => `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/quran`;

async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Nexora Core Quran request failed (${response.status}).`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const nexoraCoreQuranRepository = (session: AuthSession): QuranPort => ({
  listSurahs: () => request<SurahSummary[]>(session, '/surahs/'),
  getSurah: async (surahNumber) => {
    try {
      return await request<QuranPage>(session, `/surahs/${surahNumber}/`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('(404)')) return null;
      throw error;
    }
  },
  getReadingPosition: () => request<ReadingPosition | null>(session, '/reading-position/'),
  saveReadingPosition: (position) => request(session, '/reading-position/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(position),
  }),
  listBookmarks: () => request<Bookmark[]>(session, '/bookmarks/'),
  saveBookmark: async (bookmark) => {
    const response = await request<Bookmark>(session, '/bookmarks/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surahNumber: bookmark.surahNumber,
        ayahNumber: bookmark.ayahNumber,
        note: bookmark.note ?? '',
      }),
    });
    return response;
  },
  removeBookmark: (bookmarkId) => request(session, `/bookmarks/${bookmarkId}/`, { method: 'DELETE' }),
  listRecitations: () => request<Recitation[]>(session, '/recitations/'),
  getReadingGoal: () => request<QuranReadingGoal>(session, '/goals/'),
  updateReadingGoal: (value) => request<QuranReadingGoal>(session, '/goals/', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }),
  getReadingStatistics: () => request<QuranReadingStatistics>(session, '/statistics/'),
  logReading: (log) => request<QuranReadingLog>(session, '/reading-log/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(log) }),
});
