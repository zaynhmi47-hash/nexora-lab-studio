import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';

const methods = [
  { icon: 'refresh-outline' as const, title: 'Active recall', detail: 'Retrieve ideas from memory.' },
  { icon: 'time-outline' as const, title: 'Spaced practice', detail: 'Return to knowledge over time.' },
  { icon: 'construct-outline' as const, title: 'Deliberate practice', detail: 'Improve with focused feedback.' },
  { icon: 'extension-puzzle-outline' as const, title: 'Real-world projects', detail: 'Apply knowledge in context.' },
];
export default function LearningScreen() {
  return <Screen>
    <Text style={styles.eyebrow}>DIGNITY LEARN</Text>
    <Text style={styles.title}>Learn what moves you forward.</Text>
    <Text style={styles.subtitle}>Structured learning and self-directed practice, connected to your goals.</Text>
    <View style={styles.section}><SectionHeading title="Learning methods" subtitle="Build understanding, not just completion." />
      <View style={styles.grid}>{methods.map((item) => <SurfaceCard key={item.title} style={styles.method}>
        <View style={styles.methodIcon}><Ionicons name={item.icon} size={19} color={colors.primaryDark} /></View>
        <Text style={styles.methodTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text>
      </SurfaceCard>)}</View>
    </View>
    <View style={styles.section}><SectionHeading title="Explore Dignity domains" subtitle="Different learning and achievement contexts." />
      <Domain title="Academic" detail="Programs, courses, schedules, KRS and official records" icon="school-outline" onPress={() => router.push('/(tabs)/academic')} />
      <Domain title="Career" detail="Skills, professional pathways and portfolio evidence" icon="briefcase-outline" onPress={() => router.push('/(tabs)/career')} />
      <Domain title="Research" detail="Projects, proposals and research milestones" icon="flask-outline" onPress={() => router.push('/(tabs)/research')} />
    </View>
    <SurfaceCard style={styles.note}><Ionicons name="information-circle-outline" size={19} color={colors.primary} /><Text style={styles.noteText}>Learning progress, demonstrated mastery and official academic credit are different kinds of evidence. Dignity keeps them distinct.</Text></SurfaceCard>
  </Screen>;
}
function Domain({ title, detail, icon, onPress }: { title: string; detail: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.domain, pressed && styles.pressed]}>
    <View style={styles.domainIcon}><Ionicons name={icon} size={20} color={colors.primaryDark} /></View>
    <View style={styles.domainCopy}><Text style={styles.domainTitle}>{title}</Text><Text style={styles.detail}>{detail}</Text></View>
    <Ionicons name="chevron-forward" size={17} color={colors.muted} />
  </Pressable>;
}
const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  section: { marginBottom: spacing.section },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  method: { width: '48%', flexGrow: 1, minHeight: 130, padding: spacing.md },
  methodIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  methodTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  domain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  domainIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  domainCopy: { flex: 1 },
  domainTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  note: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.blueSoft, borderColor: '#D9E4F0' },
  noteText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.75 },
});