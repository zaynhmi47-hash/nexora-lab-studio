import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockKnowledgeProvider } from '@/lib/knowledge';
import type { IslamicKnowledgeSnapshot } from '@/lib/knowledge';

export default function KnowledgeScreen() {
  const [snapshot, setSnapshot] = useState<IslamicKnowledgeSnapshot | null>(null);

  useEffect(() => {
    let active = true;
    void mockKnowledgeProvider.getSnapshot().then((nextSnapshot) => {
      if (active) setSnapshot(nextSnapshot);
    });
    return () => { active = false; };
  }, []);

  if (!snapshot) {
    return <Screen><Text style={styles.muted}>Loading knowledge foundation…</Text></Screen>;
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Islamic Knowledge</Text>
        <Text style={styles.subtitle}>Learn with references, context, and clear source metadata.</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Source-aware foundation</Text>
          <Text style={styles.noticeText}>Production answers must use verified sources. The app should not invent hadith, references, fatwas, or scholarly consensus.</Text>
        </View>

        <Text style={styles.section}>Explore topics</Text>
        {snapshot.topics.map((topic) => (
          <Pressable key={topic.id} onPress={() => router.push(`/knowledge/topic/${topic.id}`)} accessibilityRole="button" accessibilityLabel={`Open ${topic.title} topic`}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{topic.title}</Text>
              <Text style={styles.muted}>{topic.description}</Text>
              <Text style={styles.sourceCount}>{topic.sourceCount} source{topic.sourceCount === 1 ? '' : 's'} · View details ›</Text>
            </Card>
          </Pressable>
        ))}

        <Text style={styles.section}>Hadith foundation</Text>
        {snapshot.hadith.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/knowledge/hadith/${item.id}`)} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.collection}</Text>
              <Text style={styles.muted}>{item.reference}</Text>
              <View style={styles.gradePill}><Text style={styles.gradeText}>Grade: {item.grade}</Text></View>
              <Text style={styles.body}>{item.summary}</Text>
              <Text style={styles.sourceCount}>View hadith details ›</Text>
            </Card>
          </Pressable>
        ))}

        <Text style={styles.footer}>Religious guidance can differ by school and qualified scholarship. This prototype is a learning interface, not a religious authority.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  title: { fontSize: typography.title, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  notice: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  noticeTitle: { color: colors.primaryDark, fontWeight: '800', fontSize: typography.body },
  noticeText: { marginTop: spacing.xs, color: colors.text, lineHeight: 20 },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm, fontSize: typography.heading, fontWeight: '800', color: colors.text },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  meta: { marginTop: spacing.xs, color: colors.primaryDark, fontWeight: '700' },
  muted: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 20 },
  sourceCount: { marginTop: spacing.md, color: colors.primary, fontSize: typography.caption, fontWeight: '700' },
  gradePill: { alignSelf: 'flex-start', marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  gradeText: { color: colors.primaryDark, fontSize: typography.caption, fontWeight: '700' },
  body: { marginTop: spacing.md, color: colors.text, lineHeight: 21 },
  footer: { marginTop: spacing.xl, marginBottom: spacing.xxl, color: colors.textMuted, fontSize: typography.caption, lineHeight: 19 },
});
