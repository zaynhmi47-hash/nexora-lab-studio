import type {
  Bookmark,
  QuranPage,
  QuranPort,
  ReadingPosition,
  Recitation,
  SurahSummary,
} from './types';

const surahs: SurahSummary[] = [
  { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', revelationPlace: 'makkah', ayahCount: 7 },
  { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', revelationPlace: 'madinah', ayahCount: 286 },
  { number: 3, name: 'Ali Imran', arabicName: 'آل عمران', revelationPlace: 'madinah', ayahCount: 200 },
  { number: 36, name: 'Ya-Sin', arabicName: 'يس', revelationPlace: 'makkah', ayahCount: 83 },
  { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', revelationPlace: 'madinah', ayahCount: 78 },
  { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', revelationPlace: 'makkah', ayahCount: 4 },
  { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', revelationPlace: 'makkah', ayahCount: 5 },
  { number: 114, name: 'An-Nas', arabicName: 'الناس', revelationPlace: 'makkah', ayahCount: 6 },
];

const pages: Record<number, QuranPage> = {
  2: {
    surah: surahs[1],
    ayahs: [
      {
        surahNumber: 2,
        numberInSurah: 153,
        arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
        translation: 'O believers! Seek comfort in patience and prayer.',
      },
    ],
  },
};

let readingPosition: ReadingPosition = {
  surahNumber: 2,
  ayahNumber: 153,
  updatedAt: new Date().toISOString(),
};

let bookmarks: Bookmark[] = [];

const recitations: Recitation[] = [
  { id: 'demo-1', name: 'Demo Recitation', language: 'ar', audioUrl: '' },
];

export const mockQuran: QuranPort = {
  async listSurahs() {
    return surahs;
  },
  async getSurah(surahNumber) {
    return pages[surahNumber] ?? null;
  },
  async getReadingPosition() {
    return readingPosition;
  },
  async saveReadingPosition(position) {
    readingPosition = position;
  },
  async listBookmarks() {
    return bookmarks;
  },
  async saveBookmark(bookmark) {
    bookmarks = [bookmark, ...bookmarks.filter((item) => item.id !== bookmark.id)];
  },
  async removeBookmark(bookmarkId) {
    bookmarks = bookmarks.filter((item) => item.id !== bookmarkId);
  },
  async listRecitations() {
    return recitations;
  },
};
