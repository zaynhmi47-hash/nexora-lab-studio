import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/tokens';

export interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}

export const developmentPillars: Pillar[] = [
  { id: 'self', title: 'Self-discovery', description: 'Know yourself and your direction', icon: 'compass-outline', tint: colors.primarySoft },
  { id: 'intellectual', title: 'Intellectual', description: 'Knowledge and critical thinking', icon: 'bulb-outline', tint: colors.accentSoft },
  { id: 'skills', title: 'Skills & competence', description: 'Build practical capability', icon: 'construct-outline', tint: colors.blueSoft },
  { id: 'habits', title: 'Habits & discipline', description: 'Create sustainable routines', icon: 'repeat-outline', tint: colors.lavender },
  { id: 'social', title: 'Emotional & social', description: 'Relationships and communication', icon: 'people-outline', tint: colors.roseSoft },
  { id: 'wellness', title: 'Wellness', description: 'Care for your wellbeing', icon: 'leaf-outline', tint: colors.primarySoft },
  { id: 'creativity', title: 'Creativity', description: 'Imagine, make and experiment', icon: 'color-palette-outline', tint: colors.accentSoft },
  { id: 'career', title: 'Career & finance', description: 'Work and financial capability', icon: 'briefcase-outline', tint: colors.blueSoft },
  { id: 'contribution', title: 'Leadership & contribution', description: 'Serve, collaborate and lead', icon: 'hand-left-outline', tint: colors.lavender },
  { id: 'purpose', title: 'Values & purpose', description: 'Meaning and personal values', icon: 'sunny-outline', tint: colors.roseSoft },
];

export function PillarTile({ pillar, onPress, compact = false }: { pillar: Pillar; onPress?: () => void; compact?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tile, compact && styles.compact, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: pillar.tint }]}>
        <Ionicons name={pillar.icon} size={19} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>{pillar.title}</Text>
      {!compact ? <Text style={styles.description}>{pillar.description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 145, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: spacing.md, minHeight: 130 },
  compact: { minHeight: 92, padding: spacing.md },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
