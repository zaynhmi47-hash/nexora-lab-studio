import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  mockDhikr,
  mockPrayerRepository,
  mockPrayerSchedule,
  type PrayerTime,
} from '@/lib/prayer';

export default function PrayerScreen() {
  const [schedule, setSchedule] = useState(mockPrayerSchedule);
  const [dhikr, setDhikr] = useState(mockDhikr);

  useEffect(() => {
    let active = true;

    void mockPrayerRepository.getDailySchedule().then((nextSchedule) => {
      if (active) setSchedule(nextSchedule);
    });

    return () => {
      active = false;
    };
  }, []);

  const { prayers } = schedule;
  const nextPrayer = prayers.find((prayer) => prayer.isNext);
  const completedPrayerCount = prayers.filter((prayer) => prayer.completed).length;

  const togglePrayer = (name: PrayerTime['name']) => {
    const prayer = prayers.find((item) => item.name === name);
    if (!prayer) return;

    void mockPrayerRepository
      .setPrayerCompleted(name, !prayer.completed)
      .then(setSchedule);
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
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>IBADAH</Text>
          <Text style={styles.heading}>Prayer & Dhikr</Text>
          <Text style={styles.subtitle}>
            {schedule.dateLabel} · {schedule.locationLabel}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Qibla"
          onPress={() => router.push('/qibla')}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Ionicons name="compass-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.nextCard}>
        <View style={styles.nextHeader}>
          <View>
            <Text style={styles.nextLabel}>NEXT PRAYER</Text>
            <Text style={styles.nextName}>{nextPrayer?.name ?? 'All complete'}</Text>
          </View>
          <View style={styles.nextIcon}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.nextTime}>{nextPrayer?.time ?? '—'}</Text>
        <Text style={styles.nextHint}>Take a moment to prepare before the adhan.</Text>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          </View>
          <Text style={styles.summaryValue}>{completedPrayerCount}/5</Text>
          <Text style={styles.summaryLabel}>prayers tracked</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="repeat-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.summaryValue}>{dhikr.reduce((total, item) => total + item.completed, 0)}</Text>
          <Text style={styles.summaryLabel}>dhikr counted</Text>
        </Card>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          onPress={() => router.push('/qibla')}
          style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open Qibla finder"
        >
          <View style={styles.quickIcon}>
            <Ionicons name="compass-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickTitle}>Qibla</Text>
            <Text style={styles.quickText}>Find direction</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/dhikr')}
          style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open full Dhikr counter"
        >
          <View style={styles.quickIcon}>
            <Ionicons name="repeat-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickTitle}>Dhikr</Text>
            <Text style={styles.quickText}>Open full counter</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <SectionTitle title="Today's prayers" action={`${completedPrayerCount}/5`} />
      <Card>
        {prayers.map((prayer, index) => (
          <Pressable
            key={prayer.name}
            onPress={() => togglePrayer(prayer.name)}
            accessibilityRole="checkbox"
            accessibilityLabel={`${prayer.name} prayer`}
            accessibilityState={{ checked: prayer.completed }}
            style={({ pressed }) => [styles.prayerRow, index > 0 && styles.divider, pressed && styles.pressed]}
          >
            <View style={[styles.status, prayer.completed && styles.statusDone]}>
              <Ionicons
                name="checkmark"
                size={15}
                color={prayer.completed ? colors.white : 'transparent'}
              />
            </View>
            <View style={styles.prayerCopy}>
              <Text style={[styles.prayerName, prayer.isNext && styles.nextRowName]}>{prayer.name}</Text>
              {prayer.isNext && <Text style={styles.nextBadge}>NEXT</Text>}
            </View>
            <Text style={[styles.prayerTime, prayer.isNext && styles.nextRowTime]}>{prayer.time}</Text>
          </Pressable>
        ))}
        <View style={styles.sunriseRow}>
          <View style={styles.sunriseCopy}>
            <Ionicons name="sunny-outline" size={17} color={colors.textMuted} />
            <Text style={styles.muted}>Sunrise</Text>
          </View>
          <Text style={styles.muted}>{schedule.sunrise}</Text>
        </View>
      </Card>

      <SectionTitle title="Dhikr goals" />
      {dhikr.map((item) => {
        const progress = item.target > 0 ? item.completed / item.target : 0;
        const isComplete = item.completed >= item.target;

        return (
          <Card key={item.id} style={styles.dhikrCard}>
            <View style={styles.dhikrHeader}>
              <View style={styles.dhikrIcon}>
                <Ionicons name="repeat-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.dhikrTitle}>{item.title}</Text>
                <Text style={styles.muted}>{item.completed} / {item.target}</Text>
              </View>
              <Pressable
                onPress={() => incrementDhikr(item.id)}
                disabled={isComplete}
                style={({ pressed }) => [
                  styles.addButton,
                  isComplete && styles.addButtonComplete,
                  pressed && !isComplete && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isComplete ? `${item.title} goal completed` : `Add one ${item.title}`}
                accessibilityState={{ disabled: isComplete }}
              >
                <Ionicons
                  name={isComplete ? 'checkmark' : 'add'}
                  size={19}
                  color={isComplete ? colors.success : colors.primaryDark}
                />
                {!isComplete && <Text style={styles.addText}>1</Text>}
              </Pressable>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
            </View>
          </Card>
        );
      })}

      <Card style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.note}>
          These prayer times are demo data. A calculation/provider service will supply verified times and location-aware values in the backend integration phase.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 },
  heading: { marginTop: spacing.xs, color: colors.text, fontSize: typography.title, fontWeight: '800' },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted },
  headerButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  nextCard: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.primary },
  nextHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextLabel: { color: colors.primarySoft, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  nextName: { marginTop: spacing.sm, color: colors.white, fontSize: 26, fontWeight: '800' },
  nextTime: { color: colors.white, fontSize: 44, fontWeight: '300', marginTop: spacing.xs },
  nextIcon: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  nextHint: { marginTop: spacing.sm, color: '#D8F1ED', lineHeight: 20 },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  summaryCard: { flex: 1, minWidth: 0 },
  summaryIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: colors.textMuted, fontSize: typography.small, marginTop: 2 },
  quickActions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  quickAction: { minHeight: 66, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  quickIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, marginLeft: spacing.md },
  quickTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  quickText: { color: colors.textMuted, fontSize: typography.small, marginTop: 2 },
  prayerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  status: { width: 28, height: 28, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  statusDone: { borderColor: colors.success, backgroundColor: colors.success },
  prayerCopy: { flex: 1 },
  prayerName: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  nextRowName: { color: colors.primary, fontWeight: '800' },
  nextBadge: { color: colors.primary, fontSize: 9, fontWeight: '800', marginTop: 2, letterSpacing: 0.8 },
  prayerTime: { color: colors.textMuted, fontSize: typography.body, fontWeight: '700' },
  nextRowTime: { color: colors.primary },
  sunriseRow: { paddingTop: spacing.md, marginTop: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sunriseCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  muted: { color: colors.textMuted, marginTop: spacing.xs },
  dhikrCard: { marginBottom: spacing.md },
  dhikrHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dhikrIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  dhikrTitle: { color: colors.text, fontWeight: '700', fontSize: typography.body },
  addButton: { minWidth: 54, minHeight: 40, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
  addButtonComplete: { backgroundColor: colors.surfaceMuted },
  addText: { color: colors.primaryDark, fontWeight: '800' },
  progressTrack: { height: 8, marginTop: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  noteCard: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginVertical: spacing.lg, backgroundColor: colors.surfaceMuted },
  note: { flex: 1, color: colors.textMuted, fontSize: typography.small, lineHeight: 18, marginTop: -2 },
  pressed: { opacity: 0.72 },
});
