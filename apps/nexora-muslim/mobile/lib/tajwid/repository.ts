import type { AuthSession } from '@/lib/auth/types';
import type {
  TajwidPort,
  TajwidPracticeItem,
  TajwidProgress,
  TajwidTopic,
  TajwidTopicId,
} from './types';

const baseUrl = process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? 'http://localhost:8000';

async function request<T>(session: AuthSession, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}/api/v1/tajwid${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Tajwid request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function nexoraCoreTajwidRepository(session: AuthSession): TajwidPort {
  return {
    getTopics: () => request<TajwidTopic[]>(session, '/topics/'),
    getProgress: () => request<TajwidProgress>(session, '/progress/'),
    getPractice: (topicId: TajwidTopicId) =>
      request<TajwidPracticeItem[]>(session, `/topics/${encodeURIComponent(topicId)}/practice/`),
    completeTopic: (_userId, topicId) =>
      request<TajwidProgress>(session, `/topics/${encodeURIComponent(topicId)}/complete/`, { method: 'POST' }),
    completeAssessment: (_userId, correctAnswers, totalQuestions) =>
      request<TajwidProgress>(session, '/assessment/complete/', {
        method: 'POST',
        body: JSON.stringify({ correctAnswers, totalQuestions }),
      }),
  };
}
