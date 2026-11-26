import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eyebrow, Heading, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';

const competencies = [
  { title: 'Learning strategies', detail: 'Plan, monitor and improve your own learning.', level: 'In practice', progress: 55, color: palette.primary },
  { title: 'Digital confidence', detail: 'Use digital information and tools thoughtfully.', level: 'Emerging', progress: 30, color: palette.cyan },
  { title: 'Communication', detail: 'Share ideas clearly and listen with empathy.', level: 'Getting started', progress: 15, color: palette.orange },
];

export default function SkillsScreen() {
  return (
    <Screen>
      <Eyebrow>MAKE YOUR GROWTH VISIBLE</Eyebrow>
      <Heading title="Skills & competencies" subtitle="Understand the capabilities you are developing, the evidence you collect and the next steps to practice." />
      <Panel style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="ribbon" size={25} color="#fff" /></View>
        <Text style={styles.heroTitle}>Skills grow through evidence.</Text>
        <Text style={styles.heroText}>A lesson introduces an idea. Practice builds confidence. Evidence helps you reflect on what you can do.</Text>
        <View style={styles.heroFooter}><Tag label="LEARNING PORTFOLIO" tone="cyan" /><Text style={styles.heroCount}>03 COMPETENCIES</Text></View>
      </Panel>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Your competencies</Text></View>
      {competencies.map((item) => (
        <Panel key={item.title} style={styles.competency}>
          <View style={styles.competencyTop}><View style={{ flex: 1, gap: 4 }}><Text style={styles.competencyTitle}>{item.title}</Text><Text style={styles.competencyDetail}>{item.detail}</Text></View><Tag label={item.level.toUpperCase()} tone={item.color === palette.primary ? 'purple' : item.color === palette.cyan ? 'cyan' : 'orange'} /></View>
          <ProgressBar value={item.progress} color={item.color} />
          <Text style={styles.evidenceHint}>Progress is a learning reflection, not a verified mastery score.</Text>
        </Panel>
      ))}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Build your portfolio</Text></View>
      <Panel style={{ gap: 4 }}>
        <Pressable style={styles.action} onPress={() => undefined}><View style={[styles.actionIcon, { backgroundColor: palette.primarySoft }]}><Ionicons name="cloud-upload-outline" size={20} color={palette.primary} /></View><View style={{ flex: 1 }}><Text style={styles.actionTitle}>Add learning evidence</Text><Text style={styles.actionText}>Attach a project, reflection or practice sample.</Text></View><Ionicons name="chevron-forward" color="#A6AEC0" size={17} /></Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.action} onPress={() => undefined}><View style={[styles.actionIcon, { backgroundColor: palette.greenSoft }]}><Ionicons name="share-social-outline" size={20} color={palette.green} /></View><View style={{ flex: 1 }}><Text style={styles.actionTitle}>Portfolio sharing</Text><Text style={styles.actionText}>Choose what you want to share and with whom.</Text></View><Ionicons name="chevron-forward" color="#A6AEC0" size={17} /></Pressable>
      </Panel>
      <Text style={styles.note}>Evidence upload, review and sharing permissions will be connected to Dignity services in a later implementation phase.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#6257E8', borderColor: '#6257E8', gap: 10 },
  heroIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroText: { color: '#E6E4FF', fontSize: 11, lineHeight: 17 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  heroCount: { color: '#DCD9FF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  sectionHead: { marginBottom: -10 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  competency: { gap: 11 },
  competencyTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  competencyTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  competencyDetail: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  evidenceHint: { color: '#9AA3B6', fontSize: 9 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  actionIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  actionText: { color: palette.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  divider: { height: 1, backgroundColor: palette.line, marginLeft: 50 },
  note: { color: '#9AA3B6', fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 10 },
});