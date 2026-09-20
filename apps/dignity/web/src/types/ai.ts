import type { EducationLevel } from './index';

export type AILanguage = 'en' | 'id' | 'English' | 'Indonesian';

export type AIExplanationDepth =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'normal';

export type AIExplanationLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export type AISubjectDomain =
  | 'programming'
  | 'mathematics'
  | 'english'
  | 'business'
  | 'science'
  | 'design'
  | 'other';

export type AIInsightType =
  | 'habit'
  | 'skill_gain'
  | 'retention'
  | 'mastery'
  | 'weak_skill'
  | 'progress';

export type AIRecommendationTargetType =
  | 'course'
  | 'practice'
  | 'quiz'
  | 'lesson'
  | 'project'
  | 'learning_path';

export type AIRecommendationUrgency =
  | 'high'
  | 'medium'
  | 'low';

export type AIStudyPlanItemType =
  | 'lesson'
  | 'practice'
  | 'quiz'
  | 'project'
  | 'review';

export type AIStudyPlanMilestoneStatus =
  | 'completed'
  | 'in_progress'
  | 'upcoming';

export type AISessionContextType =
  | 'lesson'
  | 'practice'
  | 'course'
  | 'skill'
  | 'study_plan'
  | 'general';

export type AIMessageRole =
  | 'user'
  | 'assistant'
  | 'system';

export type AIMessageType =
  | 'general'
  | 'explanation'
  | 'practice'
  | 'study_plan'
  | 'quiz'
  | 'hint'
  | 'recommendation';

export type AIActionType =
  | 'explain_deeper'
  | 'give_example'
  | 'quiz_me'
  | 'simplify'
  | 'practice_skill'
  | 'view_study_plan'
  | 'review_mistake'
  | 'start_lesson'
  | 'open_course'
  | 'open_lesson'
  | 'try_another_question';

export interface RecentMistakeContext {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  skillName: string;
}

export interface RecentAssessmentResult {
  assessmentId: string;
  assessmentTitle: string;
  scorePercent: number;
  passed: boolean;
  weakSkills: string[];
}

export interface AIContext {
  userId: string;
  learningGoal: string;

  courseId?: string;
  courseTitle?: string;

  moduleId?: string;
  moduleTitle?: string;

  lessonId?: string;
  lessonTitle?: string;

  skillIds: string[];
  skillNames: string[];

  currentMastery: number;
  learningLevel: EducationLevel;

  language: AILanguage;
  preferredExplanationStyle: AIExplanationDepth;
  subjectDomain: AISubjectDomain;

  recentMistakes: RecentMistakeContext[];
  recentAssessmentResults?: RecentAssessmentResult;
}

export interface AILearningInsight {
  id: string;
  type: AIInsightType;
  title: string;
  description: string;
  metric: string;
  actionLabel?: string;
  actionRoute?: string;
  isPrototypeNote?: boolean;
}

export interface AIRecommendation {
  id: string;
  title: string;
  reason: string;
  skillGap: string;
  targetType: AIRecommendationTargetType;
  targetId: string;
  targetTitle: string;
  urgency: AIRecommendationUrgency;
  estimatedMinutes: number;
}

export interface AIStudyPlanItem {
  id: string;
  title: string;
  durationMinutes: number;
  type: AIStudyPlanItemType;
  isCompleted: boolean;
  skillName: string;

  courseId?: string;
  lessonId?: string;
  projectId?: string;
}

export interface AIStudyPlanDay {
  date: string;
  totalMinutes: number;
  items: AIStudyPlanItem[];
}

export interface AIStudyPlanMilestone {
  weekNumber: number;
  theme: string;
  status: AIStudyPlanMilestoneStatus;
  skills: string[];
  description: string;
}

export interface AIStudyPlan {
  id: string;
  goal: string;
  dailyCommitmentMinutes: number;
  targetWeeks: number;
  currentLevel: EducationLevel;
  progressPercent: number;

  todaySchedule: AIStudyPlanDay;
  weeklyMilestones: AIStudyPlanMilestone[];
}

export interface AILearningSummarySkill {
  name: string;
  gainPercent: number;
  currentMastery: number;
}

export interface AILearningSummary {
  date: string;
  studyMinutesToday: number;
  lessonsCompletedToday: number;
  practiceQuestionsToday: number;
  practiceAccuracyPercent: number;
  skillsImproved: AILearningSummarySkill[];
  aiDiagnosticNote: string;
  recommendedNextFocus: string;
}

export interface AIAction {
  id: string;
  label: string;
  actionType: AIActionType;
}

export interface AIMessageContext {
  courseTitle?: string;
  lessonTitle?: string;
  skillNames?: string[];
  currentMastery?: number;

  courseId?: string;
  lessonId?: string;
  skillIds?: string[];
}

export interface AIMessageMetadata {
  actions?: AIAction[];
  explanationLevel?: AIExplanationLevel;
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  messageType: AIMessageType;

  context?: AIMessageContext;
  metadata?: AIMessageMetadata;
}

export interface AITutorSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;

  contextType: AISessionContextType;

  courseId?: string;
  courseTitle?: string;

  lessonId?: string;
  lessonTitle?: string;

  skillId?: string;
  skillName?: string;

  messages: AIMessage[];
}
