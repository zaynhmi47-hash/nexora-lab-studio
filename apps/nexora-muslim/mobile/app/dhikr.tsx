import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mockDhikrRepository, nexoraCoreDhikrRepository, type Dhikr, type DhikrRepository } from '@/lib/dhikr';

export default function DhikrScreen() {
  const { session } = useAuth();
  const { refresh: refreshAppState } = useAppState();
  const [items, setItems] = useState<Dhikr[]>([]);
  const [loading, setLoading] = useState(true);

  const repository = useMemo<DhikrRepository>(() => (
    session?.user.provider === 'firebase' ? nexoraCoreDhikrRepository(session) : mockDhikrRepository
  ), [session]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    repository.getAll().then((data) => {
      if (mounted) {
        setItems(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [repository]);

  const totalCount = useMemo(() => items.reduce((total, item) => total + item.completed, 0), [items]);
  const completedGoals = useMemo(() => items.filter((item) => item.completed >= item.target && item.target > 0).length, [items]);

  const increment = async (id: string) => {
    const updated = await repository.increment(id);
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    await refreshAppState();
  };

  const reset = async (id: string) => {
    const updated = await repository.reset(id);
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    await refreshAppState();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>IBADAH</Text><Text style={styles.title}>Dhikr</Text></View>
      </View>
      <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="leaf-outline" size={26} color={colors.primary} /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>Daily remembrance</Text><Text style={styles.heroText}>Build a simple, consistent dhikr routine.</Text></View></View>
      <View style={styles.summaryRow}><View style={styles.summaryCard}><Text style={styles.summaryValue}>{totalCount}</Text><Text style={styles.summaryLabel}>counted today</Text></View><View style={styles.summaryCard}><Text style={styles.summaryValue}>{completedGoals}/{items.length}</Text><Text style={styles.summaryLabel}>goals completed</Text></View></View>
      {loading ? <Text style={styles.loading}>Loading dhikr...</Text> : items.length === 0 ? <View style={styles.empty}><Ionicons name="leaf-outline" size={28} color={colors.textMuted} /><Text style={styles.emptyText}>No dhikr goals available.</Text></View> : items.map((item) => {
        const progress = item.target === 0 ? 0 : item.completed / item.target;
        const done = item.completed >= item.target;
        return <View key={item.id} style={styles.card}>
          <View style={styles.cardTop}><View style={styles.titleCopy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.category}>{item.category}</Text></View><Text style={styles.count}>{item.completed}/{item.target}</Text></View>
          <Text style={styles.arabic}>{item.arabic}</Text><Text style={styles.transliteration}>{item.transliteration}</Text><Text style={styles.translation}>{item.translation}</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} /></View>
          <View style={styles.actions}><Pressable disabled={done} onPress={() => increment(item.id)} style={({ pressed }) => [styles.button, done && styles.buttonDone, pressed && !done && styles.pressed]} accessibilityRole="button" accessibilityLabel={done ? `${item.title} completed` : `Count one ${item.title}`} accessibilityState={{ disabled: done }}><Ionicons name={done ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={done ? colors.success : colors.white} /><Text style={[styles.buttonText, done && styles.buttonTextDone]}>{done ? 'Completed' : 'Count +1'}</Text></Pressable><Pressable onPress={() => reset(item.id)} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Reset ${item.title}`}><Ionicons name="refresh-outline" size={19} color={colors.textMuted} /></Pressable></View>
        </View>;
      })}
      <Text style={styles.disclaimer}>Content shown here is demo data for the app prototype. Verified content and source metadata will be added before production.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing.xxl }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl }, backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, headerCopy: { flex: 1 }, eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 }, title: { color: colors.text, fontSize: typography.title, fontWeight: '800', marginTop: 2 }, hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md }, heroIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, heroCopy: { flex: 1 }, heroTitle: { color: colors.primaryDark, fontSize: typography.heading, fontWeight: '800' }, heroText: { color: colors.primaryDark, fontSize: typography.caption, marginTop: 3, lineHeight: 18 }, summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }, summaryCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }, summaryValue: { color: colors.text, fontSize: 21, fontWeight: '800' }, summaryLabel: { color: colors.textMuted, fontSize: typography.small, marginTop: 2 }, loading: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }, empty: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }, emptyText: { color: colors.textMuted, marginTop: spacing.sm }, card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, titleCopy: { flex: 1 }, cardTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' }, category: { color: colors.textMuted, fontSize: typography.small, textTransform: 'capitalize', marginTop: 2 }, count: { color: colors.primary, fontSize: typography.body, fontWeight: '900' }, arabic: { color: colors.text, fontSize: 27, textAlign: 'right', lineHeight: 48, marginTop: spacing.lg }, transliteration: { color: colors.primaryDark, fontSize: typography.body, fontStyle: 'italic', marginTop: spacing.sm }, translation: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 18, marginTop: spacing.xs }, track: { height: 7, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.lg }, fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill }, actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, button: { flex: 1, minHeight: 46, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, buttonDone: { backgroundColor: colors.surfaceMuted }, buttonText: { color: colors.white, fontSize: typography.body, fontWeight: '800' }, buttonTextDone: { color: colors.success }, resetButton: { width: 46, minHeight: 46, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.72 }, disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 17, textAlign: 'center', marginTop: spacing.sm },
});
