import type { NexoraApiClient } from '@/lib/api/client';

export type LearningLessonStatus = 'available' | 'locked' | 'completed';
export type LearningLessonKind = 'lesson' | 'quiz' | 'practice';

export interface LearningLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  kind: LearningLessonKind;
  order: number;
  xpReward: number;
  status: LearningLessonStatus;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  level: number;
  lessons: LearningLesson[];
}

export interface LearningProgress {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  completedLessonIds: string[];
  lastCompletedAt: string | null;
}

export interface LearningQuizQuestion {
  id: string;
  lessonId: string;
  prompt: string;
  options: string[];
}

export interface LearningQuizResult {
  attemptId: string;
  lessonId: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  xpEarned: number;
  completedAt: string;
}

async function requestData<T>(request: Promise<unknown>): Promise<T> {
  const response = await request;
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function getLearningCourses(client: NexoraApiClient): Promise<LearningCourse[]> {
  return requestData(client.request<LearningCourse[]>('/api/v1/learning/courses/'));
}

export function getLearningProgress(client: NexoraApiClient): Promise<LearningProgress> {
  return requestData(client.request<LearningProgress>('/api/v1/learning/progress/'));
}

export function getLearningQuiz(client: NexoraApiClient, lessonKey: string): Promise<LearningQuizQuestion[]> {
  return requestData(client.request<LearningQuizQuestion[]>(`/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/quiz/`));
}

export function completeLearningLesson(client: NexoraApiClient, lessonKey: string): Promise<LearningProgress> {
  return requestData(client.request<LearningProgress>(`/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/complete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
}

export function submitLearningQuiz(client: NexoraApiClient, lessonKey: string, answers: number[]): Promise<LearningQuizResult> {
  return requestData(client.request<LearningQuizResult>(`/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/quiz/complete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  }));
}
