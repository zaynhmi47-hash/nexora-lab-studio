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

export type LearningAchievement = { id:string; key:string; title:string; description:string; earnedAt:string; };

export type QuizResult = {
  lessonId: string;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
};

export interface LearningPort {
  getCourses(): Promise<LearningCourse[]>;
  getProgress(userId: string): Promise<LearningProgress>;
  getQuiz(lessonId: string): Promise<QuizQuestion[]>;
  completeLesson(userId: string, lessonId: string): Promise<LearningProgress>;
  getAchievements(): Promise<LearningAchievement[]>;
}
