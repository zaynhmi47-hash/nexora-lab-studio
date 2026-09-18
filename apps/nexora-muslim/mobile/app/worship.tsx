import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { colors, spacing, typography } from "@/constants/theme";
import { useAppState } from "@/lib/app-state";
import { mockPrayerSchedule } from "@/lib/prayer";

export default function WorshipScreen() {
  const { snapshot, loading } = useAppState();
  const prayers = mockPrayerSchedule.prayers;
  const completedPrayers = prayers.filter((item) => item.completed).length;
  const dhikrProgress = snapshot?.dhikr.totalTargets
    ? Math.min(100, Math.round((snapshot.dhikr.totalCompleted / snapshot.dhikr.totalTargets) * 100))
    : 0;

  const items = useMemo(() => [
    { title: "Prayer", value: completedPrayers + " / " + prayers.length, route: "/prayer" as const },
    { title: "Quran", value: snapshot?.quran.readingPosition ? "Reading in progress" : "Not started", route: "/quran" as const },
    { title: "Dhikr", value: dhikrProgress + "%", route: "/dhikr" as const },
    { title: "Learning", value: (snapshot?.learning.completedLessons ?? 0) + " lessons", route: "/learn" as const },
  ], [completedPrayers, dhikrProgress, prayers.length, snapshot]);

  return (
    <Screen>
      <Text style={styles.eyebrow}>DAILY WORSHIP</Text>
      <Text style={styles.heading}>Today's Worship</Text>
      <Text style={styles.subtitle}>A simple overview of your daily worship activities.</Text>

      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>DAILY PROGRESS</Text>
        <Text style={styles.summaryValue}>{loading ? "—" : completedPrayers + " prayer checkpoints"}</Text>
        <Text style={styles.muted}>Keep building your routine consistently.</Text>
      </Card>

      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable key={item.title} onPress={() => router.push(item.route)} style={styles.item}>
            <Card>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemValue}>{loading ? "—" : item.value}</Text>
              <Text style={styles.link}>Open ›</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.1 },
  heading: { color: colors.text, fontSize: typography.title, fontWeight: "800", marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 21 },
  summary: { marginTop: spacing.xl },
  summaryLabel: { color: colors.primary, fontSize: typography.small, fontWeight: "800" },
  summaryValue: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: spacing.sm },
  muted: { color: colors.textMuted, marginTop: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  item: { width: "48%" },
  itemTitle: { color: colors.text, fontWeight: "800" },
  itemValue: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: spacing.md },
  link: { color: colors.primary, fontSize: typography.small, fontWeight: "700", marginTop: spacing.md },
});
