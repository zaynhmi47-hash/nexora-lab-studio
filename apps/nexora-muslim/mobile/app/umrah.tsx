import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockUmrahJourney, type JourneyStage } from '@/lib/umrah';

export default function UmrahScreen() {
  const [journey, setJourney] = useState(mockUmrahJourney);

  const currentStage = useMemo(
    () => journey.stages.find((stage) => stage.id === journey.currentStageId),
    [journey.currentStageId, journey.stages],
  );

  const toggleChecklist = (id: string) => {
    setJourney((current) => {
      const checklist = current.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      );

      const stages = current.stages.map((stage) => {
        const stageItems = checklist.filter((item) => item.stageId === stage.id);
        const completedCount = stageItems.filter((item) => item.completed).length;
        return {
          ...stage,
          checklistCount: stageItems.length,
          completedChecklistCount: completedCount,
          progress: stageItems.length === 0 ? 0 : completedCount / stageItems.length,
        };
      });

      const completedCount = checklist.filter((item) => item.completed).length;

      return {
        ...current,
        checklist,
        stages,
        overallProgress: checklist.length === 0 ? 0 : completedCount / checklist.length,
      };
    });
  };

  const statusLabel = (stage: JourneyStage) => {
    if (stage.status === 'completed') return 'Completed';
    if (stage.status === 'current') return 'Current';
    return 'Locked';
  };

  const currentChecklist = journey.checklist.filter(
    (item) => item.stageId === journey.currentStageId,
  );

  return (
    <Screen>
      <Text style={styles.eyebrow}>UMRAH JOURNEY</Text>
      <Text style={styles.heading}>{journey.title}</Text>
      <Text style={styles.subtitle}>{journey.subtitle}</Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>YOUR JOURNEY</Text>
        <Text style={styles.progressValue}>{Math.round(journey.overallProgress * 100)}%</Text>
        <Text style={styles.heroText}>
          Progress is a preparation aid, not a measure of worship or spiritual worth.
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${journey.overallProgress * 100}%` }]} />
        </View>
      </View>

      <SectionTitle title="Journey path" />
      {journey.stages.map((stage, index) => (
        <Card key={stage.id} style={styles.stageCard}>
          <View style={styles.stageRow}>
            <View style={[styles.stageNumber, stage.status === 'current' && styles.stageNumberCurrent]}>
              <Text style={styles.stageNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text style={styles.stageTitle}>{stage.title}</Text>
                <Text style={[styles.status, stage.status === 'current' && styles.statusCurrent]}>
                  {statusLabel(stage)}
                </Text>
              </View>
              <Text style={styles.description}>{stage.description}</Text>
              <View style={styles.smallProgressTrack}>
                <View style={[styles.smallProgressFill, { width: `${stage.progress * 100}%` }]} />
              </View>
              <Text style={styles.muted}>
                {stage.completedChecklistCount} / {stage.checklistCount} checklist items
              </Text>
            </View>
          </View>
        </Card>
      ))}

      {currentStage ? (
        <>
          <SectionTitle title={`Current: ${currentStage.title}`} />
          {currentChecklist.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleChecklist(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.completed ? 'completed' : 'not completed'}`}
            >
              <Card style={styles.checkCard}>
                <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
                  <Text style={styles.checkmark}>{item.completed ? '✓' : ''}</Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.titleRow}>
                    <Text style={styles.checkTitle}>{item.title}</Text>
                    {item.required ? <Text style={styles.required}>Required</Text> : null}
                  </View>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      ) : null}

      <Text style={styles.disclaimer}>
        Travel requirements, health rules, visa information, and religious guidance can change.
        Nexora Muslim will connect these areas to verified official or qualified sources before
        production use. This prototype does not act as a travel organizer or religious authority.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 },
  heading: { marginTop: spacing.xs, color: colors.text, fontSize: typography.title, fontWeight: '800' },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 20 },
  hero: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.primary },
  heroLabel: { color: colors.primarySoft, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  progressValue: { marginTop: spacing.sm, color: colors.white, fontSize: 42, fontWeight: '800' },
  heroText: { marginTop: spacing.xs, color: colors.white, lineHeight: 20 },
  progressTrack: { height: 9, marginTop: spacing.lg, borderRadius: 5, backgroundColor: colors.primaryDark, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.white },
  stageCard: { marginBottom: spacing.md },
  stageRow: { flexDirection: 'row', gap: spacing.md },
  stageNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  stageNumberCurrent: { backgroundColor: colors.primarySoft },
  stageNumberText: { color: colors.primaryDark, fontWeight: '800' },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stageTitle: { flex: 1, color: colors.text, fontWeight: '800', fontSize: typography.body },
  status: { color: colors.textMuted, fontSize: typography.small, fontWeight: '700' },
  statusCurrent: { color: colors.primary },
  description: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 19 },
  smallProgressTrack: { height: 6, marginTop: spacing.md, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  smallProgressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  muted: { marginTop: spacing.xs, color: colors.textMuted, fontSize: typography.small },
  checkCard: { marginBottom: spacing.md, flexDirection: 'row', gap: spacing.md },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { color: colors.white, fontWeight: '800' },
  checkTitle: { flex: 1, color: colors.text, fontWeight: '700' },
  required: { color: colors.warning, fontSize: typography.small, fontWeight: '700' },
  disclaimer: { marginVertical: spacing.lg, color: colors.textMuted, fontSize: typography.small, lineHeight: 18 },
});
