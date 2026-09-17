import type { Dhikr, DhikrHistoryEntry, DhikrRepository } from './types';

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

const history: DhikrHistoryEntry[] = [];

export const mockDhikrRepository: DhikrRepository = {
  async getAll() {
    return mockDhikrList.map((item) => ({ ...item }));
  },

  async increment(dhikrId) {
    const item = mockDhikrList.find((candidate) => candidate.id === dhikrId);
    if (!item) {
      throw new Error(`Dhikr not found: ${dhikrId}`);
    }

    if (item.completed < item.target) {
      item.completed += 1;
      history.push({
        id: `${dhikrId}-${Date.now()}-${history.length}`,
        dhikrId,
        count: 1,
        completedAt: new Date().toISOString(),
      });
    }

    return { ...item };
  },

  async reset(dhikrId) {
    const item = mockDhikrList.find((candidate) => candidate.id === dhikrId);
    if (!item) {
      throw new Error(`Dhikr not found: ${dhikrId}`);
    }

    item.completed = 0;
    return { ...item };
  },

  async getHistory(dhikrId) {
    return history
      .filter((entry) => !dhikrId || entry.dhikrId === dhikrId)
      .map((entry) => ({ ...entry }));
  },
};
