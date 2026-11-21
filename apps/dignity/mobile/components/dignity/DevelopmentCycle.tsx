import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
const stages = ['Discover', 'Assess', 'Design', 'Learn', 'Practice', 'Reflect', 'Improve', 'Demonstrate'];
export function DevelopmentCycle({ active = 'Discover' }: { active?: string }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
    {stages.map((stage, index) => {
      const selected = stage === active;
      return <View key={stage} style={styles.stageWrap}>
        <View style={[styles.stage, selected && styles.active]}><Text style={[styles.number, selected && styles.activeText]}>{index + 1}</Text></View>
        <Text style={[styles.label, selected && styles.activeLabel]}>{stage}</Text>
      </View>;
    })}
  </ScrollView>;
}
const styles = StyleSheet.create({
  track: { paddingVertical: 4, paddingRight: spacing.md, gap: spacing.md },
  stageWrap: { alignItems: 'center', width: 66, gap: 7 },
  stage: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  number: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  activeText: { color: '#FFFFFF' },
  label: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  activeLabel: { color: colors.primaryDark, fontWeight: '800' },
});