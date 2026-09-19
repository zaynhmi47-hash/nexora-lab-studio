import type {
  LearningCourse,
  LearningPort,
  LearningProgress,
  QuizQuestion,
  LearningAchievement,
  LearningHub,
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
const achievementCatalog: LearningAchievement[] = [
  { id:'first-lesson', key:'first-lesson', title:'First Step', description:'Complete your first learning lesson.', earnedAt:'' },
  { id:'xp-100', key:'xp-100', title:'100 XP', description:'Reach 100 XP.', earnedAt:'' },
  { id:'streak-7', key:'streak-7', title:'Seven Day Streak', description:'Maintain a seven day learning streak.', earnedAt:'' },
];

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
    {
      id: 'harakat-q2',
      lessonId: 'harakat',
      prompt: 'What is the main purpose of learning harakat in this path?',
      options: ['Support accurate reading practice', 'Calculate prayer times', 'Track travel distance', 'Store bookmarks'],
      correctOptionIndex: 0,
      explanation: 'The lesson uses vowel-mark recognition as a foundation for reading practice.',
    },
  ],
  makharij: [
    {
      id: 'makharij-q1',
      lessonId: 'makharij',
      prompt: 'What does this practice focus on?',
      options: ['Articulation points', 'Travel planning', 'Book lending', 'Account settings'],
      correctOptionIndex: 0,
      explanation: 'Makharij practice focuses on the articulation points used when producing letters.',
    },
    {
      id: 'makharij-q2',
      lessonId: 'makharij',
      prompt: 'What is the intended outcome of articulation practice?',
      options: ['More accurate pronunciation practice', 'A longer reading streak automatically', 'A new user account', 'A saved audio file'],
      correctOptionIndex: 0,
      explanation: 'The goal is guided practice toward more accurate articulation.',
    },
  ],
  'tajwid-foundations': [
    {
      id: 'tajwid-q1',
      lessonId: 'tajwid-foundations',
      prompt: 'What does this lesson introduce?',
      options: ['Core tajwid rules', 'Travel checklists', 'Qibla coordinates', 'Profile settings'],
      correctOptionIndex: 0,
      explanation: 'This learning activity is the foundation for deeper tajwid practice.',
    },
    {
      id: 'tajwid-q2',
      lessonId: 'tajwid-foundations',
      prompt: 'Why is this lesson placed before deeper practice?',
      options: ['It establishes foundational concepts', 'It unlocks unrelated account settings', 'It replaces the Quran reader', 'It changes the device language'],
      correctOptionIndex: 0,
      explanation: 'Foundational concepts are introduced before more advanced guided practice.',
    },
  ],
  tahsin: [
    {
      id: 'tahsin-q1',
      lessonId: 'tahsin',
      prompt: 'What is the focus of this activity?',
      options: ['Improving reading accuracy', 'Managing travel documents', 'Creating a bookmark folder', 'Changing notification settings'],
      correctOptionIndex: 0,
      explanation: 'Tahsin is represented here as guided practice for improving reading accuracy.',
    },
    {
      id: 'tahsin-q2',
      lessonId: 'tahsin',
      prompt: 'How is improvement represented in this prototype?',
      options: ['Through guided practice', 'By skipping all lessons', 'By changing the profile name', 'By opening a map'],
      correctOptionIndex: 0,
      explanation: 'The prototype models tahsin as guided learning and practice.',
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
  async getHub(): Promise<LearningHub> {
    const progress = await this.getProgress(initialProgress.userId);
    return {
      userId: progress.userId,
      totalXp: progress.xp + 45 + 80,
      level: Math.floor((progress.xp + 45 + 80) / 50) + 1,
      domains: {
        learning: { xp: progress.xp, level: progress.level, streak: progress.currentStreak, completedCount: progress.completedLessonIds.length },
        tajwid: { xp: 45, streak: 0, completedCount: 1, practiceCompleted: 2, assessmentCompleted: false },
        arabic: { xp: 80, streak: 5, completedCount: 2 },
      },
    };
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
  async getAchievements() {
    const progress = await this.getProgress(initialProgress.userId);
    const count = progress.completedLessonIds.length;
    return achievementCatalog.filter(a => (a.key === 'first-lesson' && count >= 1) || (a.key === 'xp-100' && progress.xp >= 100) || (a.key === 'streak-7' && progress.currentStreak >= 7)).map(a => ({ ...a, earnedAt: progress.lastCompletedAt ?? new Date().toISOString() }));
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
