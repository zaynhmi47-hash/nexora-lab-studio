export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type LessonKind = 'lesson' | 'quiz' | 'practice';

export type LearningLesson = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  kind: LessonKind;
  order: number;
  xpReward: number;
  status: LessonStatus;
};

export type LearningCourse = {
  id: string;
  title: string;
  description: string;
  level: number;
  lessons: LearningLesson[];
};

export type LearningProgress = {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  completedLessonIds: string[];
  lastCompletedAt?: string;
};

export type QuizQuestion = {
  id: string;
  lessonId: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
};

export type QuizResult = {
  lessonId: string;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
};

export type LearningAchievement = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
};

export type LearningHub = {
  courses: LearningCourse[];
  progress: LearningProgress;
  achievements: LearningAchievement[];
};

export type GamificationSource = 'learning' | 'tajwid' | 'arabic' | 'gamification';

export type GamificationActivity = {
  id: string;
  source: GamificationSource;
  action: string;
  sourceKey: string;
  xpEarned: number;
  occurredAt: string;
};

export type GamificationStatistics = {
  days: number;
  totalXp: number;
  activityCount: number;
  bySource: Record<GamificationSource, number>;
  dailyXp: Array<{ date: string; xp: number }>;
};

export interface LearningPort {
  getCourses(): Promise<LearningCourse[]>;
  getHub(): Promise<LearningHub>;
  getProgress(userId: string): Promise<LearningProgress>;
  getQuiz(lessonId: string): Promise<QuizQuestion[]>;
  completeQuiz(lessonId: string, answers: Record<string, number>): Promise<QuizResult>;
  getAchievements(): Promise<LearningAchievement[]>;
  completeLesson(userId: string, lessonId: string): Promise<LearningProgress>;
}
