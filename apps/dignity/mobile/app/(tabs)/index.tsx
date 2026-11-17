import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { DevelopmentCycle } from '@/components/dignity/DevelopmentCycle';
import { PillarTile, developmentPillars } from '@/components/dignity/PillarTile';
import { useAuth } from '@/lib/auth';
import { colors, radius, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const { identity } = useAuth();
  const firstName = identity?.displayName?.trim().split(/\s+/)[0];
  return <Screen>
    <View style={styles.topbar}>
      <View><Text style={styles.eyebrow}>NEXORA · HUMAN DEVELOPMENT</Text>
        <Text style={styles.greeting}>{'Good morning' + (firstName ? ', ' + firstName : '') + '.'}</Text>
        <Text style={styles.subGreeting}>Your growth, at your own pace.</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
        <Ionicons name="person-outline" size={21} color={colors.primaryDark} />
      </Pressable>
    </View>
    <SurfaceCard style={styles.hero}>
      <View style={styles.heroTop}><View style={styles.heroTag}><Text style={styles.heroTagText}>YOUR DEVELOPMENT JOURNEY</Text></View><Ionicons name="sparkles-outline" size={21} color="#F4D9A6" /></View>
      <Text style={styles.heroTitle}>Small steps. Meaningful growth.</Text>
      <Text style={styles.heroCopy}>Understand yourself, build capability, and turn what matters into action.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/grow')} style={styles.heroButton}>
        <Text style={styles.heroButtonText}>Continue your journey</Text><Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
      </Pressable>
    </SurfaceCard>
    <View style={styles.section}><SectionHeading title="Your development cycle" subtitle="A flexible loop, not a fixed ladder." /><DevelopmentCycle active="Discover" /></View>
    <View style={styles.section}><SectionHeading title="Choose your direction" subtitle="Start with one area that matters to you." action="Explore all" />
      <View style={styles.pillarGrid}>{developmentPillars.slice(0, 4).map((pillar) => <PillarTile key={pillar.id} pillar={pillar} compact onPress={() => router.push('/(tabs)/discover')} />)}</View>
    </View>
    <View style={styles.section}><SectionHeading title="Your Dignity spaces" subtitle="Connected domains, each with its own purpose." />
      <View style={styles.domainGrid}>
        <DomainCard title="Grow" subtitle="Goals, habits & reflection" icon="leaf-outline" tint={colors.primarySoft} onPress={() => router.push('/(tabs)/grow')} />
        <DomainCard title="Learn" subtitle="Courses & practical skills" icon="book-outline" tint={colors.accentSoft} onPress={() => router.push('/(tabs)/learning')} />
        <DomainCard title="Academic" subtitle="Formal education records" icon="school-outline" tint={colors.blueSoft} onPress={() => router.push('/(tabs)/academic')} />
        <DomainCard title="Career" subtitle="Pathways & portfolio" icon="briefcase-outline" tint={colors.lavender} onPress={() => router.push('/(tabs)/career')} />
        <DomainCard title="Research" subtitle="Projects & inquiry" icon="flask-outline" tint={colors.roseSoft} onPress={() => router.push('/(tabs)/research')} />
        <DomainCard title="AI Mentor" subtitle="Guidance & learning support" icon="sparkles-outline" tint={colors.accentSoft} onPress={() => router.push('/(tabs)/mentor')} />
      </View>
    </View>
    <SurfaceCard style={styles.privacyCard}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} /><View style={styles.privacyCopy}>
      <Text style={styles.privacyTitle}>Your growth belongs to you</Text>
      <Text style={styles.privacyText}>Personal reflections and wellbeing are private by default. Academic records remain under institutional authority.</Text>
    </View></SurfaceCard>
    <Text style={styles.footer}>Dignity is a lifelong journey. There is no universal score for a person's worth.</Text>
  </Screen>;
}
function DomainCard({ title, subtitle, icon, tint, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; tint: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.domainCard, pressed && styles.pressed]}>
    <View style={[styles.domainIcon, { backgroundColor: tint }]}><Ionicons name={icon} size={19} color={colors.primaryDark} /></View>
    <Text style={styles.domainTitle}>{title}</Text><Text style={styles.domainSubtitle}>{subtitle}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  greeting: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.8, marginTop: 6 },
  subGreeting: { color: colors.muted, fontSize: 12, marginTop: 3 },
  avatar: { width: 43, height: 43, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  hero: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, padding: spacing.xl, marginBottom: spacing.section },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTag: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  heroTagText: { color: '#DCECE2', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, fontWeight: '900', letterSpacing: -0.6, marginTop: 18, maxWidth: 290 },
  heroCopy: { color: '#D6E6DC', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 310 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#E8F1E8', borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 19 },
  heroButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  section: { marginBottom: spacing.section },
  pillarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  domainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  domainCard: { width: '48%', flexGrow: 1, minHeight: 128, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md },
  domainIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  domainTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  domainSubtitle: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  privacyCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: '#F0F5EF', borderColor: '#DCE8DD', marginBottom: spacing.lg },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  footer: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginBottom: spacing.lg },
  pressed: { opacity: 0.75 },
});