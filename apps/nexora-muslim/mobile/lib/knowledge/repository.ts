import type { AuthSession } from '@/lib/auth/types';
import type { IslamicKnowledgeProvider, IslamicKnowledgeSnapshot, KnowledgeTopic, HadithItem, SourceReference } from './types';

const baseUrl = process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? 'http://localhost:8000';

async function request<T>(session: AuthSession, path: string): Promise<T> {
  const response = await fetch(`${baseUrl}/api/v1/knowledge${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!response.ok) throw new Error(`Knowledge request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function nexoraCoreKnowledgeProvider(session: AuthSession): IslamicKnowledgeProvider {
  return {
    getSnapshot: () => request<IslamicKnowledgeSnapshot>(session, '/'),
    async getTopic(topicId: string): Promise<KnowledgeTopic | null> {
      try { return await request<KnowledgeTopic>(session, `/topics/${encodeURIComponent(topicId)}/`); }
      catch (error) { if (error instanceof Error && error.message.includes('404')) return null; throw error; }
    },
    async getHadith(hadithId: string): Promise<HadithItem | null> {
      try { return await request<HadithItem>(session, `/hadith/${encodeURIComponent(hadithId)}/`); }
      catch (error) { if (error instanceof Error && error.message.includes('404')) return null; throw error; }
    },
    async listSources(topicId?: string): Promise<SourceReference[]> {
      if (!topicId) return [];
      const topic = await request<KnowledgeTopic & { sources?: SourceReference[] }>(session, `/topics/${encodeURIComponent(topicId)}/`);
      return topic.sources ?? [];
    },
  };
}
