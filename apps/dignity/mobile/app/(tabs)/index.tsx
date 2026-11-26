import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { Eyebrow, Heading, Metric, Panel, ProgressBar, Screen, Tag, palette } from '@/components/ui';

export default function HomeScreen() {
  const { identity } = useAuth();
  const firstName = identity?.displayName?.trim().split(/\s+/)[0] || 'Learner';

  return (
    <Screen>
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <View style={styles.logo}><Text style={styles.logoText}>d</Text></View>
          <View><Text style={styles.brandName}>dignity</Text><Text style={styles.brandCaption}>YOUR LEARNING SPACE</Text></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bell}>
          <Ionicons name="notifications-outline" size={21} color={palette.ink} />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Eyebrow>MONDAY · YOUR DAILY OVERVIEW</Eyebrow>
        <Heading title={'Good day, ' + firstName + ' 👋'} subtitle="Small steps today. A stronger you tomorrow." />
      </View>

      <Panel style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Tag label="YOUR LEARNING JOURNEY" tone="cyan" />
            <Text style={styles.heroTitle}>Keep your{'\n'}momentum going.</Text>
            <Text style={styles.heroText}>You’re building knowledge one focused session at a time.</Text>
          </View>
          <View style={styles.heroArt}>
            <Ionicons name="sparkles" size={26} color="#FFF3C4" />
            <Ionicons name="book" size={47} color="#FFFFFF" />
            <View style={styles.artOrbit} />
          </View>
        </View>
        <View style={styles.heroFooter}>
          <View style={styles.heroProgressCopy}><Text style={styles.heroProgressLabel}>Weekly learning goal</Text><Text style={styles.heroProgressValue}>3 of 5 sessions</Text></View>
          <ProgressBar value={60} color="#F6D77A" track="rgba(255,255,255,0.22)" height={8} />
        </View>
        <Pressable onPress={() => router.push('/(tabs)/learning')} style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Continue learning</Text><Ionicons name="arrow-forward" size={16} color={palette.primary} />
        </Pressable>
      </Panel>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your overview</Text><Text style={styles.sectionHint}>THIS WEEK</Text></View>
      <Panel style={styles.metricsPanel}>
        <Metric value="03" label="ACTIVE COURSES" color={palette.primary} />
        <View style={styles.metricDivider} />
        <Metric value="05" label="TASKS TO DO" color="#D58A3D" />
        <View style={styles.metricDivider} />
        <Metric value="82%" label="LEARNING PACE" color={palette.green} />
      </Panel>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Pick up where you left off</Text><Pressable onPress={() => router.push('/(tabs)/learning')}><Text style={styles.seeAll}>See all</Text></Pressable></View>
      <Pressable onPress={() => router.push('/(tabs)/learning')} style={({ pressed }) => [styles.courseCard, pressed && styles.pressed]}>
        <View style={styles.courseIcon}><Ionicons name="bulb-outline" size={22} color={palette.primary} /></View>
        <View style={styles.courseCopy}><Text style={styles.courseCategory}>PERSONAL DEVELOPMENT</Text><Text style={styles.courseTitle}>Learning how to learn</Text><Text style={styles.courseMeta}>Module 2 · Focus & consistency</Text><ProgressBar value={45} color={palette.primary} /></View>
        <Text style={styles.coursePercent}>45%</Text>
      </Pressable>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your campus</Text><Tag label="ACADEMIC HUB" tone="purple" /></View>
      <Panel style={{ gap: 2 }}>
        <Pressable onPress={() => router.push('/(tabs)/academic')} style={styles.quickLink}>
          <View style={[styles.quickIcon, { backgroundColor: palette.orangeSoft }]}><Ionicons name="calendar-outline" size={19} color="#C47A32" /></View>
          <View style={{ flex: 1 }}><Text style={styles.quickTitle}>Academic schedule</Text><Text style={styles.quickText}>View classes, deadlines and attendance</Text></View>
          <Ionicons name="chevron-forward" color="#A6AEC0" size={18} />
        </Pressable>
        <View style={styles.separator} />
        <Pressable onPress={() => router.push('/(tabs)/academic')} style={styles.quickLink}>
          <View style={[styles.quickIcon, { backgroundColor: palette.cyanSoft }]}><Ionicons name="document-text-outline" size={19} color="#168B85" /></View>
          <View style={{ flex: 1 }}><Text style={styles.quickTitle}>KRS & academic records</Text><Text style={styles.quickText}>Check registration and official status</Text></View>
          <Ionicons name="chevron-forward" color="#A6AEC0" size={18} />
        </Pressable>
      </Panel>
      <Text style={styles.disclaimer}>Preview content is illustrative. Your official academic information will appear when your institution connects its Dignity workspace.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 39, height: 39, borderRadius: 13, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 27, fontWeight: '900', lineHeight: 31 },
  brandName: { color: palette.ink, fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  brandCaption: { color: palette.muted, fontSize: 8, letterSpacing: 1.4, fontWeight: '800', marginTop: 1 },
  bell: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 9, right: 10, width: 6, height: 6, borderRadius: 5, backgroundColor: palette.rose },
  greeting: { gap: 9 },
  hero: { backgroundColor: '#6257E8', borderColor: '#6257E8', overflow: 'hidden', padding: 19 },
  heroTop: { flexDirection: 'row', gap: 8, minHeight: 142 },
  heroCopy: { flex: 1, gap: 10 },
  heroTitle: { color: '#fff', fontSize: 27, lineHeight: 31, fontWeight: '900', letterSpacing: -0.7 },
  heroText: { color: '#E6E4FF', fontSize: 11, lineHeight: 17, maxWidth: 210 },
  heroArt: { width: 91, height: 112, alignItems: 'center', justifyContent: 'center', gap: 6 },
  artOrbit: { position: 'absolute', width: 86, height: 86, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 50, transform: [{ rotate: '28deg' }] },
  heroFooter: { gap: 8, marginTop: 10 },
  heroProgressCopy: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgressLabel: { color: '#E6E4FF', fontSize: 10, fontWeight: '600' },
  heroProgressValue: { color: '#fff', fontSize: 10, fontWeight: '800' },
  heroButton: { backgroundColor: '#fff', minHeight: 43, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 15 },
  heroButtonText: { color: palette.primary, fontSize: 12, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -12 },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  sectionHint: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  metricsPanel: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17 },
  metricDivider: { width: 1, height: 34, backgroundColor: palette.line, marginHorizontal: 9 },
  seeAll: { color: palette.primary, fontSize: 11, fontWeight: '800' },
  courseCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  courseIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  courseCopy: { flex: 1, gap: 5 },
  courseCategory: { color: palette.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  courseTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  courseMeta: { color: palette.muted, fontSize: 10, marginBottom: 3 },
  coursePercent: { color: palette.primary, fontSize: 11, fontWeight: '900' },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  quickIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  quickText: { color: palette.muted, fontSize: 10, marginTop: 3 },
  separator: { height: 1, backgroundColor: palette.line, marginLeft: 49 },
  disclaimer: { color: '#9AA3B6', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10 },
  pressed: { opacity: 0.75 },
});