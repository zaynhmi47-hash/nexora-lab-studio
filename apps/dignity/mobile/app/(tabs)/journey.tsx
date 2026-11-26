import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Eyebrow, Heading, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';

const ranges = ['7 days', '30 days', '90 days'] as const;

export default function JourneyScreen() {
  const [range, setRange] = useState<(typeof ranges)[number]>('30 days');
  return (
    <Screen>
      <Eyebrow>NOTICE HOW FAR YOU’VE COME</Eyebrow>
      <Heading title="My journey" subtitle="Learning is more than finishing lessons. See the practice, reflection and experiences that shape your growth." />
      <Panel style={styles.summary}>
        <View style={styles.summaryTop}><View style={styles.summaryIcon}><Ionicons name="trending-up" size={23} color="#fff" /></View><Tag label="PERSONAL GROWTH" tone="cyan" /></View>
        <Text style={styles.summaryValue}>Your progress, your pace.</Text>
        <Text style={styles.summaryText}>A meaningful journey is built from small actions repeated with intention.</Text>
        <View style={styles.metrics}><View><Text style={styles.metricValue}>08</Text><Text style={styles.metricLabel}>LEARNING ACTIVITIES</Text></View><View><Text style={styles.metricValue}>03</Text><Text style={styles.metricLabel}>SKILLS PRACTICED</Text></View><View><Text style={styles.metricValue}>02</Text><Text style={styles.metricLabel}>MILESTONES</Text></View></View>
      </Panel>
      <View style={styles.rangeRow}>{ranges.map((item) => <Text key={item} onPress={() => setRange(item)} style={[styles.range, range === item && styles.rangeActive]}>{item}</Text>)}</View>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Your timeline</Text><Tag label={range.toUpperCase()} tone="purple" /></View>
      <Panel style={styles.timeline}>
        <View style={styles.timelineItem}><View style={[styles.timelineIcon, { backgroundColor: palette.primarySoft }]}><Ionicons name="book-outline" size={17} color={palette.primary} /></View><View style={styles.timelineCopy}><Text style={styles.timelineDate}>RECENT LEARNING</Text><Text style={styles.timelineTitle}>Learning how to learn</Text><Text style={styles.timelineDetail}>Practiced focus and retrieval strategies.</Text><Tag label="PRACTICED" tone="purple" /></View></View>
        <View style={styles.timelineLine} />
        <View style={styles.timelineItem}><View style={[styles.timelineIcon, { backgroundColor: palette.cyanSoft }]}><Ionicons name="chatbubble-ellipses-outline" size={17} color="#168B85" /></View><View style={styles.timelineCopy}><Text style={styles.timelineDate}>REFLECTION</Text><Text style={styles.timelineTitle}>A better study routine</Text><Text style={styles.timelineDetail}>Identified a habit to strengthen this week.</Text><Tag label="REFLECTED" tone="cyan" /></View></View>
        <View style={styles.timelineLine} />
        <View style={styles.timelineItem}><View style={[styles.timelineIcon, { backgroundColor: palette.greenSoft }]}><Ionicons name="ribbon-outline" size={17} color={palette.green} /></View><View style={styles.timelineCopy}><Text style={styles.timelineDate}>MILESTONE</Text><Text style={styles.timelineTitle}>First learning milestone</Text><Text style={styles.timelineDetail}>A personal checkpoint in your learning path.</Text><Tag label="MILESTONE" tone="green" /></View></View>
      </Panel>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Competency snapshot</Text></View>
      <Panel style={{ gap: 13 }}>
        <View><View style={styles.skillMeta}><Text style={styles.skillName}>Learning strategies</Text><Text style={styles.skillValue}>In practice</Text></View><ProgressBar value={55} color={palette.primary} /></View>
        <View><View style={styles.skillMeta}><Text style={styles.skillName}>Digital confidence</Text><Text style={styles.skillValue}>Emerging</Text></View><ProgressBar value={30} color={palette.cyan} /></View>
        <Text style={styles.note}>Illustrative preview. These examples are not official grades, verified mastery or institution-issued credentials.</Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: '#6257E8', borderColor: '#6257E8', gap: 10 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  summaryValue: { color: '#fff', fontSize: 21, fontWeight: '900', letterSpacing: -0.5 },
  summaryText: { color: '#E6E4FF', fontSize: 11, lineHeight: 17 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 13, marginTop: 3 },
  metricValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  metricLabel: { color: '#DCD9FF', fontSize: 7, fontWeight: '800', letterSpacing: 0.7, marginTop: 2 },
  rangeRow: { flexDirection: 'row', backgroundColor: '#EAEDF5', padding: 4, borderRadius: 13 },
  range: { flex: 1, textAlign: 'center', overflow: 'hidden', color: palette.muted, fontSize: 10, fontWeight: '700', paddingVertical: 9, borderRadius: 10 },
  rangeActive: { color: palette.primary, backgroundColor: '#fff' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 11, paddingVertical: 8 },
  timelineIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timelineCopy: { flex: 1, gap: 5 },
  timelineDate: { color: palette.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  timelineTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  timelineDetail: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  timelineLine: { width: 1, height: 13, backgroundColor: palette.line, marginLeft: 17 },
  skillMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  skillName: { color: palette.ink, fontSize: 11, fontWeight: '700' },
  skillValue: { color: palette.muted, fontSize: 10 },
  note: { color: '#9AA3B6', fontSize: 9, lineHeight: 14 },
});