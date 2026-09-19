import type { GlobalSearchPort } from './types';

const items = [
  { type: 'quran_surah' as const, id: 1, title: 'Al-Fatihah', subtitle: 'الفاتحة', route: '/quran' },
  { type: 'hadith' as const, id: 'demo-hadith', title: 'The intention', subtitle: 'Hadith learning reference', route: '/knowledge' },
  { type: 'dua' as const, id: 'morning', title: 'Morning Dua', subtitle: 'Daily remembrance', route: '/dua' },
  { type: 'learning_course' as const, id: 'quran-foundations', title: 'Quran Foundations', subtitle: 'Build a strong foundation for reading the Quran.', route: '/course/quran-foundations' },
];

export const mockSearch: GlobalSearchPort = {
  async search(query) {
    const q = query.trim().toLowerCase();
    const results = q.length < 2 ? [] : items.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(q));
    return { query, results, total: results.length };
  },
};
