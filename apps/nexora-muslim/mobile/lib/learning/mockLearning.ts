import type {
  LearningCourse,
  LearningPort,
  LearningProgress,
  QuizQuestion,
} from './types';

const courses: LearningCourse[] = [
  {
    id: 'quran-foundations',
    title: 'Quran Foundations',
    description: 'Build a strong foundation for reading the Quran.',
    level: 1,
    lessons: [
      { id: 'arabic-alphabet', courseId: 'quran-foundations', title: 'Arabic Alphabet', description: 'Recognize the Arabic letters.', kind: 'lesson', order: 1, xpReward: 20, status: 'completed' },
      { id: 'harakat', courseId: 'quran-foundations', title: 'Harakat', description: 'Learn the basic vowel marks.', kind: 'lesson', order: 2, xpReward: 20, status: 'completed' },
      { id: 'makharij', courseId: 'quran-foundations', title: 'Makharij', description: 'Practice articulation points.', kind: 'practice', order: 3, xpReward: 30, status: 'in_progress' },
      { id: 'tajwid-foundations', courseId: 'quran-foundations', title: 'Tajwid Foundations', description: 'Learn the core rules before deeper practice.', kind: 'lesson', order: 4, xpReward: 40, status: 'locked' },
      { id: 'tahsin', courseId: 'quran-foundations', title: 'Tahsin', description: 'Improve reading accuracy through guided practice.', kind: 'practice', order: 5, xpReward: 50, status: 'locked' },
    ],
  },
  {
    id: 'kitab-kuning',
    title: 'Kitab Kuning Foundations',
    description: 'An introductory path for classical Islamic texts.',
    level: 4,
    lessons: [
      { id: 'kitab-intro', courseId: 'kitab-kuning', title: 'Introduction to Kitab Kuning', description: 'Understand the learning path and study conventions.', kind: 'lesson', order: 1, xpReward: 50, status: 'locked' },
    ],
  },
];

const initialProgress: LearningProgress = {
  userId: '00000000-0000-0000-0000-000000000001',
  xp: 60,
  level: 3,
  currentStreak: 17,
  completedLessonIds: ['arabic-alphabet', 'harakat'],
};

const quizzes: Record<string, QuizQuestion[]> = {
  harakat: [
    {
      id: 'harakat-q1',
      lessonId: 'harakat',
      prompt: 'Which topic is this lesson designed to introduce?',
      options: ['Basic vowel marks', 'Travel documents', 'Hadith grading', 'Qibla calculation'],
      correctOptionIndex: 0,
      explanation: 'Harakat are Arabic vowel marks used in reading practice.',
    },
  ],
};

export const mockLearning: LearningPort = {
  async getCourses() {
    return courses;
  },
  async getProgress(userId) {
    return { ...initialProgress, userId, completedLessonIds: [...initialProgress.completedLessonIds] };
  },
  async getQuiz(lessonId) {
    return quizzes[lessonId] ?? [];
  },
  async completeLesson(userId, lessonId) {
    const progress = await this.getProgress(userId);
    if (!progress.completedLessonIds.includes(lessonId)) {
      progress.completedLessonIds.push(lessonId);
      progress.xp += 20;
    }
    return progress;
  },
};
