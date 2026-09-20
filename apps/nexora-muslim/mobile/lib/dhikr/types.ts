export type Dhikr = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  completed: number;
  category: 'morning' | 'evening' | 'general';
};

export interface DhikrRepository {
  getAll(): Promise<Dhikr[]>;
}
