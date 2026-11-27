import type {
  HadithFavorite,
  IslamicKnowledgeProvider,
  IslamicKnowledgeSnapshot,
  KnowledgeTopic,
  SourceReference,
} from './types';

export const mockKnowledgeSnapshot: IslamicKnowledgeSnapshot = {
  topics: [
    { id: 'quran', title: 'Quran', description: 'Reading, study, and source-aware learning.', sourceCount: 1 },
    { id: 'hadith', title: 'Hadith', description: 'Hadith discovery with collection and reference metadata.', sourceCount: 1 },
    { id: 'fiqh', title: 'Fiqh & Practice', description: 'Guidance should preserve scholarly differences and cite sources.', sourceCount: 0 },
    { id: 'sirah', title: 'Sirah & History', description: 'Curated historical learning with source context.', sourceCount: 0 },
  ],
  // Metadata-first prototype: no fabricated Arabic text or translation is presented.
  hadith: [
    {
      id: 'hadith-placeholder-001',
      title: 'Reference-ready hadith entry',
      collection: 'Verified source required',
      reference: 'Reference to be populated from an approved hadith dataset',
      grade: 'unknown',
      summary: 'Production content must be imported from a verified source and retain its collection, reference, and grading metadata.',
      source: { id: 'source-placeholder', title: 'Approved hadith source', type: 'hadith' },
    },
  ],
};

let favorites: HadithFavorite[] = [];

export const mockKnowledgeProvider: IslamicKnowledgeProvider = {
  async getSnapshot() {
    return mockKnowledgeSnapshot;
  },
  async getTopic(topicId): Promise<KnowledgeTopic | null> {
    return mockKnowledgeSnapshot.topics.find((topic) => topic.id === topicId) ?? null;
  },
  async getHadith(hadithId) {
    return mockKnowledgeSnapshot.hadith.find((item) => item.id === hadithId) ?? null;
  },
  async listSources(topicId): Promise<SourceReference[]> {
    if (topicId === 'hadith') return mockKnowledgeSnapshot.hadith.map((item) => item.source);
    return [];
  },
  async listHadithFavorites() {
    return favorites.map((item) => ({ ...item, source: { ...item.source } }));
  },
  async toggleHadithFavorite(hadithId) {
    const existing = favorites.find((item) => item.id === hadithId);
    if (existing) {
      favorites = favorites.filter((item) => item.id !== hadithId);
      return false;
    }
    const hadith = mockKnowledgeSnapshot.hadith.find((item) => item.id === hadithId);
    if (!hadith) return false;
    favorites = [{ ...hadith, favoriteId: `favorite-${hadith.id}` }, ...favorites];
    return true;
  },
};
