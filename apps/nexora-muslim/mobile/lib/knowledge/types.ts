export type KnowledgeSourceType = 'quran' | 'hadith' | 'scholar' | 'official' | 'curated';

export type SourceReference = {
  id: string;
  title: string;
  type: KnowledgeSourceType;
  collection?: string;
  reference?: string;
  url?: string;
};

export type HadithGrade = 'sahih' | 'hasan' | 'daif' | 'unknown';

export type HadithItem = {
  id: string;
  title: string;
  collection: string;
  reference: string;
  grade: HadithGrade;
  summary: string;
  source: SourceReference;
};

export type KnowledgeTopic = {
  id: string;
  title: string;
  description: string;
  sourceCount: number;
};

export type IslamicKnowledgeSnapshot = {
  topics: KnowledgeTopic[];
  hadith: HadithItem[];
};

export type IslamicKnowledgeProvider = {
  getSnapshot(): Promise<IslamicKnowledgeSnapshot>;
};
