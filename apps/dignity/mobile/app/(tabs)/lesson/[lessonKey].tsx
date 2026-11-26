import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eyebrow, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';

const lessonContent: Record<string, { title: string; module: string; duration: string; objective: string; points: string[] }> = {
  learn: { title: 'Learning how to learn', module: 'Learning skills · Module 2', duration: '12 min', objective: 'Recognize how attention, retrieval and spaced practice work together to make learning more effective.', points: ['Focus on one meaningful task at a time.', 'Recall ideas before looking back at your notes.', 'Return to important concepts over several days.'] },
  digital: { title: 'Digital confidence', module: 'Digital literacy · Module 1', duration: '10 min', objective: 'Build a thoughtful foundation for using digital tools safely and confidently.', points: ['Check the source before trusting information.', 'Protect accounts with unique passwords.', 'Pause before sharing personal information.'] },
  growth: { title: 'Communication essentials', module: 'Personal growth · Module 1', duration: '15 min', objective: 'Practice communicating with clarity, empathy and curiosity.', points: ['Listen to understand, not only to respond.', 'Use specific language and useful examples.', 'Ask questions when context is unclear.'] },
};

export default function LessonScreen() {
  const { lessonKey } = useLocalSearchParams<{ lessonKey: string }>();
  const lesson = lessonContent[lessonKey ?? ''] ?? lessonContent.learn;
  const [checked, setChecked] = useState<boolean[]>([false, false, false]);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const done = checked.filter(Boolean).length;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={19} color={palette.ink} /><Text style={styles.backText}>Back to learning</Text></Pressable>
      <Eyebrow>{lesson.module.toUpperCase()}</Eyebrow>
      <Text style={styles.title}>{lesson.title}</Text>
      <View style={styles.meta}><Tag label="GUIDED LESSON" tone="purple" /><View style={styles.duration}><Ionicons name="time-outline" size={13} color={palette.muted} /><Text style={styles.durationText}>{lesson.duration}</Text></View></View>
      <Panel style={styles.cover}>
        <View style={styles.coverOrb}><Ionicons name="book-outline" size={38} color="#FFFFFF" /></View>
        <Text style={styles.coverEyebrow}>A MOMENT TO GROW</Text>
        <Text style={styles.coverTitle}>Learn with intention.</Text>
        <Text style={styles.coverText}>Understand the idea, connect it to your life, then practice it.</Text>
      </Panel>
      <Panel>
        <Text style={styles.sectionTitle}>What you’ll explore</Text>
        <Text style={styles.body}>{lesson.objective}</Text>
      </Panel>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Key ideas</Text><Tag label={done + ' OF 3 REVIEWED'} tone={done === 3 ? 'green' : 'cyan'} /></View>
      <Panel style={{ gap: 5 }}>
        {lesson.points.map((point, index) => (
          <Pressable key={point} onPress={() => setChecked((current) => current.map((value, i) => i === index ? !value : value))} style={styles.pointRow}>
            <View style={[styles.check, checked[index] && styles.checkDone]}>{checked[index] ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.number}>{index + 1}</Text>}</View>
            <Text style={[styles.pointText, checked[index] && styles.pointChecked]}>{point}</Text>
          </Pressable>
        ))}
        <ProgressBar value={done / 3 * 100} color={palette.green} />
      </Panel>
      <Panel style={{ gap: 9 }}>
        <View style={styles.practiceHeader}><Ionicons name="create-outline" size={19} color={palette.primary} /><Text style={styles.sectionTitle}>Quick reflection</Text></View>
        <Text style={styles.body}>Which idea would make the biggest difference to your next study session?</Text>
        <Pressable onPress={() => setPracticeStarted((value) => !value)} style={styles.practiceButton}>
          <Text style={styles.practiceButtonText}>{practiceStarted ? 'Reflection noted on this device' : 'Start reflection'}</Text>
          <Ionicons name={practiceStarted ? 'checkmark-circle' : 'arrow-forward'} size={16} color="#fff" />
        </Pressable>
        <Text style={styles.helper}>This is a local learning interaction preview. Completion will only be recorded after connection to the Dignity learning service.</Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  backText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  title: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { color: palette.muted, fontSize: 10, fontWeight: '600' },
  cover: { backgroundColor: '#6257E8', borderColor: '#6257E8', alignItems: 'flex-start', padding: 20, minHeight: 190, justifyContent: 'center' },
  coverOrb: { width: 62, height: 62, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  coverEyebrow: { color: '#DCD9FF', fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  coverTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 6 },
  coverText: { color: '#E6E4FF', fontSize: 11, lineHeight: 17, marginTop: 5, maxWidth: 260 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  body: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 },
  check: { width: 27, height: 27, borderRadius: 10, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: palette.green },
  number: { color: palette.primary, fontSize: 11, fontWeight: '900' },
  pointText: { flex: 1, color: palette.ink, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  pointChecked: { color: palette.muted, textDecorationLine: 'line-through' },
  practiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  practiceButton: { minHeight: 43, borderRadius: 13, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  practiceButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  helper: { color: '#9AA3B6', fontSize: 9, lineHeight: 14 },
});