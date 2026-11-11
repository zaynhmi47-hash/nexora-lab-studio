export type StoryStatus = 'published' | 'completed' | 'hiatus';

export type StoryChapter = {
  id: string;
  number: number;
  slug: string;
  title: string;
  summary: string;
  freePreview: boolean;
  publishedAt: string | null;
};

export type Story = {
  id: string;
  slug: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  cover: string;
  chapters: number;
  reads: string;
  language: string;
  contentRating: string;
  status: StoryStatus;
  publishedAt: string | null;
  chapterList?: StoryChapter[];
};

export const genres = ['Semua', 'Romance', 'Fantasy', 'Drama', 'Thriller', 'Mystery', 'Slice of Life'];
