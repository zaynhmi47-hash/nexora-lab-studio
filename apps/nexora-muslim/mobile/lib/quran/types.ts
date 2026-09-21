export type SurahSummary = { number: number; name: string; arabicName: string; revelationPlace: 'makkah' | 'madinah'; ayahCount: number; };
export type Ayah = { surahNumber: number; numberInSurah: number; globalNumber?: number; arabicText: string; translation?: string; };
export type QuranPage = { surah: SurahSummary; ayahs: Ayah[]; };
export type Recitation = { id: string; name: string; language: string; audioUrl: string; };
export type Bookmark = { id: string; surahNumber: number; ayahNumber: number; note?: string; createdAt: string; };
export type ReadingPosition = { surahNumber: number; ayahNumber: number; updatedAt: string; };
export type QuranReadingGoal = { dailyTargetPages: number; dailyTargetMinutes: number; };
export type QuranReadingLog = { date: string; pages: number; minutes: number; };
export type QuranReadingStatistics = {
  goal: QuranReadingGoal;
  today: { pages: number; minutes: number; pagesProgress: number; minutesProgress: number };
  currentStreak: number;
  total: { pages: number; minutes: number };
};
export interface QuranPort {
  listSurahs(): Promise<SurahSummary[]>;
  getSurah(surahNumber: number): Promise<QuranPage | null>;
  getReadingPosition(): Promise<ReadingPosition | null>;
  saveReadingPosition(position: ReadingPosition): Promise<void>;
  listBookmarks(): Promise<Bookmark[]>;
  saveBookmark(bookmark: Bookmark): Promise<void>;
  removeBookmark(bookmarkId: string): Promise<void>;
  listRecitations(): Promise<Recitation[]>;
  getReadingGoal(): Promise<QuranReadingGoal>;
  updateReadingGoal(value: QuranReadingGoal): Promise<QuranReadingGoal>;
  getReadingStatistics(): Promise<QuranReadingStatistics>;
  logReading(log: QuranReadingLog): Promise<QuranReadingStatistics>;
}
