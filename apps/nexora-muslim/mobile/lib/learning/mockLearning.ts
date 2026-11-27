import type {
  LearningAchievement,
  LearningCourse,
  LearningHub,
  LearningPort,
  LearningProgress,
  QuizQuestion,
  QuizResult,
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

let progressState: LearningProgress = {
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

const achievements: LearningAchievement[] = [
  { id: 'first-lesson', title: 'First Steps', description: 'Complete your first lesson.', xpReward: 20, unlocked: true },
  { id: 'steady-reader', title: 'Steady Reader', description: 'Build a consistent reading habit.', xpReward: 50, unlocked: false },
];

function copyProgress(userId: string): LearningProgress {
  return { ...progressState, userId, completedLessonIds: [...progressState.completedLessonIds] };
}

export const mockLearning: LearningPort = {
  async getCourses() {
    return courses.map((course) => ({ ...course, lessons: course.lessons.map((lesson) => ({ ...lesson })) }));
  },
  async getHub(): Promise<LearningHub> {
    return { courses: courses.map((course) => ({ ...course, lessons: course.lessons.map((lesson) => ({ ...lesson })) })), progress: copyProgress(progressState.userId), achievements: achievements.map((achievement) => ({ ...achievement })) };
  },
  async getProgress(userId) {
    return copyProgress(userId);
  },
  async getQuiz(lessonId) {
    return (quizzes[lessonId] ?? []).map((question) => ({ ...question, options: [...question.options] }));
  },
  async completeQuiz(lessonId, answers): Promise<QuizResult> {
    const questions = quizzes[lessonId] ?? [];
    const correctAnswers = questions.filter((question) => answers[question.id] === question.correctOptionIndex).length;
    const passed = questions.length > 0 && correctAnswers === questions.length;
    const xpEarned = passed ? 20 : 0;
    if (passed && !progressState.completedLessonIds.includes(lessonId)) {
      progressState = {
        ...progressState,
        xp: progressState.xp + xpEarned,
        completedLessonIds: [...progressState.completedLessonIds, lessonId],
      };
    }
    return { lessonId, correctAnswers, totalQuestions: questions.length, xpEarned };
  },
  async getAchievements() {
    return achievements.map((achievement) => ({ ...achievement }));
  },
  async completeLesson(userId, lessonId) {
    if (!progressState.completedLessonIds.includes(lessonId)) {
      progressState = {
        ...progressState,
        userId,
        completedLessonIds: [...progressState.completedLessonIds, lessonId],
        xp: progressState.xp + 20,
      };
    }
    return copyProgress(userId);
  },
};
