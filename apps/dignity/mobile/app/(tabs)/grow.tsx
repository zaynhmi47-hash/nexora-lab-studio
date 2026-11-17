import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/dignity/Screen';
import { SectionHeading } from '@/components/dignity/SectionHeading';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { DevelopmentCycle } from '@/components/dignity/DevelopmentCycle';
import { colors, radius, spacing } from '@/theme/tokens';
export default function GrowScreen() {
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  const [goal, setGoal] = useState('Build a consistent learning routine');
  return <Screen>
    <Text style={styles.eyebrow}>DIGNITY GROW</Text><Text style={styles.title}>Develop with intention.</Text>
    <Text style={styles.subtitle}>A personal space for goals, habits, reflection, self-management and meaningful growth.</Text>
    <View style={styles.section}><SectionHeading title="Development engine" subtitle="Return to any stage whenever you need." /><SurfaceCard><DevelopmentCycle active="Design" /></SurfaceCard></View>
    <View style={styles.section}><SectionHeading title="A focus for now" subtitle="Choose a direction that feels relevant to your life." />
      <SurfaceCard><View style={styles.row}><View style={styles.goalIcon}><Ionicons name="flag-outline" size={19} color={colors.primaryDark} /></View><View style={styles.flex}><Text style={styles.cardEyebrow}>CURRENT INTENTION</Text><Text style={styles.cardTitle}>{goal}</Text></View></View>
        <Pressable onPress={() => setGoal((current) => current === 'Build a consistent learning routine' ? 'Improve my communication skills' : 'Build a consistent learning routine')} style={styles.changeButton}><Text style={styles.changeText}>Change focus</Text></Pressable>
        <Text style={styles.helper}>Preview data only. Goal creation and syncing will be connected to the Grow API in a later vertical slice.</Text>
      </SurfaceCard>
    </View>
    <View style={styles.section}><SectionHeading title="Daily practice" subtitle="Small actions that support your chosen direction." />
      <SurfaceCard style={styles.practice}>
        <Practice text="Spend 15 minutes learning something useful" /><Practice text="Apply one idea in a real situation" /><Practice text="Notice what helped or got in the way" />
        <Text style={styles.helper}>Suggestions only — no streak pressure or automatic progress score.</Text>
      </SurfaceCard>
    </View>
    <View style={styles.section}><SectionHeading title="A moment to reflect" subtitle="Private reflection preview. Nothing is sent to an institution." />
      <SurfaceCard><Text style={styles.question}>What did you learn about yourself today?</Text>
        <TextInput accessibilityLabel="Personal reflection" multiline value={reflection} onChangeText={(value) => { setReflection(value); setSaved(false); }} placeholder="Write a few thoughts…" placeholderTextColor={colors.muted} style={styles.input} textAlignVertical="top" />
        <Pressable onPress={() => setSaved(true)} disabled={!reflection.trim()} style={[styles.saveButton, !reflection.trim() && styles.disabled]}><Text style={styles.saveText}>Save preview</Text></Pressable>
        {saved ? <Text style={styles.savedNotice}>Preview saved in this screen session only. Persistent private journal storage is not connected yet.</Text> : null}
      </SurfaceCard>
    </View>
  </Screen>;
}
function Practice({ text }: { text: string }) { return <View style={styles.practiceRow}><Ionicons name="checkmark-circle-outline" size={19} color={colors.primary} /><Text style={styles.practiceText}>{text}</Text></View>; }
const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  section: { marginBottom: spacing.section },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  cardEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { color: colors.ink, fontSize: 15, lineHeight: 21, fontWeight: '800', marginTop: 4 },
  changeButton: { alignSelf: 'flex-start', paddingVertical: 9, marginTop: 10 },
  changeText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  helper: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
  practice: { gap: 14 },
  practiceRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  practiceText: { color: colors.ink, fontSize: 12, flex: 1, lineHeight: 18 },
  question: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  input: { minHeight: 108, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, borderRadius: radius.medium, padding: 12, color: colors.ink, fontSize: 13 },
  saveButton: { alignSelf: 'flex-start', marginTop: 12, backgroundColor: colors.primaryDark, paddingHorizontal: 16, paddingVertical: 11, borderRadius: radius.pill },
  saveText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  savedNotice: { color: colors.success, fontSize: 10, lineHeight: 15, marginTop: 9 },
});