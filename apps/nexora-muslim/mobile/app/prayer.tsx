import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockDhikr, mockPrayerSchedule, type PrayerTime } from '@/lib/prayer';

export default function PrayerScreen() {
  const [prayers, setPrayers] = useState(mockPrayerSchedule.prayers);
  const [dhikr, setDhikr] = useState(mockDhikr);
  const nextPrayer = prayers.find((prayer) => prayer.isNext);

  const togglePrayer = (name: PrayerTime['name']) => {
    setPrayers((current) =>
      current.map((prayer) =>
        prayer.name === name ? { ...prayer, completed: !prayer.completed } : prayer,
      ),
    );
  };

  const incrementDhikr = (id: string) => {
    setDhikr((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, completed: Math.min(item.completed + 1, item.target) }
          : item,
      ),
    );
  };

  return (
    <Screen>
      <Text style={styles.eyebrow}>IBADAH</Text>
      <Text style={styles.heading}>Prayer & Dhikr</Text>
      <Text style={styles.subtitle}>{mockPrayerSchedule.dateLabel} · {mockPrayerSchedule.locationLabel}</Text>

      <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>NEXT PRAYER</Text>
        <Text style={styles.nextName}>{nextPrayer?.name ?? 'Completed'}</Text>
        <Text style={styles.nextTime}>{nextPrayer?.time ?? '—'}</Text>
        <Text style={styles.nextHint}>Take a moment to prepare before the adhan.</Text>
      </View>

      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push('/qibla')} style={styles.quickAction} accessibilityRole="button">
          <Text style={styles.quickIcon}>◉</Text>
          <Text style={styles.quickTitle}>Qibla</Text>
          <Text style={styles.quickText}>Find direction</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/dhikr')} style={styles.quickAction} accessibilityRole="button">
          <Text style={styles.quickIcon}>✦</Text>
          <Text style={styles.quickTitle}>Dhikr</Text>
          <Text style={styles.quickText}>Open full counter</Text>
        </Pressable>
      </View>

      <SectionTitle title="Today's prayers" />
      <Card>
        {prayers.map((prayer, index) => (
          <Pressable
            key={prayer.name}
            onPress={() => togglePrayer(prayer.name)}
            accessibilityRole="button"
            accessibilityLabel={`${prayer.name} prayer, ${prayer.completed ? 'completed' : 'not completed'}`}
            style={[styles.prayerRow, index > 0 && styles.divider]}
          >
            <View style={[styles.status, prayer.completed && styles.statusDone]}>
              <Text style={styles.statusText}>{prayer.completed ? '✓' : ''}</Text>
            </View>
            <Text style={[styles.prayerName, prayer.isNext && styles.nextRowName]}>{prayer.name}</Text>
            <Text style={[styles.prayerTime, prayer.isNext && styles.nextRowTime]}>{prayer.time}</Text>
          </Pressable>
        ))}
        <View style={styles.sunriseRow}>
          <Text style={styles.muted}>Sunrise</Text>
          <Text style={styles.muted}>{mockPrayerSchedule.sunrise}</Text>
        </View>
      </Card>

      <SectionTitle title="Dhikr goals" />
      {dhikr.map((item) => {
        const progress = item.completed / item.target;
        return (
          <Card key={item.id} style={styles.dhikrCard}>
            <View style={styles.dhikrHeader}>
              <View style={styles.flex}>
                <Text style={styles.dhikrTitle}>{item.title}</Text>
                <Text style={styles.muted}>{item.completed} / {item.target}</Text>
              </View>
              <Pressable
                onPress={() => incrementDhikr(item.id)}
                style={styles.addButton}
                accessibilityRole="button"
                accessibilityLabel={`Add one ${item.title}`}
              >
                <Text style={styles.addText}>+1</Text>
              </Pressable>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </Card>
        );
      })}

      <Text style={styles.note}>Prayer times and location-based calculations will be connected to the provider layer in the backend integration phase.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 },
  heading: { marginTop: spacing.xs, color: colors.text, fontSize: typography.title, fontWeight: '800' },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted },
  nextCard: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.primary },
  nextLabel: { color: colors.primarySoft, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  nextName: { marginTop: spacing.sm, color: colors.white, fontSize: 26, fontWeight: '800' },
  nextTime: { color: colors.white, fontSize: 44, fontWeight: '300' },
  nextHint: { marginTop: spacing.sm, color: '#D8F1ED', lineHeight: 20 },
  quickActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  quickAction: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  quickIcon: { color: colors.primary, fontSize: 22 },
  quickTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800', marginTop: spacing.sm },
  quickText: { color: colors.textMuted, fontSize: typography.small, marginTop: 2 },
  prayerRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  status: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  statusDone: { borderColor: colors.success, backgroundColor: colors.success },
  statusText: { color: colors.white, fontWeight: '800' },
  prayerName: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '600' },
  nextRowName: { color: colors.primary, fontWeight: '800' },
  prayerTime: { color: colors.textMuted, fontSize: typography.body, fontWeight: '700' },
  nextRowTime: { color: colors.primary },
  sunriseRow: { paddingTop: spacing.md, marginTop: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: colors.textMuted, marginTop: spacing.xs },
  dhikrCard: { marginBottom: spacing.md },
  dhikrHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  dhikrTitle: { color: colors.text, fontWeight: '700', fontSize: typography.body },
  addButton: { minWidth: 48, minHeight: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.primaryDark, fontWeight: '800' },
  progressTrack: { height: 8, marginTop: spacing.md, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  note: { marginVertical: spacing.lg, color: colors.textMuted, fontSize: typography.small, lineHeight: 18 },
});
