import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockQuran, nexoraCoreQuranRepository, type QuranPort, type QuranReadingGoal, type QuranReadingStatistics } from '@/lib/quran';

export default function QuranGoalsScreen() {
  const { session } = useAuth();
  const repository = useMemo<QuranPort>(() => session?.user.provider === 'firebase' ? nexoraCoreQuranRepository(session) : mockQuran, [session]);
  const [stats, setStats] = useState<QuranReadingStatistics | null>(null);
  const [pages, setPages] = useState('4');
  const [minutes, setMinutes] = useState('15');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const next = await repository.getReadingStatistics();
    setStats(next);
    setPages(String(next.goal.dailyTargetPages));
    setMinutes(String(next.goal.dailyTargetMinutes));
    setLoading(false);
  }

  useEffect(() => { void load(); }, [repository]);

  async function saveGoal() {
    const goal: QuranReadingGoal = { dailyTargetPages: Number(pages), dailyTargetMinutes: Number(minutes) };
    if (!Number.isInteger(goal.dailyTargetPages) || !Number.isInteger(goal.dailyTargetMinutes)) return;
    await repository.updateReadingGoal(goal);
    await load();
  }

  async function logToday() {
    if (!stats) return;
    await repository.logReading({
      date: stats.today.date,
      pages: Math.max(0, Number(stats.today.pages)),
      minutes: Math.max(0, Number(stats.today.minutes)),
    });
    await load();
  }

  const pagePercent = Math.round((stats?.today.pagesProgress ?? 0) * 100);
  const minutePercent = Math.round((stats?.today.minutesProgress ?? 0) * 100);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Quran</Text></Pressable>
        <Text style={styles.eyebrow}>QURAN JOURNEY</Text>
        <Text style={styles.heading}>Reading Goals & Statistics</Text>
        <Text style={styles.subtitle}>Set a daily target and track your reading consistently.</Text>

        <Card style={styles.card}>
          <Text style={styles.section}>Today</Text>
          {loading ? <Text style={styles.muted}>Loading statistics…</Text> : <>
            <View style={styles.statRow}><Text style={styles.statLabel}>Pages</Text><Text style={styles.statValue}>{stats?.today.pages ?? 0} / {stats?.goal.dailyTargetPages ?? 0}</Text></View>
            <View style={styles.track}><View style={[styles.fill, { width: `${pagePercent}%` }]} /></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Reading time</Text><Text style={styles.statValue}>{stats?.today.minutes ?? 0} / {stats?.goal.dailyTargetMinutes ?? 0} min</Text></View>
            <View style={styles.track}><View style={[styles.fill, { width: `${minutePercent}%` }]} /></View>
          </>}
        </Card>

        <View style={styles.grid}>
          <Card style={styles.metric}><Text style={styles.metricValue}>{stats?.currentStreak ?? 0}</Text><Text style={styles.metricLabel}>Day streak</Text></Card>
          <Card style={styles.metric}><Text style={styles.metricValue}>{stats?.total.pages ?? 0}</Text><Text style={styles.metricLabel}>Total pages</Text></Card>
          <Card style={styles.metric}><Text style={styles.metricValue}>{stats?.total.minutes ?? 0}</Text><Text style={styles.metricLabel}>Total minutes</Text></Card>
        </View>

        <Card style={styles.card}>
          <Text style={styles.section}>Daily target</Text>
          <Text style={styles.label}>Pages per day</Text>
          <TextInput value={pages} onChangeText={setPages} keyboardType="number-pad" style={styles.input} />
          <Text style={styles.label}>Minutes per day</Text>
          <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" style={styles.input} />
          <Pressable style={styles.primaryButton} onPress={() => void saveGoal()}><Text style={styles.primaryText}>Save goal</Text></Pressable>
        </Card>

        <Card style={styles.note}><Text style={styles.noteText}>Reading statistics are based on explicit daily logs. The app does not infer pages or time from screen activity.</Text></Card>
        <Pressable style={styles.secondaryButton} onPress={() => void logToday()}><Text style={styles.secondaryText}>Save today's reading log</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container:{paddingBottom:spacing.xxl},
  back:{color:colors.primary,fontWeight:'800',fontSize:16,marginBottom:spacing.lg},
  eyebrow:{fontSize:typography.small,fontWeight:'800',color:colors.primary},
  heading:{fontSize:typography.title,fontWeight:'800',color:colors.text,marginTop:spacing.xs},
  subtitle:{marginTop:spacing.xs,color:colors.textMuted,lineHeight:22},
  card:{marginTop:spacing.lg,padding:spacing.lg},
  section:{fontSize:typography.heading,fontWeight:'800',color:colors.text,marginBottom:spacing.md},
  muted:{color:colors.textMuted},
  statRow:{flexDirection:'row',justifyContent:'space-between',marginTop:spacing.sm},
  statLabel:{color:colors.textMuted,fontWeight:'700'},
  statValue:{color:colors.text,fontWeight:'800'},
  track:{height:9,borderRadius:radius.pill,backgroundColor:colors.surfaceMuted,overflow:'hidden',marginTop:spacing.xs,marginBottom:spacing.sm},
  fill:{height:'100%',backgroundColor:colors.primary,borderRadius:radius.pill},
  grid:{flexDirection:'row',gap:spacing.sm,marginTop:spacing.md},
  metric:{flex:1,padding:spacing.md},
  metricValue:{fontSize:24,fontWeight:'800',color:colors.text},
  metricLabel:{marginTop:3,color:colors.textMuted,fontSize:typography.caption},
  label:{fontSize:typography.caption,color:colors.textMuted,fontWeight:'700',marginTop:spacing.sm,marginBottom:spacing.xs},
  input:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,color:colors.text,backgroundColor:colors.surface},
  primaryButton:{marginTop:spacing.lg,backgroundColor:colors.primary,padding:spacing.md,borderRadius:radius.md,alignItems:'center'},
  primaryText:{color:colors.white,fontWeight:'800'},
  note:{marginTop:spacing.md,padding:spacing.md,backgroundColor:colors.surfaceMuted},
  noteText:{color:colors.textMuted,lineHeight:20},
  secondaryButton:{marginTop:spacing.md,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,alignItems:'center'},
  secondaryText:{color:colors.primaryDark,fontWeight:'800'},
});
