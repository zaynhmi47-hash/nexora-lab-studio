import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { PillarTile, developmentPillars } from '@/components/dignity/PillarTile';
import { colors, spacing, radius } from '@/theme/tokens';
export default function DiscoverScreen() {
  return <Screen>
    <Text style={styles.eyebrow}>DISCOVER YOURSELF</Text>
    <Text style={styles.title}>What matters to you right now?</Text>
    <Text style={styles.subtitle}>Explore different parts of life. You choose where to begin, and you can change direction at any time.</Text>
    <SurfaceCard style={styles.prompt}>
      <View style={styles.promptIcon}><Ionicons name="compass-outline" size={22} color={colors.primaryDark} /></View>
      <Text style={styles.promptTitle}>Start with a question</Text>
      <Text style={styles.promptText}>What would you like to understand, change, or become more capable of?</Text>
      <Pressable onPress={() => router.push('/(tabs)/grow')} style={styles.promptButton}><Text style={styles.promptButtonText}>Reflect on this</Text><Ionicons name="arrow-forward" size={15} color="#fff" /></Pressable>
    </SurfaceCard>
    <View style={styles.section}><SectionHeading title="Ten development pillars" subtitle="Choose one or more. These are lenses, not scores or rankings." />
      <View style={styles.grid}>{developmentPillars.map((pillar) => <PillarTile key={pillar.id} pillar={pillar} onPress={() => router.push('/(tabs)/grow')} />)}</View>
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 4 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8, marginTop: 8, maxWidth: 330 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  prompt: { backgroundColor: colors.accentSoft, borderColor: '#F0DFBE', marginBottom: spacing.section },
  promptIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFF9ED', alignItems: 'center', justifyContent: 'center' },
  promptTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 13 },
  promptText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  promptButton: { alignSelf: 'flex-start', backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 14 },
  promptButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  section: { marginBottom: spacing.section },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});