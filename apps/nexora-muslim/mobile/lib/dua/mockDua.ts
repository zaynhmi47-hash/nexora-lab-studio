import type { DuaFavorite, DuaPort } from './types';

let favorites: DuaFavorite[] = [];

const entries = [
  {
    id: 'before-sleep',
    title: 'Before Sleep',
    category: 'daily',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: '',
    translation: 'In Your name, O Allah, I die and I live.',
    reference: 'Sahih al-Bukhari',
  },
  {
    id: 'leaving-home',
    title: 'Leaving Home',
    category: 'daily',
    arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ',
    transliteration: '',
    translation: 'In the name of Allah, I place my trust in Allah.',
    reference: 'Abu Dawud, al-Tirmidhi',
  },
];

export const mockDua: DuaPort = {
  list: async (category) =>
    category
      ? entries.filter((entry) => entry.category === category)
      : entries,
  listFavorites: async () => favorites,
  toggleFavorite: async (duaId) => {
    const existing = favorites.find((item) => item.id === duaId);

    if (existing) {
      favorites = favorites.filter((item) => item.id !== duaId);
      return false;
    }

    const dua = entries.find((item) => item.id === duaId);
    if (!dua) return false;

    favorites = [{ ...dua, favoriteId: 'fav-' + duaId }, ...favorites];
    return true;
  },
};
