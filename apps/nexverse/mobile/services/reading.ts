import AsyncStorage from '@react-native-async-storage/async-storage';
import { nexverseApiRequest } from './moderation';

export type ReadingProgress = {
  workId: string;
  workSlug: string;
  workTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  positionChars: number;
  progressPercent: number;
  updatedAt: string;
};

export type ReaderPreferences = {
  fontSize: number;
  lineHeight: number;
  theme: 'paper' | 'sepia' | 'dark';
};

const PREFERENCES_KEY = '@nexverse/reader-preferences/v1';
export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontSize: 17,
  lineHeight: 1.8,
  theme: 'paper',
};

export async function loadReaderPreferences(): Promise<ReaderPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_READER_PREFERENCES;
    const value = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      fontSize: typeof value.fontSize === 'number' ? Math.min(26, Math.max(14, value.fontSize)) : 17,
      lineHeight: typeof value.lineHeight === 'number' ? Math.min(2.2, Math.max(1.5, value.lineHeight)) : 1.8,
      theme: value.theme === 'sepia' || value.theme === 'dark' ? value.theme : 'paper',
    };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

export async function saveReaderPreferences(value: ReaderPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
}

export function getReadingProgress(workId: string) {
  return nexverseApiRequest<{ item: ReadingProgress | null }>(
    '/nexverse/reader/progress/' + encodeURIComponent(workId) + '/',
  );
}

export function listReadingProgress() {
  return nexverseApiRequest<{ items: ReadingProgress[] }>('/nexverse/reader/progress/');
}

export function saveReadingProgress(
  workId: string,
  input: { chapterId: string; positionChars: number; progressPercent: number },
) {
  return nexverseApiRequest<{ item: ReadingProgress }>(
    '/nexverse/reader/progress/' + encodeURIComponent(workId) + '/',
    { method: 'PUT', body: JSON.stringify(input) },
  );
}


export type BookmarkedWork = {
  workId: string;
  workSlug: string;
  title: string;
  author: string;
  coverImageUrl: string;
  genre: string;
  bookmarkedAt: string;
};

export function listBookmarkedWorks() {
  return nexverseApiRequest<{ items: BookmarkedWork[] }>('/nexverse/reader/bookmarks/');
}

export function addBookmark(workId: string) {
  return nexverseApiRequest<{ bookmarked: boolean; workId: string }>(
    '/nexverse/reader/bookmarks/' + encodeURIComponent(workId) + '/',
    { method: 'POST', body: '{}' },
  );
}

export function removeBookmark(workId: string) {
  return nexverseApiRequest<{ bookmarked: boolean; workId: string }>(
    '/nexverse/reader/bookmarks/' + encodeURIComponent(workId) + '/',
    { method: 'DELETE' },
  );
}
