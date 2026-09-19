import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type {
  LearningCourse,
  LearningPort,
  LearningProgress,
  LearningAchievement,
  LearningHub,
  QuizQuestion,
  QuizResult,
} from './types';

function apiUrl(path: string) {
  return `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/learning/${path}`;
}

async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Nexora Core learning request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export function nexoraCoreLearningRepository(session: AuthSession): LearningPort {
  return {
    getCourses: () => request<LearningCourse[]>(session, 'courses/'),
    getHub: () => request<LearningHub>(session, 'hub/'),
    getProgress: (userId) => {
      if (session.user.id !== userId) {
        return Promise.reject(new Error('Learning user does not match the authenticated NEXORA identity.'));
      }
      return request<LearningProgress>(session, 'progress/');
    },
    getQuiz: (lessonId) => request<QuizQuestion[]>(session, `lessons/${encodeURIComponent(lessonId)}/quiz/`),
    completeQuiz: (lessonId, answers) =>
      request<QuizResult>(session, `lessons/${encodeURIComponent(lessonId)}/quiz/complete/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }),
    getAchievements: () => request<LearningAchievement[]>(session, 'achievements/'),
    completeLesson: (userId, lessonId) => {
      if (session.user.id !== userId) {
        return Promise.reject(new Error('Learning user does not match the authenticated NEXORA identity.'));
      }
      return request<LearningProgress>(session, `lessons/${encodeURIComponent(lessonId)}/complete/`, { method: 'POST' });
    },
  };
}

