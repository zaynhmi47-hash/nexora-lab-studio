export type DhikrCategory = 'morning' | 'evening' | 'general';

export type Dhikr = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  completed: number;
  category: DhikrCategory;
};

export type DhikrHistoryEntry = {
  id: string;
  dhikrId: string;
  count: number;
  completedAt: string;
};

export interface DhikrRepository {
  getAll(): Promise<Dhikr[]>;
  increment(dhikrId: string): Promise<Dhikr>;
  reset(dhikrId: string): Promise<Dhikr>;
  getHistory(dhikrId?: string): Promise<DhikrHistoryEntry[]>;
}
