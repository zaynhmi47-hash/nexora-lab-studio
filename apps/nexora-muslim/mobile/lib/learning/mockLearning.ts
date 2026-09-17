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

const progressByUser = new Map<string, LearningProgress>();

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

function cloneProgress(progress: LearningProgress): LearningProgress {
  return {
    ...progress,
    completedLessonIds: [...progress.completedLessonIds],
  };
}

export const mockLearning: LearningPort = {
  async getCourses() {
    return courses.map((course) => ({
      ...course,
      lessons: course.lessons.map((lesson) => ({ ...lesson })),
    }));
  },
  async getProgress(userId) {
    const existing = progressByUser.get(userId);
    if (existing) return cloneProgress(existing);

    const progress = cloneProgress({ ...initialProgress, userId });
    progressByUser.set(userId, progress);
    return cloneProgress(progress);
  },
  async getQuiz(lessonId) {
    return (quizzes[lessonId] ?? []).map((question) => ({
      ...question,
      options: [...question.options],
    }));
  },
  async completeLesson(userId, lessonId) {
    const progress = await this.getProgress(userId);
    if (progress.completedLessonIds.includes(lessonId)) return progress;

    const lesson = courses
      .flatMap((course) => course.lessons)
      .find((item) => item.id === lessonId);

    if (!lesson || lesson.status === 'locked') return progress;

    progress.completedLessonIds.push(lessonId);
    progress.xp += lesson.xpReward;
    progress.lastCompletedAt = new Date().toISOString();

    lesson.status = 'completed';

    const nextLesson = courses
      .find((course) => course.id === lesson.courseId)
      ?.lessons
      .find((item) => item.order === lesson.order + 1);

    if (nextLesson && nextLesson.status === 'locked') {
      nextLesson.status = 'available';
    }

    progressByUser.set(userId, progress);
    return cloneProgress(progress);
  },
};
