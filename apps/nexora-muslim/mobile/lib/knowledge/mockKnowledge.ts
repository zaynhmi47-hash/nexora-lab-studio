import type { IslamicKnowledgeProvider, IslamicKnowledgeSnapshot, KnowledgeTopic, HadithItem, SourceReference } from './types';

export const mockKnowledgeSnapshot: IslamicKnowledgeSnapshot = {
  topics: [
    { id: 'quran', title: 'Quran', description: 'Reading, study, and source-aware learning.', sourceCount: 1 },
    { id: 'hadith', title: 'Hadith', description: 'Hadith discovery with collection and reference metadata.', sourceCount: 1 },
    { id: 'fiqh', title: 'Fiqh & Practice', description: 'Guidance should preserve scholarly differences and cite sources.', sourceCount: 0 },
    { id: 'sirah', title: 'Sirah & History', description: 'Curated historical learning with source context.', sourceCount: 0 },
  ],
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

const topicSources: Record<string, SourceReference[]> = {
  quran: [{ id: 'quran-source-placeholder', title: 'Approved Quran dataset', type: 'quran', reference: 'Dataset reference to be configured' }],
  hadith: [{ id: 'hadith-source-placeholder', title: 'Approved hadith dataset', type: 'hadith', reference: 'Dataset reference to be configured' }],
};

export const mockKnowledgeProvider: IslamicKnowledgeProvider = {
  async getSnapshot() {
    return mockKnowledgeSnapshot;
  },
  async getTopic(topicId: string) {
    return mockKnowledgeSnapshot.topics.find((topic) => topic.id === topicId) ?? null;
  },
  async getHadith(hadithId: string) {
    return mockKnowledgeSnapshot.hadith.find((item) => item.id === hadithId) ?? null;
  },
  async listSources(topicId?: string) {
    if (topicId) return [...(topicSources[topicId] ?? [])];
    return Object.values(topicSources).flat().map((source) => ({ ...source }));
  },
};
