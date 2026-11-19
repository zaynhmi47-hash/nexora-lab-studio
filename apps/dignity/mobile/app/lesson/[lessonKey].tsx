import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';
import { useAuth } from '@/lib/auth';

type ContentBlock = {
  id?: string;
  type: 'heading' | 'text' | 'image' | 'video' | 'document' | 'link' | 'callout' | 'prompt';
  title?: string;
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
};
type LessonContent = {
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  kind: 'lesson' | 'quiz' | 'practice';
  version: number;
  estimatedMinutes: number;
  blocks: ContentBlock[];
};
type LearningProgress = {
  xp: number;
  level: number;
  currentStreak: number;
  completedLessonIds: string[];
};
function payload<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}
export default function LessonReaderScreen() {
  const { lessonKey } = useLocalSearchParams<{ lessonKey: string }>();
  const api = useNexoraApi();
  const { status: authStatus } = useAuth();
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    if (authStatus !== 'signed_in' || !lessonKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<LessonContent>(`/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/content/`);
      setContent(payload<LessonContent>(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load this lesson.');
    } finally {
      setLoading(false);
    }
  }, [api, authStatus, lessonKey]);

  useEffect(() => { void loadContent(); }, [loadContent]);

  const completeLesson = async () => {
    if (!lessonKey || !content || content.kind === 'quiz') return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.request<LearningProgress>(`/api/v1/learning/lessons/${encodeURIComponent(lessonKey)}/complete/`, { method: 'POST' });
      setNotice('Lesson completed. Your learning progress has been updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete this lesson.');
    } finally {
      setBusy(false);
    }
  };

  const openExternal = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      setError('Unable to open this resource on your device.');
    }
  };

  return <>
    <Stack.Screen options={{ title: content?.title ?? 'Learning reader' }} />
    <Screen>
      {loading ? <SurfaceCard><Text style={styles.detail}>Loading lesson…</Text></SurfaceCard> : null}
      {error && !content ? <SurfaceCard style={styles.stateCard}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void loadContent()}><Text style={styles.action}>Try again</Text></Pressable></SurfaceCard> : null}
      {content ? <>
        <Text style={styles.eyebrow}>DIGNITY LEARN · {content.kind.toUpperCase()}</Text>
        <Text style={styles.title}>{content.title}</Text>
        {content.description ? <Text style={styles.description}>{content.description}</Text> : null}
        <Text style={styles.meta}>Version {content.version}{content.estimatedMinutes ? ` · ${content.estimatedMinutes} min read` : ''}</Text>
        {content.blocks.map((block, index) => {
          const key = block.id ?? `${block.type}-${index}`;
          if (block.type === 'heading') return <Text key={key} style={styles.heading}>{block.text}</Text>;
          if (block.type === 'text') return <Text key={key} style={styles.body}>{block.text}</Text>;
          if (block.type === 'callout' || block.type === 'prompt') return <SurfaceCard key={key} style={styles.callout}><Text style={styles.calloutLabel}>{block.type === 'prompt' ? 'REFLECTION' : 'KEY IDEA'}</Text><Text style={styles.body}>{block.text}</Text></SurfaceCard>;
          if (block.type === 'image' && block.url) return <View key={key} style={styles.media}><Image source={{ uri: block.url }} accessibilityLabel={block.alt} resizeMode="contain" style={styles.image} />{block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}</View>;
          if ((block.type === 'video' || block.type === 'document' || block.type === 'link') && block.url) return <Pressable key={key} accessibilityRole="link" onPress={() => void openExternal(block.url)} style={styles.resource}><Text style={styles.resourceType}>{block.type.toUpperCase()}</Text><Text style={styles.resourceTitle}>{block.title ?? block.caption ?? 'Open learning resource'}</Text><Text style={styles.action}>Open resource ↗</Text></Pressable>;
          return null;
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
        {content.kind === 'quiz' ? <SurfaceCard style={styles.callout}><Text style={styles.calloutLabel}>ASSESSMENT</Text><Text style={styles.body}>This lesson is an assessment. Complete it through the quiz experience; it cannot be marked complete from the reader.</Text></SurfaceCard> : <Pressable accessibilityRole="button" disabled={busy} onPress={() => void completeLesson()} style={[styles.complete, busy && styles.disabled]}><Text style={styles.completeText}>{busy ? 'Saving…' : 'Mark lesson complete'}</Text></Pressable>}
      </> : null}
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.action}>Back to learning catalog</Text></Pressable>
    </Screen>
  </>;
}
const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 34, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 9 },
  meta: { color: colors.muted, fontSize: 10, marginTop: 10, marginBottom: spacing.xl },
  heading: { color: colors.ink, fontSize: 19, lineHeight: 26, fontWeight: '900', marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { color: colors.ink, fontSize: 14, lineHeight: 23 },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  callout: { marginVertical: spacing.md, backgroundColor: colors.blueSoft, borderColor: '#D9E4F0' },
  calloutLabel: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7 },
  media: { marginVertical: spacing.md },
  image: { width: '100%', height: 230, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted },
  caption: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  resource: { padding: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, marginVertical: spacing.sm },
  resourceType: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  resourceTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 5, marginBottom: 8 },
  action: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  complete: { backgroundColor: colors.primary, borderRadius: radius.pill, padding: 15, alignItems: 'center', marginTop: spacing.xl },
  completeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  success: { color: colors.success, fontSize: 12, fontWeight: '700', marginTop: spacing.md },
  error: { color: colors.danger, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  stateCard: { gap: 8 },
  back: { paddingVertical: spacing.xl, alignItems: 'center' },
});
