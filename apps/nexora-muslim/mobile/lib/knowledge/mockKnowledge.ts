import type { IslamicKnowledgeProvider, IslamicKnowledgeSnapshot, HadithFavorite, SourceReference } from './types';

export const mockKnowledgeSnapshot: IslamicKnowledgeSnapshot = {
  topics: [
    { id: 'quran', title: 'Quran', description: 'Reading, study, and source-aware learning.', sourceCount: 1 },
    { id: 'hadith', title: 'Hadith', description: 'Hadith discovery with collection and reference metadata.', sourceCount: 1 },
    { id: 'fiqh', title: 'Fiqh & Practice', description: 'Guidance should preserve scholarly differences and cite sources.', sourceCount: 0 },
    { id: 'sirah', title: 'Sirah & History', description: 'Curated historical learning with source context.', sourceCount: 0 },
  ],
  hadith: [{
    id: 'hadith-placeholder-001',
    title: 'Reference-ready hadith entry',
    collection: 'Verified source required',
    reference: 'Reference to be populated from an approved hadith dataset',
    grade: 'unknown',
    summary: 'Production content must be imported from a verified source and retain its collection, reference, and grading metadata.',
    source: { id: 'source-placeholder', title: 'Approved hadith source', type: 'hadith' },
  }],
};
let favorites: HadithFavorite[] = [];
export const mockKnowledgeProvider: IslamicKnowledgeProvider = {
  async getSnapshot() { return mockKnowledgeSnapshot; },
  async getTopic(topicId) { return mockKnowledgeSnapshot.topics.find((item) => item.id === topicId) ?? null; },
  async getHadith(hadithId) { return mockKnowledgeSnapshot.hadith.find((item) => item.id === hadithId) ?? null; },
  async listSources(topicId) {
    if (!topicId) return [];
    const topic = mockKnowledgeSnapshot.topics.find((item) => item.id === topicId);
    if (!topic || topic.id !== 'hadith') return [];
    return mockKnowledgeSnapshot.hadith.map((item) => item.source);
  },
  async listHadithFavorites() { return favorites.map((item) => ({ ...item })); },
  async toggleHadithFavorite(hadithId) {
    const existing = favorites.find((item) => item.id === hadithId);
    if (existing) { favorites = favorites.filter((item) => item.id !== hadithId); return false; }
    const item = mockKnowledgeSnapshot.hadith.find((entry) => entry.id === hadithId);
    if (!item) return false;
    favorites = [{ ...item, favoriteId: 'fav-' + hadithId }, ...favorites];
    return true;
  },
};
