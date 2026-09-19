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

export type LearningHubDomain = {
  xp: number;
  streak: number;
  completedCount: number;
  level?: number;
  practiceCompleted?: number;
  assessmentCompleted?: boolean;
};

export type LearningReward = {
  key: string;
  title: string;
  description: string;
  earned: boolean;
};

export type LearningHub = {
  userId: string;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  xpPerLevel: number;
  progressPercent: number;
  currentStreak: number;
  rewards: LearningReward[];
  achievements: LearningAchievement[];
  domains: {
    learning: LearningHubDomain;
    tajwid: LearningHubDomain;
    arabic: LearningHubDomain;
  };
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

export type LearningAchievement = { id:string; key:string; title:string; description:string; earnedAt:string; };

export type QuizResult = {
  attemptId?: string;
  lessonId: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent?: number;
  passed?: boolean;
  xpEarned: number;
  completedAt?: string;
};

export interface LearningPort {
  getCourses(): Promise<LearningCourse[]>;
  getProgress(userId: string): Promise<LearningProgress>;
  getHub(): Promise<LearningHub>;
  getQuiz(lessonId: string): Promise<QuizQuestion[]>;
  completeQuiz(lessonId: string, answers: number[]): Promise<QuizResult>;
  completeLesson(userId: string, lessonId: string): Promise<LearningProgress>;
  getAchievements(): Promise<LearningAchievement[]>;
}


export type GamificationActivity = {
  id: string;
  source: 'learning' | 'tajwid' | 'arabic' | 'gamification';
  action: string;
  sourceKey: string;
  xpEarned: number;
  occurredAt: string;
};

export type GamificationStatistics = {
  days: number;
  totalXp: number;
  activityCount: number;
  bySource: {
    learning: number;
    tajwid: number;
    arabic: number;
    gamification: number;
  };
  dailyXp: Array<{
    date: string;
    xp: number;
  }>;
};
