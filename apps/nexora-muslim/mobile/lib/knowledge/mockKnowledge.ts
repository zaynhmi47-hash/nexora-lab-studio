import type { IslamicKnowledgeProvider, IslamicKnowledgeSnapshot } from './types';

export const mockKnowledgeSnapshot: IslamicKnowledgeSnapshot = {
  topics: [
    { id: 'quran', title: 'Quran', description: 'Reading, study, and source-aware learning.', sourceCount: 1 },
    { id: 'hadith', title: 'Hadith', description: 'Hadith discovery with collection and reference metadata.', sourceCount: 1 },
    { id: 'fiqh', title: 'Fiqh & Practice', description: 'Guidance should preserve scholarly differences and cite sources.', sourceCount: 0 },
    { id: 'sirah', title: 'Sirah & History', description: 'Curated historical learning with source context.', sourceCount: 0 },
  ],
  // Deliberately metadata-first for the prototype: no fabricated Arabic/translation text.
  hadith: [
    {
      id: 'hadith-placeholder-001',
      title: 'Reference-ready hadith entry',
      collection: 'Verified source required',
      reference: 'Reference to be populated from an approved hadith dataset',
      grade: 'unknown',
      summary: 'Production content must be imported from a verified source and retain its collection, reference, and grading metadata.',
      source: {
        id: 'source-placeholder',
        title: 'Approved hadith source',
        type: 'hadith',
      },
    },
  ],
};

export const mockKnowledgeProvider: IslamicKnowledgeProvider = {
  async getSnapshot() {
    return mockKnowledgeSnapshot;
  },
};
