import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { mockKnowledgeProvider, nexoraCoreKnowledgeProvider, type KnowledgeTopic, type SourceReference } from '@/lib/knowledge';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function KnowledgeTopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { session } = useAuth();
  const [topic, setTopic] = useState<KnowledgeTopic | null>(null);
  const [sources, setSources] = useState<SourceReference[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!topicId) return;
      const provider = session?.user.provider === 'firebase' ? nexoraCoreKnowledgeProvider(session) : mockKnowledgeProvider;
      const [nextTopic, nextSources] = await Promise.all([
        provider.getTopic(topicId),
        provider.listSources(topicId),
      ]);
      if (!active) return;
      setTopic(nextTopic);
      setSources(nextSources);
    };
    void load();
    return () => { active = false; };
  }, [session, topicId]);

  if (!topic) {
    return <Screen><View style={styles.center}><Text style={styles.title}>Topic not found</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Go back</Text></Pressable></View></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>‹ Back to knowledge</Text>
        </Pressable>
        <Text style={styles.eyebrow}>KNOWLEDGE TOPIC</Text>
        <Text style={styles.title}>{topic.title}</Text>
        <Text style={styles.description}>{topic.description}</Text>

        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Source coverage</Text>
          <Text style={styles.muted}>{sources.length} source{sources.length === 1 ? '' : 's'} currently attached to this topic.</Text>
        </Card>

        <Text style={styles.section}>References</Text>
        {sources.length === 0 ? (
          <Card><Text style={styles.muted}>No verified reference has been attached to this topic yet.</Text></Card>
        ) : sources.map((source) => (
          <Card key={source.id} style={styles.sourceCard}>
            <Text style={styles.cardTitle}>{source.title}</Text>
            <Text style={styles.type}>{source.type.toUpperCase()}</Text>
            {source.collection ? <Text style={styles.meta}>{source.collection}</Text> : null}
            {source.reference ? <Text style={styles.muted}>{source.reference}</Text> : null}
            {source.url ? <Text style={styles.muted}>External source available</Text> : null}
          </Card>
        ))}

        <Text style={styles.footer}>References shown here are metadata in the prototype. Production content should be imported from approved, verifiable datasets.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  back: { color: colors.primary, fontWeight: '800', marginBottom: spacing.xl },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  title: { marginTop: spacing.md, color: colors.text, fontSize: typography.title, fontWeight: '900' },
  description: { marginTop: spacing.sm, color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  infoCard: { marginTop: spacing.xl },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  muted: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 21 },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm, color: colors.text, fontSize: 19, fontWeight: '900' },
  sourceCard: { marginBottom: spacing.md },
  type: { marginTop: spacing.sm, color: colors.primary, fontSize: 11, fontWeight: '900' },
  meta: { marginTop: spacing.xs, color: colors.primaryDark, fontWeight: '700' },
  footer: { marginTop: spacing.xl, color: colors.textMuted, fontSize: typography.caption, lineHeight: 19 },
});
