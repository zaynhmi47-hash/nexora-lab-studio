import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eyebrow, Heading, Panel, Screen, Tag, palette } from '@/components/ui';

const services = [
  { icon: 'calendar-outline' as const, title: 'Class schedule', description: 'Your classes, rooms and upcoming sessions.', color: palette.primary, soft: palette.primarySoft, status: 'SCHEDULE' },
  { icon: 'clipboard-outline' as const, title: 'Attendance', description: 'Review attendance history and session status.', color: '#168B85', soft: palette.cyanSoft, status: 'RECORDS' },
  { icon: 'create-outline' as const, title: 'KRS & course registration', description: 'Review your study plan and registration workflow.', color: '#C47A32', soft: palette.orangeSoft, status: 'REGISTRATION' },
  { icon: 'school-outline' as const, title: 'Grades & transcript', description: 'View published results and academic history.', color: '#C34F6B', soft: palette.roseSoft, status: 'OFFICIAL RECORDS' },
  { icon: 'flask-outline' as const, title: 'Research', description: 'Track proposals, supervisors and milestones.', color: palette.green, soft: palette.greenSoft, status: 'RESEARCH' },
  { icon: 'library-outline' as const, title: 'Library', description: 'Discover learning resources and references.', color: '#6473B9', soft: '#EEF0FB', status: 'RESOURCES' },
];

export default function AcademicScreen() {
  return (
    <Screen>
      <View style={styles.top}>
        <Eyebrow>YOUR INSTITUTION, CONNECTED</Eyebrow>
        <Heading title="Academic hub" subtitle="A clear view of your academic life, from class schedules to official records." />
      </View>

      <Panel style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View style={styles.statusIcon}><Ionicons name="business-outline" size={22} color={palette.primary} /></View>
          <View style={{ flex: 1, gap: 3 }}><Text style={styles.statusTitle}>Institution workspace</Text><Text style={styles.statusText}>Connect your school or campus to unlock academic services.</Text></View>
        </View>
        <Tag label="NOT CONNECTED" tone="orange" />
      </Panel>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Academic services</Text><Text style={styles.count}>06 MODULES</Text></View>
      <View style={styles.grid}>
        {services.map((service) => (
          <Pressable key={service.title} onPress={() => undefined} accessibilityRole="button" accessibilityLabel={service.title + ', institution connection required'} style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}>
            <View style={[styles.serviceIcon, { backgroundColor: service.soft }]}><Ionicons name={service.icon} size={22} color={service.color} /></View>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.serviceFooter}><Text style={styles.serviceStatus}>{service.status}</Text><Ionicons name="lock-closed-outline" size={12} color="#A6AEC0" /></View>
          </Pressable>
        ))}
      </View>

      <Panel style={styles.integrity}>
        <View style={styles.integrityIcon}><Ionicons name="shield-checkmark-outline" size={21} color={palette.green} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.integrityTitle}>Your records stay authoritative</Text>
          <Text style={styles.integrityText}>Learning activity and practice progress never silently become official grades, attendance or academic records. Official information comes from your institution’s authorized system.</Text>
        </View>
      </Panel>
      <Text style={styles.note}>Academic modules are currently presented as a product UI foundation. No official student record is fabricated or modified by this screen.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: 9 },
  statusCard: { gap: 13 },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  statusText: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -10 },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  count: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  serviceCard: { width: '48%', flexGrow: 1, minHeight: 157, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 13, gap: 8 },
  serviceIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  serviceDescription: { color: palette.muted, fontSize: 9, lineHeight: 14, flex: 1 },
  serviceFooter: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceStatus: { color: '#A6AEC0', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  integrity: { flexDirection: 'row', gap: 11, backgroundColor: palette.greenSoft, borderColor: '#D8F0E6' },
  integrityIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  integrityTitle: { color: '#176D55', fontSize: 12, fontWeight: '800' },
  integrityText: { color: '#397D69', fontSize: 10, lineHeight: 16 },
  note: { color: '#9AA3B6', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10 },
  pressed: { opacity: 0.75 },
});