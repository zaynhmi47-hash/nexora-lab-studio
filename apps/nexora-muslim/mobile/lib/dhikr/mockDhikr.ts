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

function findDhikr(dhikrId: string): Dhikr {
  const dhikr = mockDhikrList.find((item) => item.id === dhikrId);
  if (!dhikr) {
    throw new Error(`Dhikr not found: ${dhikrId}`);
  }
  return dhikr;
}

export const mockDhikrRepository: DhikrRepository = {
  async getAll() {
    return mockDhikrList.map((item) => ({ ...item }));
  },

  async increment(dhikrId) {
    const dhikr = findDhikr(dhikrId);
    dhikr.completed = Math.min(dhikr.target, dhikr.completed + 1);

    history.push({
      id: `history-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      dhikrId,
      count: 1,
      occurredAt: new Date().toISOString(),
    });

    return { ...dhikr };
  },

  async reset(dhikrId) {
    const dhikr = findDhikr(dhikrId);
    dhikr.completed = 0;
    return { ...dhikr };
  },

  async getHistory(dhikrId) {
    return history
      .filter((entry) => !dhikrId || entry.dhikrId === dhikrId)
      .map((entry) => ({ ...entry }));
  },
};
