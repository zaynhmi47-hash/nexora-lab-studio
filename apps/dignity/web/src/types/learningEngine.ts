export type ActivityType =
  | 'multiple_choice'
  | 'single_choice'
  | 'true_false'
  | 'fill_blank'
  | 'code_completion'
  | 'matching'
  | 'ordering'
  | 'coding'
  | 'debugging'
  | 'scenario'
  | 'short_answer'
  | 'reflection'
  | 'flashcard';

export type ActivityDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export interface ActivityBlankSegment {
  text: string;
  isBlank: boolean;
  expected?: string;
  options?: string[];
}

export interface ActivityMatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface ActivityOrderingItem {
  id: string;
  text: string;
  correctOrder: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  question: string;
  instructions?: string;
  options?: string[];

  correctAnswer?: string | number | boolean | string[] | number[] | Record<string, unknown>;

  explanation?: string;
  hint?: string;

  skillId: string;
  skillName: string;

  difficulty: ActivityDifficulty;
  xpReward: number;
  domain: string;

  codeSnippet?: string;

  blankSegments?: ActivityBlankSegment[] | Record<string, unknown>;

  matchingPairs?: ActivityMatchingPair[] | Record<string, unknown>;

  orderingItems?: ActivityOrderingItem[] | Record<string, unknown>;

  scenario?: string;
  debuggingContext?: string;

  [key: string]: unknown;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;

  difficulty?: ActivityDifficulty;

  skillId?: string;
  skillName?: string;

  xpReward?: number;

  activities?: Activity[];

  timeLimitSeconds?: number;

  [key: string]: unknown;
}

export interface DailyMissionItem {
  id: string;
  title: string;

  type?: string;

  progress: number;
  target: number;
  unit: string;

  completed: boolean;

  xpReward: number;
  badgeReward?: string;

  targetId?: string;
  targetTitle?: string;

  [key: string]: unknown;
}

export interface DailyMission {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  completed: boolean;

  items?: DailyMissionItem[];

  [key: string]: unknown;
}

export interface EngineLesson {
  id: string;
  moduleId: string;

  title: string;
  description: string;

  durationMinutes?: number;
  estimatedMinutes: number;

  order?: number;
  difficulty?: string;

  xpReward: number;
  skillIds: string[];

  isCompleted: boolean;
  bestAccuracyPercent?: number;

  activities: Activity[];
}

export interface EngineLearningPathNode {
  id: string;
  title: string;

  type?: string;
  status: string;

  moduleNumber?: number;

  skillName?: string;
  skillId?: string;

  description?: string;
  completionPercent?: number;

  totalLessonsCount?: number;
  completedLessonsCount?: number;

  xpReward?: number;
  estimatedMinutes?: number;

  iconName?: string;

  lessons?: EngineLesson[];

  lessonId?: string;
  courseId?: string;

  [key: string]: unknown;
}

export interface EngineLearningPath {
  id: string;
  title: string;
  description: string;

  nodes: EngineLearningPathNode[];

  progressPercent?: number;
  overallProgress: number;

  [key: string]: unknown;
}

export interface SkillMastery {
  id: string;
  name: string;

  category: string;
  domain: string;

  masteryScore: number;
  status: string;

  lastPracticedAt: string;

  practiceCount: number;
  streakDays: number;

  weakAreas?: string[];

  skillId?: string;
  skillName?: string;
  masteryPercent?: number;

  level?: number;
  trend?: 'up' | 'down' | 'stable';

  [key: string]: unknown;
}

export interface ReviewItem {
  id: string;

  skillId: string;
  skillName: string;
  domain: string;

  masteryScore: number;

  lastReviewedAt: string;
  nextReviewAt: string;

  reviewCount: number;

  reason: string;
  questionsCount: number;

  activityId?: string;
  question?: string;

  correctAnswer?: string | number | boolean | string[] | number[];
  userAnswer?: string | number | boolean | string[] | number[];

  dueAt?: string;
  intervalDays?: number;
  easeFactor?: number;
  repetitions?: number;

  [key: string]: unknown;
}

export interface PracticeSession {
  id: string;

  title?: string;

  userId?: string;

  startedAt?: string;
  completedAt?: string;

  activityIds?: string[];

  currentIndex?: number;

  score?: number;
  accuracyPercent?: number;

  completed?: boolean;

  [key: string]: unknown;
}

export interface AdaptiveInsight {
  id: string;

  type?: string;

  title?: string;
  description?: string;

  insight?: string;

  skillId?: string;
  skillName?: string;

  recommendedAction?: string;

  priority?: 'low' | 'medium' | 'high';

  [key: string]: unknown;
}

export interface UserLearningProfile {
  userId?: string;

  learningLevel?: string;
  learningGoal?: string;

  energy: number;
  maxEnergy: number;

  xp: number;
  level: number;
  levelTitle: string;

  nextLevelXp: number;
  currentLevelXp: number;

  streak: number;
  longestStreak: number;

  dailyGoalMinutes: number;
  todayLearnedMinutes: number;
  todayGoalCompleted: boolean;

  weeklyActivity: Array<{
    day: string;
    minutes: number;
    completed?: boolean;
    [key: string]: unknown;
  }>;

  currentStreakDays?: number;
  totalXp?: number;

  skillMastery?: SkillMastery[];

  recentActivityIds?: string[];
  weakSkillIds?: string[];

  preferredActivityTypes?: ActivityType[];

  [key: string]: unknown;
}
