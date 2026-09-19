export type GlobalSearchResultType = 'quran_surah' | 'quran_ayah' | 'hadith' | 'dua' | 'learning_lesson' | 'learning_course';

export type GlobalSearchResult = {
  type: GlobalSearchResultType;
  id: string | number;
  title: string;
  subtitle: string;
  route: string;
};

export type GlobalSearchResponse = {
  query: string;
  results: GlobalSearchResult[];
  total: number;
};

export interface GlobalSearchPort {
  search(query: string): Promise<GlobalSearchResponse>;
}
