import type { Dhikr, DhikrRepository } from './types';

export const mockDhikrList: Dhikr[] = [
  {
    id: 'morning-praise',
    title: 'Morning praise',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhanallahi wa bihamdihi',
    translation: 'Glory is to Allah and praise is for Him.',
    target: 100,
    completed: 32,
    category: 'morning',
  },
  {
    id: 'istighfar',
    title: 'Istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness from Allah.',
    target: 100,
    completed: 37,
    category: 'general',
  },
  {
    id: 'salawat',
    title: 'Salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    translation: 'O Allah, send blessings upon Muhammad.',
    target: 100,
    completed: 24,
    category: 'general',
  },
];

export const mockDhikrRepository: DhikrRepository = {
  async getAll() {
    return mockDhikrList;
  },
};
