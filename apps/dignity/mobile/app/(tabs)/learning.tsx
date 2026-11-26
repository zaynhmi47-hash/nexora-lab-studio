import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eyebrow, Heading, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';

const courses = [
  { id: 'learn', category: 'LEARNING SKILLS', title: 'Learning how to learn', description: 'Build better focus, memory and study habits.', progress: 45, lessons: '4 of 9 lessons', icon: 'bulb-outline' as const, tone: palette.primary, soft: palette.primarySoft },
  { id: 'digital', category: 'DIGITAL LITERACY', title: 'Digital confidence', description: 'Understand the tools shaping your world.', progress: 20, lessons: '2 of 10 lessons', icon: 'laptop-outline' as const, tone: '#168B85', soft: palette.cyanSoft },
  { id: 'growth', category: 'PERSONAL GROWTH', title: 'Communication essentials', description: 'Practice listening, clarity and collaboration.', progress: 0, lessons: 'Not started', icon: 'chatbubbles-outline' as const, tone: '#C47A32', soft: palette.orangeSoft },
];

export default function LearningScreen() {
  return (
    <Screen>
      <View style={styles.top}>
        <Eyebrow>GROW AT YOUR OWN PACE</Eyebrow>
        <Heading title="Your learning" subtitle="Explore ideas, practice new skills and make progress that lasts." />
      </View>
      <Panel style={styles.streak}>
        <View style={styles.streakIcon}><Ionicons name="flame" size={25} color="#E28B3F" /></View>
        <View style={{ flex: 1, gap: 3 }}><Text style={styles.streakTitle}>A little progress adds up</Text><Text style={styles.streakText}>Set aside 15 minutes for a focused session today.</Text></View>
        <Tag label="15 MIN" tone="orange" />
      </Panel>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Continue learning</Text><Tag label="3 COURSES" tone="purple" /></View>
      {courses.map((course) => (
        <Pressable key={course.id} onPress={() => router.push({ pathname: '/(tabs)/lesson/[lessonKey]', params: { lessonKey: course.id } })} style={({ pressed }) => [styles.course, pressed && styles.pressed]}>
          <View style={[styles.courseIcon, { backgroundColor: course.soft }]}><Ionicons name={course.icon} size={23} color={course.tone} /></View>
          <View style={styles.courseBody}>
            <Text style={[styles.category, { color: course.tone }]}>{course.category}</Text>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>
            <View style={styles.progressMeta}><Text style={styles.progressLabel}>{course.lessons}</Text><Text style={[styles.progressPercent, { color: course.tone }]}>{course.progress}%</Text></View>
            <ProgressBar value={course.progress} color={course.tone} />
          </View>
          <Ionicons name="chevron-forward" size={17} color="#A6AEC0" />
        </Pressable>
      ))}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Explore your growth</Text></View>
      <Panel style={{ gap: 4 }}>
        <Pressable style={styles.exploreRow} onPress={() => router.push('/(tabs)/journey')}>
          <View style={[styles.exploreIcon, { backgroundColor: palette.greenSoft }]}><Ionicons name="trending-up-outline" size={20} color={palette.green} /></View>
          <View style={{ flex: 1 }}><Text style={styles.exploreTitle}>My learning journey</Text><Text style={styles.exploreText}>See your progress, milestones and evidence.</Text></View>
          <Ionicons name="arrow-forward" size={16} color={palette.muted} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.exploreRow} onPress={() => router.push('/(tabs)/skills')}>
          <View style={[styles.exploreIcon, { backgroundColor: palette.primarySoft }]}><Ionicons name="ribbon-outline" size={20} color={palette.primary} /></View>
          <View style={{ flex: 1 }}><Text style={styles.exploreTitle}>Skills & competencies</Text><Text style={styles.exploreText}>Understand what you can do and what to practice.</Text></View>
          <Ionicons name="arrow-forward" size={16} color={palette.muted} />
        </Pressable>
      </Panel>
      <Text style={styles.note}>Course progress shown here is sample UI content until a learning account is connected to the Dignity API.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: 9 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  streakIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  streakTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  streakText: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10 },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  course: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  courseIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  courseBody: { flex: 1, gap: 5 },
  category: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  courseTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  courseDescription: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  progressLabel: { color: palette.muted, fontSize: 9, fontWeight: '600' },
  progressPercent: { fontSize: 9, fontWeight: '900' },
  exploreRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  exploreIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  exploreTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  exploreText: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  divider: { height: 1, backgroundColor: palette.line, marginLeft: 50 },
  note: { color: '#9AA3B6', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10 },
  pressed: { opacity: 0.75 },
});